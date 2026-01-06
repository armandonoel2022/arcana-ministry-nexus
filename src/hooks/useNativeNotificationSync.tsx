import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Importar LocalNotifications dinámicamente
let LocalNotifications: any = null;

try {
  import('@capacitor/local-notifications').then((module) => {
    LocalNotifications = module.LocalNotifications;
    console.log('📱 [NativeSync] LocalNotifications loaded');
  }).catch(() => {
    console.log('📱 [NativeSync] LocalNotifications not available');
  });
} catch (e) {
  console.log('📱 [NativeSync] Capacitor not available');
}

// Helper para detectar plataforma nativa
const isNativePlatform = () => {
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.isNativePlatform?.();
};

interface SystemNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  priority: number;
  notification_category: string | null;
  metadata: any;
  created_at: string;
  recipient_id: string | null;
  is_read: boolean;
}

// Tipos de notificación que deben mostrar overlay
const overlayTypes = [
  'service_overlay',
  'daily_verse',
  'daily_advice',
  'death_announcement',
  'meeting_announcement',
  'special_service',
  'prayer_request',
  'blood_donation',
  'extraordinary_rehearsal',
  'ministry_instructions',
  'birthday',
  'birthday_daily',
  'pregnancy_reveal',
  'birth_announcement',
  'director_change',
  'special_event',
  'general_announcement',
  'voice_replacement',
  'womens_day',
];

// Función helper para generar hash numérico de un string (ID para notificaciones nativas)
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) % 2147483647;
}

export const useNativeNotificationSync = () => {
  const { user } = useAuth();
  const syncedNotificationsRef = useRef<Set<string>>(new Set());

  // Función para mostrar notificación local nativa
  const showNativeNotification = useCallback(async (notification: SystemNotification) => {
    if (!isNativePlatform() || !LocalNotifications) {
      console.log('📱 [NativeSync] Not on native platform or LocalNotifications not available');
      return;
    }

    // Evitar duplicados
    if (syncedNotificationsRef.current.has(notification.id)) {
      console.log('📱 [NativeSync] Notification already synced:', notification.id);
      return;
    }

    try {
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        console.log('📱 [NativeSync] Permission not granted, requesting...');
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== 'granted') {
          console.log('📱 [NativeSync] Permission denied');
          return;
        }
      }

      const notificationId = hashCode(notification.id);
      const showOverlay = overlayTypes.includes(notification.type);

      console.log(`📱 [NativeSync] Scheduling local notification: ${notification.title}`);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: notification.title,
            body: notification.message,
            schedule: { at: new Date(Date.now() + 100) },
            sound: 'notification.wav',
            smallIcon: 'ic_arcana_notification',
            largeIcon: 'ic_arcana_notification',
            extra: {
              notificationId: notification.id,
              type: notification.type,
              showOverlay: showOverlay,
              metadata: notification.metadata,
              title: notification.title,
              message: notification.message,
            },
            threadIdentifier: `arcana-${notification.type}`,
            relevanceScore: notification.priority === 3 ? 1.0 : 0.5,
            actionTypeId: showOverlay ? 'OPEN_OVERLAY' : 'DEFAULT',
          }
        ]
      });

      syncedNotificationsRef.current.add(notification.id);
      console.log(`✅ [NativeSync] Local notification scheduled: ${notification.title}`);
    } catch (error) {
      console.error('❌ [NativeSync] Error showing native notification:', error);
    }
  }, []);

  // Función para eliminar notificación nativa cuando se marca como leída
  const removeNativeNotification = useCallback(async (notificationId: string) => {
    if (!isNativePlatform() || !LocalNotifications) return;

    try {
      const nativeId = hashCode(notificationId);
      await LocalNotifications.cancel({ notifications: [{ id: nativeId }] });
      syncedNotificationsRef.current.delete(notificationId);
      console.log(`🗑️ [NativeSync] Removed native notification: ${notificationId}`);
    } catch (error) {
      console.error('❌ [NativeSync] Error removing native notification:', error);
    }
  }, []);

  // Cargar notificaciones no leídas al iniciar
  useEffect(() => {
    if (!user || !isNativePlatform()) return;

    const loadUnreadNotifications = async () => {
      console.log('📱 [NativeSync] Loading unread notifications...');
      
      try {
        const { data: notifications, error } = await supabase
          .from('system_notifications')
          .select('*')
          .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('❌ [NativeSync] Error loading notifications:', error);
          return;
        }

        console.log(`📱 [NativeSync] Found ${notifications?.length || 0} unread notifications`);

        // Mostrar cada notificación no leída como nativa
        for (const notification of notifications || []) {
          await showNativeNotification(notification as SystemNotification);
        }
      } catch (error) {
        console.error('❌ [NativeSync] Error in loadUnreadNotifications:', error);
      }
    };

    // Esperar a que LocalNotifications esté disponible
    const checkAndLoad = () => {
      if (LocalNotifications) {
        loadUnreadNotifications();
      } else {
        setTimeout(checkAndLoad, 500);
      }
    };

    checkAndLoad();
  }, [user, showNativeNotification]);

  // Configurar listeners para notificaciones locales
  useEffect(() => {
    if (!isNativePlatform() || !LocalNotifications) return;

    const setupListeners = async () => {
      await LocalNotifications.addListener('localNotificationActionPerformed', (action: any) => {
        console.log('📱 [NativeSync] Notification action performed:', action);
        
        const extra = action.notification?.extra || {};
        
        // Marcar como leída en la base de datos
        if (extra.notificationId) {
          supabase
            .from('system_notifications')
            .update({ is_read: true })
            .eq('id', extra.notificationId)
            .then(({ error }) => {
              if (error) {
                console.error('❌ [NativeSync] Error marking as read:', error);
              } else {
                console.log('✅ [NativeSync] Marked as read:', extra.notificationId);
              }
            });
        }
        
        if (extra.showOverlay && extra.type) {
          window.dispatchEvent(new CustomEvent('showOverlay', {
            detail: {
              id: extra.notificationId || `native-${Date.now()}`,
              type: extra.type,
              title: extra.title || '',
              message: extra.message || '',
              metadata: extra.metadata || {},
            }
          }));
        }
      });

      console.log('📱 [NativeSync] Local notification listeners configured');
    };

    setupListeners();

    return () => {
      if (LocalNotifications) {
        LocalNotifications.removeAllListeners();
      }
    };
  }, []);

  // Suscribirse a cambios en system_notifications (INSERT y UPDATE)
  useEffect(() => {
    if (!user) {
      console.log('📱 [NativeSync] No user, skipping subscription');
      return;
    }

    console.log('📱 [NativeSync] Setting up realtime subscription for user:', user.id);

    const channel = supabase
      .channel('native-notification-sync')
      // Escuchar nuevas notificaciones
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications',
        },
        async (payload) => {
          console.log('📱 [NativeSync] New notification received:', payload);
          
          const notification = payload.new as SystemNotification;
          
          if (notification.recipient_id !== null && notification.recipient_id !== user.id) {
            console.log('📱 [NativeSync] Notification not for this user, ignoring');
            return;
          }

          await showNativeNotification(notification);
        }
      )
      // Escuchar cuando se marcan como leídas
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'system_notifications',
        },
        async (payload) => {
          const notification = payload.new as SystemNotification;
          
          // Si se marcó como leída, eliminar la notificación nativa
          if (notification.is_read) {
            console.log('📱 [NativeSync] Notification marked as read:', notification.id);
            await removeNativeNotification(notification.id);
          }
        }
      )
      .subscribe((status) => {
        console.log('📱 [NativeSync] Subscription status:', status);
      });

    return () => {
      console.log('📱 [NativeSync] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user, showNativeNotification, removeNativeNotification]);

  return {
    showNativeNotification,
    removeNativeNotification,
  };
};

export default useNativeNotificationSync;

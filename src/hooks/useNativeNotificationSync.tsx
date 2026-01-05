import { useEffect, useCallback } from 'react';
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

export const useNativeNotificationSync = () => {
  const { user } = useAuth();

  // Función para mostrar notificación local nativa
  const showNativeNotification = useCallback(async (notification: SystemNotification) => {
    if (!isNativePlatform() || !LocalNotifications) {
      console.log('📱 [NativeSync] Not on native platform or LocalNotifications not available');
      return;
    }

    try {
      // Verificar permisos
      const permStatus = await LocalNotifications.checkPermissions();
      if (permStatus.display !== 'granted') {
        console.log('📱 [NativeSync] Permission not granted, requesting...');
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== 'granted') {
          console.log('📱 [NativeSync] Permission denied');
          return;
        }
      }

      // Crear ID único para la notificación (debe ser número para iOS)
      const notificationId = Math.abs(hashCode(notification.id)) % 2147483647;

      // Determinar si debe mostrar overlay
      const showOverlay = overlayTypes.includes(notification.type);

      console.log(`📱 [NativeSync] Scheduling local notification: ${notification.title}`);

      await LocalNotifications.schedule({
        notifications: [
          {
            id: notificationId,
            title: notification.title,
            body: notification.message,
            schedule: { at: new Date(Date.now() + 100) }, // Mostrar inmediatamente
            sound: 'notification.wav',
            smallIcon: 'ic_arcana_notification',
            largeIcon: 'ic_arcana_notification',
            // Datos extra para cuando el usuario toque la notificación
            extra: {
              notificationId: notification.id,
              type: notification.type,
              showOverlay: showOverlay,
              metadata: notification.metadata,
              title: notification.title,
              message: notification.message,
            },
            // iOS specific
            threadIdentifier: `arcana-${notification.type}`,
            relevanceScore: notification.priority === 3 ? 1.0 : 0.5,
            // Action type
            actionTypeId: showOverlay ? 'OPEN_OVERLAY' : 'DEFAULT',
          }
        ]
      });

      console.log(`✅ [NativeSync] Local notification scheduled: ${notification.title}`);
    } catch (error) {
      console.error('❌ [NativeSync] Error showing native notification:', error);
    }
  }, []);

  // Configurar listeners para notificaciones locales
  useEffect(() => {
    if (!isNativePlatform() || !LocalNotifications) return;

    const setupListeners = async () => {
      // Listener cuando el usuario toca una notificación
      await LocalNotifications.addListener('localNotificationActionPerformed', (action: any) => {
        console.log('📱 [NativeSync] Notification action performed:', action);
        
        const extra = action.notification?.extra || {};
        
        if (extra.showOverlay && extra.type) {
          // Disparar evento para mostrar overlay
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

  // Suscribirse a cambios en system_notifications
  useEffect(() => {
    if (!user) {
      console.log('📱 [NativeSync] No user, skipping subscription');
      return;
    }

    console.log('📱 [NativeSync] Setting up realtime subscription for user:', user.id);

    const channel = supabase
      .channel('native-notification-sync')
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
          
          // Verificar si la notificación es para este usuario o es broadcast
          if (notification.recipient_id !== null && notification.recipient_id !== user.id) {
            console.log('📱 [NativeSync] Notification not for this user, ignoring');
            return;
          }

          // Mostrar notificación local nativa
          await showNativeNotification(notification);
        }
      )
      .subscribe((status) => {
        console.log('📱 [NativeSync] Subscription status:', status);
      });

    return () => {
      console.log('📱 [NativeSync] Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [user, showNativeNotification]);

  return {
    showNativeNotification,
  };
};

// Función helper para generar hash numérico de un string
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export default useNativeNotificationSync;

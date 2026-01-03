import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ARCANA_PUSH_CONFIG } from '@/services/notificationService';

// Import Capacitor plugins dynamically
let PushNotifications: any = null;
let LocalNotifications: any = null;

// Try to import Capacitor plugins
try {
  import('@capacitor/push-notifications').then((module) => {
    PushNotifications = module.PushNotifications;
  }).catch(() => {
    console.log('📱 [PushNotifications] Capacitor push-notifications not available');
  });

  import('@capacitor/local-notifications').then((module) => {
    LocalNotifications = module.LocalNotifications;
  }).catch(() => {
    console.log('📱 [PushNotifications] Capacitor local-notifications not available');
  });
} catch (e) {
  console.log('📱 [PushNotifications] Capacitor plugins not available');
}

// Helper to detect if we're in a native app context
const isNativePlatform = () => {
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.isNativePlatform?.();
};

// Helper to get Capacitor core
const getCapacitor = () => {
  if (typeof (window as any).Capacitor !== 'undefined') {
    return (window as any).Capacitor;
  }
  return null;
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceToken, setDeviceToken] = useState<string | null>(null);
  const { user } = useAuth();

  // Check support and current permission
  useEffect(() => {
    const checkSupport = async () => {
      // Check if running on native platform with Capacitor
      if (isNativePlatform()) {
        console.log('📱 [PushNotifications] Detected native platform (Capacitor)');
        setIsSupported(true);
        
        // Try to check current permission status via Capacitor
        try {
          if (PushNotifications) {
            const permStatus = await PushNotifications.checkPermissions();
            console.log('📱 [PushNotifications] Native permission status:', permStatus);
            
            if (permStatus.receive === 'granted') {
              setPermission('granted');
            } else if (permStatus.receive === 'denied') {
              setPermission('denied');
            } else {
              setPermission('default');
            }
          } else {
            // Fallback to localStorage
            const savedPermission = localStorage.getItem('push_notification_permission');
            if (savedPermission) {
              setPermission(savedPermission as 'granted' | 'denied' | 'default');
            }
          }
        } catch (error) {
          console.log('📱 [PushNotifications] Error checking native permissions:', error);
          // Fallback to localStorage
          const savedPermission = localStorage.getItem('push_notification_permission');
          if (savedPermission) {
            setPermission(savedPermission as 'granted' | 'denied' | 'default');
          }
        }
      } else {
        // Web browser - check for Web Push API
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        console.log('📱 [PushNotifications] Web platform, supported:', supported);
        setIsSupported(supported);
        
        if (supported && 'Notification' in window) {
          setPermission(Notification.permission as 'granted' | 'denied' | 'default');
        }
      }
    };

    checkSupport();
  }, []);

  // Set up native push listeners when permission is granted
  useEffect(() => {
    if (!isNativePlatform() || permission !== 'granted' || !PushNotifications) return;

    const setupNativeListeners = async () => {
      try {
        // Registration success
        await PushNotifications.addListener('registration', async (token: { value: string }) => {
          console.log('📱 [PushNotifications] Push registration token:', token.value);
          setDeviceToken(token.value);
          await saveDeviceToken(token.value, 'native');
        });

        // Registration error
        await PushNotifications.addListener('registrationError', (error: any) => {
          console.error('📱 [PushNotifications] Registration error:', error);
        });

        // Push notification received while app is in foreground
        await PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
          console.log('📱 [PushNotifications] Push received (foreground):', notification);
          handleIncomingPush(notification);
        });

        // User tapped on push notification
        await PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
          console.log('📱 [PushNotifications] Push action performed:', action);
          handlePushAction(action);
        });

        console.log('📱 [PushNotifications] Native listeners set up');
      } catch (error) {
        console.error('📱 [PushNotifications] Error setting up listeners:', error);
      }
    };

    setupNativeListeners();

    return () => {
      if (PushNotifications) {
        PushNotifications.removeAllListeners();
      }
    };
  }, [permission]);

  // Listener para mensajes del Service Worker (Web)
  useEffect(() => {
    if (isNativePlatform() || typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleServiceWorkerMessage = (event: MessageEvent) => {
      console.log('📱 [PushNotifications] SW message received:', event.data);
      
      if (!event.data) return;
      
      switch (event.data.type) {
        case 'NOTIFICATION_CLICK':
          // Usuario hizo clic en una notificación - mostrar overlay si corresponde
          const { url, notificationData } = event.data;
          
          if (notificationData?.showOverlay && notificationData?.type) {
            window.dispatchEvent(new CustomEvent('showOverlay', {
              detail: {
                id: notificationData.notificationId || `sw-${Date.now()}`,
                type: notificationData.type,
                title: notificationData.title || '',
                message: notificationData.message || '',
                metadata: notificationData.metadata || {}
              }
            }));
          }
          
          // Navegar si es necesario
          if (url && window.location.pathname !== url) {
            window.location.href = url;
          }
          break;
          
        case 'CHECK_PENDING_NOTIFICATIONS':
          // Disparar evento para que OverlayManager revise notificaciones pendientes
          window.dispatchEvent(new CustomEvent('checkPendingOverlays'));
          break;
      }
    };

    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // Verificar parámetros URL para overlays (cuando app se abre desde notificación)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const showOverlayType = urlParams.get('showOverlay');
    const notificationId = urlParams.get('notificationId');
    
    if (showOverlayType) {
      console.log('📱 [PushNotifications] Opening overlay from URL:', showOverlayType);
      
      // Limpiar parámetros URL sin recargar
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, '', cleanUrl);
      
      // Mostrar overlay después de un pequeño delay para que la app se cargue
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('showOverlay', {
          detail: {
            id: notificationId || `url-${Date.now()}`,
            type: showOverlayType,
            title: '',
            message: '',
            metadata: { fromNotification: true }
          }
        }));
      }, 500);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.log('📱 [PushNotifications] Not supported');
      toast.error('Las notificaciones push no están soportadas en este dispositivo');
      return false;
    }
    
    if (!user) {
      console.log('📱 [PushNotifications] User not logged in');
      toast.error('Debes iniciar sesión para activar las notificaciones');
      return false;
    }

    if (isRegistering) {
      console.log('📱 [PushNotifications] Already registering...');
      return false;
    }

    setIsRegistering(true);

    try {
      if (isNativePlatform()) {
        console.log('📱 [PushNotifications] Requesting native permissions...');
        
        if (PushNotifications) {
          // Request push notification permission
          const permResult = await PushNotifications.requestPermissions();
          console.log('📱 [PushNotifications] Native permission result:', permResult);
          
          if (permResult.receive === 'granted') {
            setPermission('granted');
            localStorage.setItem('push_notification_permission', 'granted');
            
            // Register with APNs/FCM
            await PushNotifications.register();
            console.log('📱 [PushNotifications] Registered with push service');
            
            toast.success('Notificaciones push activadas correctamente');
            setIsRegistering(false);
            return true;
          } else {
            setPermission('denied');
            localStorage.setItem('push_notification_permission', 'denied');
            toast.error('Permiso de notificaciones denegado');
            setIsRegistering(false);
            return false;
          }
        } else if (LocalNotifications) {
          // Fallback to local notifications if push not available
          console.log('📱 [PushNotifications] Using LocalNotifications fallback');
          const permResult = await LocalNotifications.requestPermissions();
          
          if (permResult.display === 'granted') {
            setPermission('granted');
            localStorage.setItem('push_notification_permission', 'granted');
            toast.success('Notificaciones locales activadas');
            setIsRegistering(false);
            return true;
          }
        }
        
        // No plugins available
        console.log('📱 [PushNotifications] No Capacitor notification plugins found');
        toast.error('Las notificaciones no están disponibles en esta versión');
        setIsRegistering(false);
        return false;
        
      } else {
        // Web Push notifications
        console.log('📱 [PushNotifications] Requesting web permissions...');
        const webPermission = await Notification.requestPermission();
        setPermission(webPermission as 'granted' | 'denied' | 'default');
        localStorage.setItem('push_notification_permission', webPermission);
        
        if (webPermission === 'granted') {
          console.log('📱 [PushNotifications] Permission granted, registering service worker...');
          const success = await registerServiceWorker();
          
          if (success) {
            toast.success('Notificaciones push activadas correctamente');
          }
          
          setIsRegistering(false);
          return success;
        } else {
          toast.error('Permiso de notificaciones denegado');
        }
        
        setIsRegistering(false);
        return false;
      }
    } catch (error) {
      console.error('📱 [PushNotifications] Error requesting permission:', error);
      toast.error('Error al configurar notificaciones: ' + (error as Error).message);
      setIsRegistering(false);
      return false;
    }
  }, [isSupported, user, isRegistering]);

  const saveDeviceToken = async (token: string, platform: 'native' | 'web') => {
    if (!user) return;
    
    try {
      const subscriptionData = {
        token,
        platform,
        device_type: isNativePlatform() 
          ? (getCapacitor()?.getPlatform?.() || 'native')
          : 'web',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscriptionData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('📱 [PushNotifications] Error saving device token:', error);
      } else {
        console.log('📱 [PushNotifications] Device token saved successfully');
      }
    } catch (error) {
      console.error('📱 [PushNotifications] Error in saveDeviceToken:', error);
    }
  };

  const handleIncomingPush = (notification: any) => {
    console.log('📱 [PushNotifications] Processing incoming push:', notification);
    
    const data = notification.data || {};
    const notificationType = data.type || 'general';
    
    // Si app está en foreground en native, mostrar notificación local
    if (isNativePlatform() && LocalNotifications) {
      LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title || 'ARCANA',
            body: notification.body || notification.message || '',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 100) },
            smallIcon: 'ic_arcana_notification',
            largeIcon: 'ic_arcana_notification',
            sound: 'notification.wav',
            extra: {
              ...data,
              showOverlay: data.show_overlay || overlayTypes.includes(notificationType)
            },
            // Configuración específica para iOS
            attachments: undefined,
            actionTypeId: 'arcana-notification',
            // Grupo para iOS
            threadIdentifier: `arcana-${notificationType}`,
            // Relevancia para iOS 15+
            relevanceScore: 1.0
          }
        ]
      });
    }

    // Disparar overlay si es un tipo que lo requiere
    if (data.show_overlay || overlayTypes.includes(notificationType)) {
      window.dispatchEvent(new CustomEvent('showOverlay', {
        detail: {
          id: data.id || `push-${Date.now()}`,
          type: notificationType,
          title: notification.title || data.title || '',
          message: notification.body || data.message || '',
          metadata: data.metadata || {}
        }
      }));
    }
  };

  const handlePushAction = (action: any) => {
    console.log('📱 [PushNotifications] Handling push action:', action);
    
    const data = action.notification?.data || action.notification?.extra || {};
    const notificationType = data.type || 'general';
    
    // Mostrar overlay si está indicado
    if (data.showOverlay || overlayTypes.includes(notificationType)) {
      window.dispatchEvent(new CustomEvent('showOverlay', {
        detail: {
          id: data.id || `action-${Date.now()}`,
          type: notificationType,
          title: action.notification?.title || data.title || '',
          message: action.notification?.body || data.message || '',
          metadata: data.metadata || data
        }
      }));
    }
    
    // Navegar a la pantalla correspondiente
    if (data.click_action) {
      window.location.href = data.click_action;
    } else if (data.url) {
      window.location.href = data.url;
    } else if (data.type && ARCANA_PUSH_CONFIG.actions[data.type as keyof typeof ARCANA_PUSH_CONFIG.actions]) {
      const actionConfig = ARCANA_PUSH_CONFIG.actions[data.type as keyof typeof ARCANA_PUSH_CONFIG.actions];
      window.location.href = actionConfig.click_action;
    }
  };

  const registerServiceWorker = async (): Promise<boolean> => {
    try {
      console.log('📱 [PushNotifications] Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('📱 [PushNotifications] Service Worker registered:', registration);
      await navigator.serviceWorker.ready;
      console.log('📱 [PushNotifications] Service Worker ready');

      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('📱 [PushNotifications] Creating new push subscription...');
        
        // VAPID key - in production, generate your own keys with: npx web-push generate-vapid-keys
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        
        console.log('📱 [PushNotifications] Push subscription created:', subscription);
      }

      await saveSubscription(subscription);
      return true;
    } catch (error) {
      console.error('📱 [PushNotifications] Error registering Service Worker:', error);
      return false;
    }
  };

  const saveSubscription = async (subscription: PushSubscription) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: {
            ...subscription.toJSON(),
            platform: 'web'
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('📱 [PushNotifications] Error saving subscription:', error);
      } else {
        console.log('📱 [PushNotifications] Push subscription saved successfully');
      }
    } catch (error) {
      console.error('📱 [PushNotifications] Error in saveSubscription:', error);
    }
  };

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      if (isNativePlatform()) {
        if (PushNotifications) {
          await PushNotifications.removeAllListeners();
        }
      } else {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        
        if (subscription) {
          await subscription.unsubscribe();
        }
      }
      
      // Remove from database
      if (user) {
        await supabase
          .from('user_push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }
      
      setPermission('default');
      setDeviceToken(null);
      localStorage.removeItem('push_notification_permission');
      toast.success('Notificaciones desactivadas');
      return true;
    } catch (error) {
      console.error('📱 [PushNotifications] Error unsubscribing:', error);
      toast.error('Error al desactivar notificaciones');
      return false;
    }
  }, [user]);

  // Send a local notification (works on both web and native)
  const sendLocalNotification = useCallback(async (options: {
    title: string;
    body: string;
    data?: Record<string, any>;
    tag?: string;
  }): Promise<boolean> => {
    try {
      if (permission !== 'granted') {
        console.log('📱 [PushNotifications] Permission not granted');
        return false;
      }

      if (isNativePlatform() && LocalNotifications) {
        // Native local notification
        await LocalNotifications.schedule({
          notifications: [
            {
              title: options.title,
              body: options.body,
              id: Date.now(),
              schedule: { at: new Date(Date.now() + 100) },
              smallIcon: 'arcana_notification_icon',
              largeIcon: 'arcana_notification_icon',
              sound: 'notification.wav',
              extra: options.data || {},
              group: options.tag || 'arcana'
            }
          ]
        });
        return true;
      } else if ('Notification' in window) {
        // Web notification
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(options.title, {
          body: options.body,
          icon: ARCANA_PUSH_CONFIG.icon,
          badge: ARCANA_PUSH_CONFIG.badge,
          tag: options.tag || ARCANA_PUSH_CONFIG.tag,
          data: options.data
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('📱 [PushNotifications] Error sending local notification:', error);
      return false;
    }
  }, [permission]);

  return {
    isSupported,
    permission,
    isRegistering,
    deviceToken,
    requestPermission,
    unsubscribe,
    sendLocalNotification
  };
};

// Types that should trigger overlay display
const overlayTypes = [
  'service_overlay',
  'daily_verse',
  'daily_advice',
  'birthday',
  'death_announcement',
  'meeting_announcement',
  'special_service',
  'prayer_request',
  'blood_donation',
  'extraordinary_rehearsal',
  'ministry_instructions',
];

function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray as BufferSource;
}

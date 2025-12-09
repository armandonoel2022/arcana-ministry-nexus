import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Helper to detect if we're in a native app context
const isNativePlatform = () => {
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.isNativePlatform?.();
};

// Helper to get Capacitor plugins
const getCapacitorPlugins = () => {
  if (typeof (window as any).Capacitor !== 'undefined') {
    return (window as any).Capacitor.Plugins || {};
  }
  return {};
};

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [isRegistering, setIsRegistering] = useState(false);
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
          const { PushNotifications } = getCapacitorPlugins();
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
        
        const { PushNotifications, LocalNotifications } = getCapacitorPlugins();
        
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
            
            // Setup listeners for push notifications
            PushNotifications.addListener('registration', (token: any) => {
              console.log('📱 [PushNotifications] Push registration token:', token.value);
              // Save token to database for backend push
              saveDeviceToken(token.value);
            });

            PushNotifications.addListener('registrationError', (error: any) => {
              console.error('📱 [PushNotifications] Registration error:', error);
              toast.error('Error al registrar notificaciones push');
            });

            PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
              console.log('📱 [PushNotifications] Push received:', notification);
              // Show in-app notification or trigger overlay
              handleIncomingPush(notification);
            });

            PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
              console.log('📱 [PushNotifications] Push action performed:', notification);
            });
            
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

  const saveDeviceToken = async (token: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: { token, platform: 'native' },
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
    // Dispatch custom event to trigger overlay
    const data = notification.data || {};
    if (data.type && data.type.includes('overlay')) {
      window.dispatchEvent(new CustomEvent('showOverlay', {
        detail: {
          id: data.id || `push-${Date.now()}`,
          type: data.type,
          title: notification.title || data.title || '',
          message: notification.body || data.message || '',
          metadata: data.metadata || {}
        }
      }));
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
          subscription: subscription.toJSON(),
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
        const { PushNotifications } = getCapacitorPlugins();
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
      localStorage.removeItem('push_notification_permission');
      toast.success('Notificaciones desactivadas');
      return true;
    } catch (error) {
      console.error('📱 [PushNotifications] Error unsubscribing:', error);
      toast.error('Error al desactivar notificaciones');
      return false;
    }
  }, [user]);

  return {
    isSupported,
    permission,
    isRegistering,
    requestPermission,
    unsubscribe
  };
};

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

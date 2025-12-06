import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Helper to detect if we're in a native app context
const isNativePlatform = () => {
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.isNativePlatform?.();
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
        setIsSupported(true);
        // Load saved permission state
        const savedPermission = localStorage.getItem('push_notification_permission');
        if (savedPermission) {
          setPermission(savedPermission as 'granted' | 'denied' | 'default');
        }
      } else {
        // Web browser - check for Web Push API
        const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
        setIsSupported(supported);
        
        if (supported && 'Notification' in window) {
          setPermission(Notification.permission as 'granted' | 'denied' | 'default');
        }
      }
    };

    checkSupport();
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      console.log('Push notifications not supported or user not logged in');
      return false;
    }

    if (isRegistering) {
      console.log('Already registering...');
      return false;
    }

    setIsRegistering(true);

    try {
      if (isNativePlatform()) {
        // Native push notifications - handled via Capacitor in the native project
        // For now, we'll use local storage to track the permission state
        // The actual Capacitor plugin configuration is done in the native iOS/Android project
        
        console.log('Native platform detected - push notifications configured in native project');
        
        // Set permission as granted since native handles this
        setPermission('granted');
        localStorage.setItem('push_notification_permission', 'granted');
        
        setIsRegistering(false);
        return true;
      } else {
        // Web Push notifications
        const webPermission = await Notification.requestPermission();
        setPermission(webPermission as 'granted' | 'denied' | 'default');
        localStorage.setItem('push_notification_permission', webPermission);
        
        if (webPermission === 'granted') {
          console.log('Permission granted, registering service worker...');
          const success = await registerServiceWorker();
          setIsRegistering(false);
          return success;
        }
        
        setIsRegistering(false);
        return false;
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      setIsRegistering(false);
      return false;
    }
  }, [isSupported, user, isRegistering]);

  const registerServiceWorker = async (): Promise<boolean> => {
    try {
      console.log('Registering service worker...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered:', registration);
      await navigator.serviceWorker.ready;
      console.log('Service Worker ready');

      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('Creating new push subscription...');
        
        // VAPID key - in production, generate your own keys with: npx web-push generate-vapid-keys
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        
        console.log('Push subscription created:', subscription);
      }

      await saveSubscription(subscription);
      return true;
    } catch (error) {
      console.error('Error registering Service Worker:', error);
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
        console.error('Error saving subscription:', error);
      } else {
        console.log('Push subscription saved successfully');
      }
    } catch (error) {
      console.error('Error in saveSubscription:', error);
    }
  };

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      if (!isNativePlatform()) {
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
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
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
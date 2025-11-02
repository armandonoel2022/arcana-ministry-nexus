import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isRegistering, setIsRegistering] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const checkSupport = () => {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      
      if (supported && 'Notification' in window) {
        setPermission(Notification.permission);
      }
    };

    checkSupport();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
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
      const permission = await Notification.requestPermission();
      setPermission(permission);
      
      if (permission === 'granted') {
        console.log('Permission granted, registering service worker...');
        const success = await registerServiceWorker();
        setIsRegistering(false);
        return success;
      }
      
      setIsRegistering(false);
      return false;
    } catch (error) {
      console.error('Error requesting permission:', error);
      setIsRegistering(false);
      return false;
    }
  };

  const registerServiceWorker = async (): Promise<boolean> => {
    try {
      console.log('Registering service worker...');
      
      // Registrar el service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('Service Worker registered:', registration);

      // Esperar a que el service worker esté activo
      await navigator.serviceWorker.ready;
      console.log('Service Worker ready');

      // Obtener la suscripción push existente
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        console.log('Creating new push subscription...');
        
        // Nota: Para producción, necesitarás generar tus propias VAPID keys
        // Ejecuta: npx web-push generate-vapid-keys
        // Por ahora, usamos una clave de ejemplo (debes reemplazarla)
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        
        console.log('Push subscription created:', subscription);
      } else {
        console.log('Using existing push subscription');
      }

      // Guardar suscripción en Supabase
      await saveSubscription(subscription);
      
      return true;
    } catch (error) {
      console.error('Error registering Service Worker:', error);
      return false;
    }
  };

  const saveSubscription = async (subscription: PushSubscription) => {
    if (!user) {
      console.log('No user to save subscription for');
      return;
    }

    try {
      console.log('Saving push subscription to database...');
      
      const { error } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,subscription'
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

  const unsubscribe = async (): Promise<boolean> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Eliminar de la base de datos
        if (user) {
          await supabase
            .from('user_push_subscriptions')
            .delete()
            .eq('user_id', user.id);
        }
        
        setPermission('default');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    isRegistering,
    requestPermission,
    unsubscribe
  };
};

// Función helper para convertir la clave VAPID de base64 a Uint8Array
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

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

  // Efecto para cargar token existente y guardar token pendiente cuando el usuario se autentica
  useEffect(() => {
    const loadExistingTokenAndSavePending = async () => {
      if (!user) return;
      
      // Primero intentar cargar el token existente desde la base de datos
      try {
        const { data: existingDevice } = await supabase
          .from('user_devices')
          .select('device_token')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (existingDevice?.device_token) {
          console.log('📱 [PushNotifications] Token existente cargado desde DB');
          setDeviceToken(existingDevice.device_token);
        }
        
        // También revisar en user_push_subscriptions para web
        const { data: existingSubscription } = await supabase
          .from('user_push_subscriptions')
          .select('subscription')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (existingSubscription?.subscription) {
          const sub = existingSubscription.subscription as any;
          if (sub.token || sub.endpoint) {
            console.log('📱 [PushNotifications] Subscription existente cargada desde DB');
            setDeviceToken(sub.token || sub.endpoint?.substring(0, 50) || 'web-registered');
          }
        }
      } catch (error) {
        console.error('📱 [PushNotifications] Error cargando token existente:', error);
      }
      
      // Luego procesar token pendiente si existe
      const pendingToken = localStorage.getItem('pending_device_token');
      if (!pendingToken) return;
      
      console.log('📱 [PushNotifications] Usuario autenticado, guardando token pendiente...');
      
      try {
        // Guardar en user_push_subscriptions
        const subscriptionData = {
          token: pendingToken,
          platform: 'native',
          device_type: isNativePlatform() 
            ? (getCapacitor()?.getPlatform?.() || 'ios')
            : 'web',
          updated_at: new Date().toISOString()
        };

        const { error: subsError } = await supabase
          .from('user_push_subscriptions')
          .upsert({
            user_id: user.id,
            subscription: subscriptionData,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (subsError) {
          console.error('📱 [PushNotifications] Error guardando token pendiente (subscriptions):', subsError);
        } else {
          console.log('📱 [PushNotifications] Token pendiente guardado en user_push_subscriptions');
        }

        // Guardar en user_devices (para iOS push)
        const { error: devicesError } = await supabase
          .from('user_devices')
          .upsert(
            {
              user_id: user.id,
              device_token: pendingToken,
              platform: 'ios',
              is_active: true,
              last_active: new Date().toISOString(),
            },
            { onConflict: 'user_id,device_token' }
          );

        if (devicesError) {
          console.error('📱 [PushNotifications] Error guardando token pendiente (devices):', devicesError);
        } else {
          console.log('📱 [PushNotifications] Token pendiente guardado en user_devices');
          // Solo eliminar si ambos guardados fueron exitosos
          localStorage.removeItem('pending_device_token');
          setDeviceToken(pendingToken);
        }
      } catch (error) {
        console.error('📱 [PushNotifications] Error procesando token pendiente:', error);
      }
    };

    loadExistingTokenAndSavePending();
  }, [user]);

  // Set up native push listeners when permission is granted
  useEffect(() => {
    if (!isNativePlatform() || permission !== 'granted' || !PushNotifications) return;

    const setupNativeListeners = async () => {
      try {
        // Registration success
        await PushNotifications.addListener('registration', async (token: { value: string }) => {
          console.log('📱 [PushNotifications] Push registration token:', token.value);
          setDeviceToken(token.value);
          
          // Siempre guardar token en localStorage para casos donde user aún no está disponible
          localStorage.setItem('pending_device_token', token.value);
          console.log('📱 [PushNotifications] Token guardado en localStorage como pendiente');
          
          // Intentar guardar inmediatamente si hay usuario
          if (user) {
            await saveDeviceToken(token.value, 'native');
          } else {
            console.log('📱 [PushNotifications] Usuario no disponible aún, token pendiente para guardar');
          }
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
  }, [permission, user]);

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
      // 1) Guardar en la tabla existente (web/native) para compatibilidad
      const subscriptionData = {
        token,
        platform,
        device_type: isNativePlatform() 
          ? (getCapacitor()?.getPlatform?.() || 'native')
          : 'web',
        updated_at: new Date().toISOString()
      };

      const { error: subsError } = await supabase
        .from('user_push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscriptionData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (subsError) {
        console.error('📱 [PushNotifications] Error saving device token (user_push_subscriptions):', subsError);
      } else {
        console.log('📱 [PushNotifications] Device token saved successfully (user_push_subscriptions)');
      }

      // 2) NUEVO: Guardar también en user_devices (requerido por envío de push iOS)
      if (isNativePlatform()) {
        const { error: devicesError } = await supabase
          .from('user_devices')
          .upsert(
            {
              user_id: user.id,
              device_token: token,
              platform: 'ios',
              is_active: true,
              last_active: new Date().toISOString(),
            },
            { onConflict: 'user_id,device_token' }
          );

        if (devicesError) {
          console.error('📱 [PushNotifications] Error saving token (user_devices):', devicesError);
        } else {
          console.log('📱 [PushNotifications] Token saved successfully (user_devices)');
        }
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

      let subscription = await (registration as any).pushManager.getSubscription();
      
      if (!subscription) {
        console.log('📱 [PushNotifications] Creating new push subscription...');
        
        // VAPID key - in production, generate your own keys with: npx web-push generate-vapid-keys
        const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';
        
        subscription = await (registration as any).pushManager.subscribe({
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
        const subscription = await (registration as any).pushManager.getSubscription();
        
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

  // Helper: Check for native token stored in UserDefaults via Preferences
  const checkNativeToken = async (): Promise<string | null> => {
    try {
      // En iOS, el AppDelegate guarda el token en UserDefaults
      // Capacitor Preferences puede acceder a UserDefaults
      const { Preferences } = await import('@capacitor/preferences');
      
      // Intentar leer desde Capacitor Preferences (que mapea a UserDefaults)
      const { value: nativeToken } = await Preferences.get({ key: 'apns_device_token' });
      if (nativeToken) {
        console.log('📱 [PushNotifications] Token encontrado en Preferences:', nativeToken.substring(0, 20) + '...');
        return nativeToken;
      }
      
      // Fallback: también revisar pending_device_token_native
      const { value: pendingNative } = await Preferences.get({ key: 'pending_device_token_native' });
      if (pendingNative) {
        console.log('📱 [PushNotifications] Token pendiente nativo encontrado:', pendingNative.substring(0, 20) + '...');
        return pendingNative;
      }
    } catch (e) {
      console.log('📱 [PushNotifications] Preferences plugin no disponible');
    }
    
    // Fallback final: localStorage
    const localToken = localStorage.getItem('pending_device_token');
    if (localToken) {
      console.log('📱 [PushNotifications] Token encontrado en localStorage:', localToken.substring(0, 20) + '...');
      return localToken;
    }
    
    return null;
  };

  // Force re-register device token (useful when token wasn't saved properly)
  const forceReRegister = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !user) {
      console.log('📱 [PushNotifications] Cannot force re-register: not supported or no user');
      return false;
    }

    setIsRegistering(true);
    
    try {
      if (isNativePlatform()) {
        console.log('📱 [PushNotifications] Force re-registering native device...');
        
        if (PushNotifications) {
          // Remove all listeners first to avoid duplicates
          await PushNotifications.removeAllListeners();
          
          // PRIMERO: Verificar si ya hay un token en UserDefaults/Preferences
          const existingNativeToken = await checkNativeToken();
          if (existingNativeToken) {
            console.log('📱 [PushNotifications] Usando token existente de native storage');
            await saveDeviceToken(existingNativeToken, 'native');
            setDeviceToken(existingNativeToken);
            toast.success('✅ Dispositivo registrado correctamente');
            setIsRegistering(false);
            return true;
          }
          
          // Si no hay token existente, intentar registrar con APNs
          const tokenPromise = new Promise<string>((resolve, reject) => {
            const timeoutId = setTimeout(async () => {
              // Antes de fallar, intentar leer de nuevo el token nativo
              const lastChanceToken = await checkNativeToken();
              if (lastChanceToken) {
                resolve(lastChanceToken);
              } else {
                reject(new Error('Token timeout - verifica AppDelegate.swift'));
              }
            }, 10000); // 10 second timeout
            
            PushNotifications.addListener('registration', async (token: { value: string }) => {
              clearTimeout(timeoutId);
              console.log('📱 [PushNotifications] Force re-register - Token received:', token.value);
              
              // Save immediately
              await saveDeviceToken(token.value, 'native');
              localStorage.setItem('pending_device_token', token.value);
              
              resolve(token.value);
            });
            
            PushNotifications.addListener('registrationError', (error: any) => {
              clearTimeout(timeoutId);
              console.error('📱 [PushNotifications] Force re-register error:', error);
              reject(error);
            });
          });
          
          // Trigger registration
          await PushNotifications.register();
          console.log('📱 [PushNotifications] Force re-register triggered, waiting for token...');
          
          // Wait for token
          const receivedToken = await tokenPromise;
          setDeviceToken(receivedToken);
          toast.success('✅ Dispositivo registrado correctamente');
          
          setIsRegistering(false);
          return true;
        }
      } else {
        // Web - re-register service worker
        console.log('📱 [PushNotifications] Force re-registering web push...');
        const success = await registerServiceWorker();
        
        if (success) {
          // Cargar el token/subscription recién guardado desde la DB
          const { data: subscription } = await supabase
            .from('user_push_subscriptions')
            .select('subscription')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (subscription?.subscription) {
            const sub = subscription.subscription as any;
            setDeviceToken(sub.endpoint?.substring(0, 50) || 'web-registered');
          }
          
          toast.success('✅ Dispositivo registrado correctamente');
        }
        
        setIsRegistering(false);
        return success;
      }
      
      setIsRegistering(false);
      return false;
    } catch (error) {
      console.error('📱 [PushNotifications] Error in forceReRegister:', error);
      toast.error('Error al registrar dispositivo: ' + (error as Error).message);
      setIsRegistering(false);
      return false;
    }
  }, [isSupported, user]);

  return {
    isSupported,
    permission,
    isRegistering,
    deviceToken,
    requestPermission,
    unsubscribe,
    sendLocalNotification,
    forceReRegister
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

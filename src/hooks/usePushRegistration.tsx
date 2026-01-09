import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Helper para detectar plataforma nativa
const isNativePlatform = () => {
  return typeof (window as any).Capacitor !== 'undefined' && 
         (window as any).Capacitor.isNativePlatform?.();
};

export const usePushRegistration = () => {
  const { user } = useAuth();
  const hasRegisteredRef = useRef(false);
  const currentTokenRef = useRef<string | null>(null);

  useEffect(() => {
    // Solo ejecutar en plataforma nativa y cuando hay usuario autenticado
    if (!isNativePlatform() || !user) {
      console.log('📱 [PushReg] Skipping - not native or no user');
      return;
    }

    // Evitar registros duplicados
    if (hasRegisteredRef.current) {
      console.log('📱 [PushReg] Already registered');
      return;
    }

    const registerDevice = async () => {
      try {
        console.log('📱 [PushReg] Starting push registration for user:', user.id);
        
        const { PushNotifications } = await import('@capacitor/push-notifications');

        // Primero configurar listener para recibir token ANTES de registrar
        await PushNotifications.addListener('registration', async (token) => {
          console.log('🔑 [PushReg] Token received:', token.value?.substring(0, 20) + '...');
          currentTokenRef.current = token.value;
          
          if (!token.value) {
            console.error('❌ [PushReg] Empty token received');
            return;
          }

          // Guardar token en Supabase
          try {
            console.log('💾 [PushReg] Saving token to Supabase for user:', user.id);
            
            const { error } = await supabase.from('user_devices').upsert(
              {
                user_id: user.id,
                device_token: token.value,
                platform: 'ios',
                is_active: true,
                last_active: new Date().toISOString(),
              },
              { onConflict: 'user_id,device_token' }
            );

            if (error) {
              console.error('❌ [PushReg] Error saving token:', error);
            } else {
              console.log('✅ [PushReg] Token saved successfully!');
              hasRegisteredRef.current = true;
            }
          } catch (saveError) {
            console.error('❌ [PushReg] Error in saveToken:', saveError);
          }
        });

        // Listener para errores de registro
        await PushNotifications.addListener('registrationError', (error) => {
          console.error('❌ [PushReg] Registration error:', error);
        });

        // Verificar permisos
        const status = await PushNotifications.checkPermissions();
        console.log('📱 [PushReg] Permission status:', status.receive);

        if (status.receive !== 'granted') {
          console.log('📱 [PushReg] Requesting permissions...');
          const result = await PushNotifications.requestPermissions();
          if (result.receive !== 'granted') {
            console.log('❌ [PushReg] Permissions denied');
            return;
          }
          console.log('✅ [PushReg] Permissions granted');
        }

        // Registrar para push - esto disparará el listener 'registration'
        console.log('📱 [PushReg] Calling register()...');
        await PushNotifications.register();
        console.log('✅ [PushReg] Register called successfully');

      } catch (error) {
        console.error('❌ [PushReg] Error in registerDevice:', error);
      }
    };

    // Ejecutar con un pequeño delay para asegurar que todo esté cargado
    const timeoutId = setTimeout(registerDevice, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user]);

  // También verificar token pendiente cuando cambia el usuario
  useEffect(() => {
    if (!user) return;

    const checkPendingToken = async () => {
      const pendingToken = localStorage.getItem('pending_device_token');
      if (pendingToken) {
        console.log('📱 [PushReg] Found pending token, saving...');
        try {
          const { error } = await supabase.from('user_devices').upsert(
            {
              user_id: user.id,
              device_token: pendingToken,
              platform: 'ios',
              is_active: true,
              last_active: new Date().toISOString(),
            },
            { onConflict: 'user_id,device_token' }
          );

          if (!error) {
            console.log('✅ [PushReg] Pending token saved');
            localStorage.removeItem('pending_device_token');
          }
        } catch (error) {
          console.error('❌ [PushReg] Error saving pending token:', error);
        }
      }
    };

    checkPendingToken();
  }, [user]);

  return {
    currentToken: currentTokenRef.current,
    isRegistered: hasRegisteredRef.current,
  };
};

export default usePushRegistration;

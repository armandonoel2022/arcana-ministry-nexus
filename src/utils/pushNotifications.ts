import { supabase } from '@/integrations/supabase/client';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
}

export interface SendPushResult {
  success: boolean;
  sentCount?: number;
  totalDevices?: number;
  results?: any[];
  error?: any;
}

/**
 * Envía push notifications a todos los dispositivos iOS registrados
 */
export const sendiOSPushNotification = async (notification: PushNotificationPayload): Promise<SendPushResult> => {
  try {
    console.log('📱 Enviando push iOS a todos los dispositivos...');

    // Obtener TODOS los device tokens de iOS
    const { data: devices, error } = await supabase
      .from('user_devices')
      .select('device_token, user_id')
      .eq('platform', 'ios')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error obteniendo devices:', error);
      return { success: false, error };
    }

    if (!devices || devices.length === 0) {
      console.log('ℹ️ No hay dispositivos iOS registrados');
      return { success: false, error: 'No iOS devices found' };
    }

    console.log(`📱 Encontrados ${devices.length} dispositivos iOS`);

    // Enviar push a CADA dispositivo
    const results: any[] = [];
    const errors: any[] = [];

    for (const device of devices) {
      if (device.device_token && device.device_token.length > 10) {
        try {
          console.log(`📤 Enviando a: ${device.device_token.substring(0, 15)}...`);
          
          const result = await supabase.functions.invoke('send-ios-push', {
            body: {
              deviceToken: device.device_token,
              title: notification.title,
              body: notification.body,
              data: notification.data,
              badge: notification.badge || 1,
            },
          });
          
          if (result.error) {
            console.error(`❌ Error enviando push:`, result.error);
            errors.push({ device: device.device_token.substring(0, 10), error: result.error });
          } else if (result.data?.success) {
            console.log(`✅ Enviada a ${device.device_token.substring(0, 10)}...`);
            results.push(result.data);
          } else {
            console.error(`❌ Push fallida:`, result.data);
            errors.push({ device: device.device_token.substring(0, 10), error: result.data });
          }
          
        } catch (deviceError) {
          console.error(`❌ Error con dispositivo:`, deviceError);
          errors.push({ device: device.device_token.substring(0, 10), error: deviceError });
        }
        
        // Pequeña pausa para no sobrecargar APNs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ ${results.length} push enviadas exitosamente de ${devices.length} intentos`);
    
    if (errors.length > 0) {
      console.log(`⚠️ ${errors.length} errores:`, errors);
    }

    return { 
      success: results.length > 0, 
      sentCount: results.length,
      totalDevices: devices.length,
      results,
      error: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('❌ Error en sendiOSPushNotification:', error);
    return { success: false, error };
  }
};

/**
 * Envía push notification a un usuario específico
 */
export const sendPushToUser = async (
  userId: string, 
  notification: PushNotificationPayload
): Promise<SendPushResult> => {
  try {
    console.log(`📱 Enviando push a usuario: ${userId}`);

    // Obtener device tokens del usuario
    const { data: devices, error } = await supabase
      .from('user_devices')
      .select('device_token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error obteniendo devices del usuario:', error);
      return { success: false, error };
    }

    if (!devices || devices.length === 0) {
      console.log('ℹ️ Usuario no tiene dispositivos registrados');
      return { success: false, error: 'No devices found for user' };
    }

    const results: any[] = [];

    for (const device of devices) {
      if (device.device_token) {
        const result = await supabase.functions.invoke('send-ios-push', {
          body: {
            deviceToken: device.device_token,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            badge: notification.badge || 1,
          },
        });

        if (result.data?.success) {
          results.push(result.data);
        }
      }
    }

    return { 
      success: results.length > 0, 
      sentCount: results.length,
      totalDevices: devices.length,
      results 
    };

  } catch (error) {
    console.error('❌ Error en sendPushToUser:', error);
    return { success: false, error };
  }
};

/**
 * Envía push notification a un token específico (para testing)
 */
export const sendPushToToken = async (
  deviceToken: string,
  notification: PushNotificationPayload
): Promise<SendPushResult> => {
  try {
    console.log(`📱 Enviando push a token: ${deviceToken.substring(0, 15)}...`);

    const result = await supabase.functions.invoke('send-ios-push', {
      body: {
        deviceToken,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        badge: notification.badge || 1,
      },
    });

    if (result.error) {
      console.error('❌ Error enviando push:', result.error);
      return { success: false, error: result.error };
    }

    if (result.data?.success) {
      console.log('✅ Push enviada exitosamente');
      return { success: true, results: [result.data] };
    } else {
      console.error('❌ Push fallida:', result.data);
      return { success: false, error: result.data };
    }

  } catch (error) {
    console.error('❌ Error en sendPushToToken:', error);
    return { success: false, error };
  }
};

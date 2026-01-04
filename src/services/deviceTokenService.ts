import { supabase } from '@/integrations/supabase/client';

class DeviceTokenService {
  private static instance: DeviceTokenService;
  private currentToken: string | null = null;
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): DeviceTokenService {
    if (!DeviceTokenService.instance) {
      DeviceTokenService.instance = new DeviceTokenService();
    }
    return DeviceTokenService.instance;
  }

  async initialize() {
    if (this.isInitialized) {
      console.log('📱 DeviceTokenService ya inicializado');
      return;
    }

    try {
      console.log('🚀 Inicializando DeviceTokenService...');
      
      // Importar dinámicamente para evitar errores en web
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      // Configurar listener para recibir token
      await PushNotifications.addListener('registration', async (token) => {
        console.log('🔑 Token recibido:', token.value?.substring(0, 20) + '...');
        this.currentToken = token.value;
        await this.saveTokenToSupabase(token.value);
      });

      // Configurar listener para errores
      await PushNotifications.addListener('registrationError', (error) => {
        console.error('❌ Error registro push:', error);
      });

      this.isInitialized = true;
      console.log('✅ DeviceTokenService inicializado correctamente');

    } catch (error) {
      console.error('❌ Error inicializando DeviceTokenService:', error);
    }
  }

  async saveTokenToSupabase(token: string) {
    try {
      console.log('💾 Guardando token en Supabase...');
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('⚠️ Usuario no autenticado, guardando token temporal');
        localStorage.setItem('pending_device_token', token);
        return;
      }

      // Usar upsert para actualizar si el token ya existe
      const { error } = await supabase.from('user_devices').upsert(
        {
          user_id: user.id,
          device_token: token,
          platform: 'ios',
          is_active: true,
          last_active: new Date().toISOString(),
        },
        { onConflict: 'device_token' }
      );

      if (error) {
        console.error('❌ Error guardando token:', error);
      } else {
        console.log('✅ Token guardado en Supabase exitosamente');
        localStorage.removeItem('pending_device_token');
      }
    } catch (error) {
      console.error('❌ Error en saveTokenToSupabase:', error);
    }
  }

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  async checkPendingToken() {
    // Verificar si hay un token pendiente de usuario no autenticado
    const pendingToken = localStorage.getItem('pending_device_token');
    if (pendingToken) {
      console.log('📱 Token pendiente encontrado, guardando...');
      await this.saveTokenToSupabase(pendingToken);
    }
  }

  async registerForPush() {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      
      // Verificar permisos
      const status = await PushNotifications.checkPermissions();
      console.log('📱 Estado permisos push:', status.receive);
      
      if (status.receive !== 'granted') {
        const result = await PushNotifications.requestPermissions();
        if (result.receive !== 'granted') {
          console.log('❌ Permisos de push denegados');
          return false;
        }
      }
      
      // Registrar para push
      await PushNotifications.register();
      console.log('✅ Registro para push completado');
      return true;
      
    } catch (error) {
      console.error('❌ Error registrando para push:', error);
      return false;
    }
  }
}

export default DeviceTokenService.getInstance();

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'do.com.arcana.app',
  appName: 'ArcanaApp',
  webDir: 'dist',
  
  // Configuración específica iOS
  ios: {
    scheme: 'ArcanaApp',
    contentInset: 'automatic',
    scrollEnabled: true,
    includePlugins: [
      '@capacitor/haptics',
      '@capacitor/local-notifications',
      '@capacitor/push-notifications',
      '@capacitor/toast'
    ],
    // Preferencias para notificaciones en background
    preferredContentMode: 'mobile'
  },

  // Configuración específica Android
  android: {
    allowMixedContent: true,
  },
  
  plugins: {
    PushNotifications: {
      // Opciones de presentación para iOS (alerta, badge, sonido)
      presentationOptions: ['badge', 'sound', 'alert'],
      // Importancia de notificación para Android
      importance: 'high',
    },
    LocalNotifications: {
      // Icono pequeño para Android (debe estar en res/drawable)
      smallIcon: 'ic_arcana_notification',
      // Color del icono
      iconColor: '#1E3A5F',
      // Sonido personalizado
      sound: 'notification.wav'
    },
    // Configuración de hápticos para zumbidos del chat
    Haptics: {
      enabled: true
    }
  }
};

export default config;

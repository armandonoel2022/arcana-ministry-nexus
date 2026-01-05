import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'do.com.arcana.app',
  appName: 'ArcanaApp',
  webDir: 'dist',
  
  // Servidor interno para manejar rutas SPA (evita 404 en navegación)
  server: {
    // Esto hace que todas las rutas se resuelvan al index.html
    androidScheme: 'https',
    iosScheme: 'capacitor',
    // Permite que la app maneje todas las rutas internamente
    allowNavigation: ['*']
  },
  
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
    preferredContentMode: 'mobile'
  },

  // Configuración específica Android
  android: {
    allowMixedContent: true,
  },
  
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
      importance: 'high',
    },
    LocalNotifications: {
      smallIcon: 'ic_arcana_notification',
      iconColor: '#1E3A5F',
      sound: 'notification.wav'
    },
    Haptics: {
      enabled: true
    }
  }
};

export default config;

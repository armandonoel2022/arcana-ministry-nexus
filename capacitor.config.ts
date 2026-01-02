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
    ]
  },
  
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },
    LocalNotifications: {
      smallIcon: 'arcana_notification_icon',
      iconColor: '#4F46E5',
      sound: 'notification.wav'
    }
  }
};

export default config;

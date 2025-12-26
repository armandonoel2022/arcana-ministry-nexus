import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9ad580d087d143a09d97fed34a5a6a68',
  appName: 'arcana-ministry-nexus',
  webDir: 'dist',
  server: {
    url: 'https://9ad580d0-87d1-43a0-9d97-fed34a5a6a68.lovableproject.com?forceHideBadge=true',
    cleartext: true
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

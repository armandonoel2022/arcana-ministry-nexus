import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import BirthdayNotificationBanner from './BirthdayNotificationBanner';
import ServiceNotificationCard from './ServiceNotificationCard';
import { Card, CardContent } from '@/components/ui/card';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  priority: number;
  notification_category: string;
  metadata: any;
  created_at: string;
}

const NotificationOverlay = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Suscribirse a nuevas notificaciones
    const channel = supabase
      .channel('overlay-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications'
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          // Solo mostrar notificaciones no leídas y que no sean para el usuario específico o sean globales
          if (!newNotification.is_read) {
            setNotifications(prev => [...prev, newNotification]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const dismissNotification = async (notificationId: string) => {
    // Marcar como leída en la base de datos
    await supabase
      .from('system_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    // Remover de la vista
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const renderNotificationContent = (notification: Notification) => {
    switch (notification.type) {
      case 'birthday_daily':
        return (
          <BirthdayNotificationBanner
            notification={notification}
            onDismiss={() => dismissNotification(notification.id)}
          />
        );
      case 'weekend_service':
        return (
          <ServiceNotificationCard
            notification={notification}
            onDismiss={() => dismissNotification(notification.id)}
          />
        );
      default:
        return (
          <Card className="border-l-4 border-l-blue-500 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                  <p className="text-gray-600 text-sm">{notification.message}</p>
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-4 max-w-md w-full pointer-events-none">
      {notifications.map((notification) => (
        <div key={notification.id} className="animate-slide-in-right pointer-events-auto">
          {renderNotificationContent(notification)}
        </div>
      ))}
    </div>
  );
};

export default NotificationOverlay;
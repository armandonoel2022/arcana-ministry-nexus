
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock, Music, Calendar, UserCheck, MessageSquare, Settings, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ConfettiEffect from "@/components/birthday/ConfettiEffect";
import BirthdayNotificationBanner from "./BirthdayNotificationBanner";

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
  scheduled_for?: string;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'agenda' | 'repertory' | 'director_replacement'>('all');
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    
    const channel = supabase
      .channel('notification-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications'
        },
        (payload) => {
          console.log('New notification received:', payload);
          setNotifications(prev => [payload.new as Notification, ...prev]);
          
          // Show toast for new notification
          const newNotification = payload.new as Notification;
          
          // Check if it's a birthday notification that should trigger confetti
          if (newNotification.metadata?.show_confetti) {
            console.log('Triggering confetti for birthday notification');
            setShowConfetti(true);
          }
          
          toast({
            title: newNotification.title,
            description: newNotification.message
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      const { data, error } = await supabase
        .from('system_notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      console.log('Notifications query result:', { data, error });
      
      if (error) throw error;
      
      console.log(`Loaded ${data?.length || 0} notifications`);
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Error al cargar las notificaciones",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: "Error al marcar como leída",
        variant: "destructive"
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
      
      toast({
        title: "Éxito",
        description: "Todas las notificaciones marcadas como leídas"
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: "Error",
        description: "Error al marcar todas como leídas",
        variant: "destructive"
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'agenda_notification':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'song_selection':
        return <Music className="w-5 h-5 text-green-600" />;
      case 'director_replacement_request':
        return <UserCheck className="w-5 h-5 text-orange-600" />;
      case 'birthday_daily':
      case 'birthday_monthly':
        return <Gift className="w-5 h-5 text-pink-600" />;
      case 'general':
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3: return 'border-l-red-500 bg-red-50';
      case 2: return 'border-l-orange-500 bg-orange-50';
      case 1: return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3: return 'Alta';
      case 2: return 'Media';
      case 1: return 'Baja';
      default: return 'Normal';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'agenda') return notification.notification_category === 'agenda';
    if (filter === 'repertory') return notification.notification_category === 'repertory';
    if (filter === 'director_replacement') return notification.type === 'director_replacement_request';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando notificaciones...</p>
      </div>
    );
  }

  return (
    <>
      <ConfettiEffect trigger={showConfetti} onComplete={() => setShowConfetti(false)} />
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold arcana-gradient-text">Centro de Notificaciones</h1>
                <p className="text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : 'Todas las notificaciones están al día'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Marcar todas como leídas
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Sin leer ({unreadCount})
            </Button>
            <Button
              variant={filter === 'agenda' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('agenda')}
            >
              <Calendar className="w-4 h-4 mr-1" />
              Agenda
            </Button>
            <Button
              variant={filter === 'repertory' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('repertory')}
            >
              <Music className="w-4 h-4 mr-1" />
              Repertorio
            </Button>
            <Button
              variant={filter === 'director_replacement' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('director_replacement')}
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Reemplazos
            </Button>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No hay notificaciones
                </h3>
                <p className="text-gray-500">
                  {filter === 'unread' 
                    ? 'No tienes notificaciones sin leer'
                    : 'No hay notificaciones para mostrar'
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.is_read ? 'ring-2 ring-blue-100' : ''
                  } hover:shadow-md transition-shadow cursor-pointer`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {notification.title}
                            {!notification.is_read && (
                              <Badge variant="secondary" className="text-xs">
                                Nuevo
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {getPriorityLabel(notification.priority)}
                            </Badge>
                          </CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </div>
                            {notification.scheduled_for && (
                              <div className="flex items-center gap-1">
                                <Settings className="w-3 h-3" />
                                Programada para: {format(new Date(notification.scheduled_for), 'dd/MM/yyyy HH:mm', { locale: es })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 leading-relaxed mb-3">
                      {notification.message}
                    </p>
                    
                    {/* Special rendering for birthday notifications */}
                    {(notification.type === 'birthday_daily' || notification.type === 'birthday_monthly') && notification.metadata && (
                      <div className="mt-4">
                        <BirthdayNotificationBanner
                          notification={notification}
                          onDismiss={() => markAsRead(notification.id)}
                        />
                      </div>
                    )}
                    
                    {/* Show metadata if available */}
                    {notification.metadata && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        {notification.type === 'song_selection' && notification.metadata.song_title && (
                          <div>Canción: <span className="font-medium">{notification.metadata.song_title}</span></div>
                        )}
                        {notification.metadata.service_title && (
                          <div>Servicio: <span className="font-medium">{notification.metadata.service_title}</span></div>
                        )}
                        {notification.metadata.selected_by_name && (
                          <div>Seleccionado por: <span className="font-medium">{notification.metadata.selected_by_name}</span></div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationCenter;

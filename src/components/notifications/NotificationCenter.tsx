import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Check, Clock, Music, Calendar, UserCheck, MessageSquare, Settings, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
// BirthdayNotificationBanner removed - birthdays now handled by OverlayManager and BirthdayOverlay

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
  recipient_id: string;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "agenda" | "repertory" | "director_replacement">("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel("notification-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "system_notifications",
        },
        (payload) => {
          console.log("New notification received:", payload);
          const newNotification = payload.new as Notification;

          // Solo agregar si es para el usuario actual
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && newNotification.recipient_id === user.id) {
              setNotifications((prev) => [newNotification, ...prev]);

              toast({
                title: newNotification.title,
                description: newNotification.message,
              });
            }
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "system_notifications",
        },
        (payload) => {
          console.log("Notification updated:", payload);
          const updatedNotification = payload.new as Notification;

          // Actualizar la notificación en la lista
          setNotifications((prev) =>
            prev.map((notification) =>
              notification.id === updatedNotification.id ? updatedNotification : notification,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      console.log("Fetching notifications for current user...");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("No user logged in");
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from("system_notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      console.log("Notifications query result:", { data, error });

      if (error) throw error;

      console.log(`Loaded ${data?.length || 0} notifications for user ${user.id}`);
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast({
        title: "Error",
        description: "Error al cargar las notificaciones",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase.from("system_notifications").update({ is_read: true }).eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId ? { ...notification, is_read: true } : notification,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
      toast({
        title: "Error",
        description: "Error al marcar como leída",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("system_notifications")
        .update({ is_read: true })
        .eq("is_read", false)
        .eq("recipient_id", user.id);

      if (error) throw error;

      setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));

      toast({
        title: "Éxito",
        description: "Todas las notificaciones marcadas como leídas",
      });
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast({
        title: "Error",
        description: "Error al marcar todas como leídas",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "agenda_notification":
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case "song_selection":
        return <Music className="w-5 h-5 text-green-600" />;
      case "director_replacement_request":
        return <UserCheck className="w-5 h-5 text-orange-600" />;
      case "birthday_daily":
      case "birthday_monthly":
        return <Gift className="w-5 h-5 text-pink-600" />;
      case "general":
        return <MessageSquare className="w-5 h-5 text-gray-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 3:
        return "border-l-red-500 bg-red-50";
      case 2:
        return "border-l-orange-500 bg-orange-50";
      case 1:
        return "border-l-blue-500 bg-blue-50";
      default:
        return "border-l-gray-500 bg-gray-50";
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 3:
        return "Alta";
      case 2:
        return "Media";
      case 1:
        return "Baja";
      default:
        return "Normal";
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.is_read;
    if (filter === "agenda") return notification.notification_category === "agenda";
    if (filter === "repertory") return notification.notification_category === "repertory";
    if (filter === "director_replacement") return notification.type === "director_replacement_request";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 min-h-[200px] w-full px-0">
        <div className="text-center w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white fixed left-0 right-0 top-0 bottom-0 overflow-y-auto">
      <div className="w-full px-4 max-w-none sm:max-w-4xl sm:mx-auto sm:px-6">
        <div className="space-y-4 sm:space-y-6 w-full py-4">
          {/* Header */}
          <div className="flex flex-col items-center sm:items-start sm:flex-row sm:justify-between gap-3 text-center sm:text-left w-full">
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-start">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-arcana-gradient rounded-full flex items-center justify-center flex-shrink-0">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold arcana-gradient-text">
                  Centro de Notificaciones
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {unreadCount > 0 ? `${unreadCount} notificaciones sin leer` : "Todas las notificaciones están al día"}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={markAllAsRead}
                className="flex items-center gap-2 w-full sm:w-auto justify-center mt-2 sm:mt-0"
                size="sm"
              >
                <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm">Marcar todas como leídas</span>
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start w-full">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              Todas ({notifications.length})
            </Button>
            <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
              Sin leer ({unreadCount})
            </Button>
            <Button variant={filter === "agenda" ? "default" : "outline"} size="sm" onClick={() => setFilter("agenda")}>
              <Calendar className="w-4 h-4 mr-1" />
              Agenda
            </Button>
            <Button
              variant={filter === "repertory" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("repertory")}
            >
              <Music className="w-4 h-4 mr-1" />
              Repertorio
            </Button>
            <Button
              variant={filter === "director_replacement" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("director_replacement")}
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Reemplazos
            </Button>
          </div>

          {/* Notifications List */}
          <div className="space-y-2 sm:space-y-3 w-full">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 sm:py-12 w-full">
                <Bell className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No hay notificaciones</h3>
                <p className="text-sm sm:text-base text-gray-500">
                  {filter === "unread" ? "No tienes notificaciones sin leer" : "No hay notificaciones para mostrar"}
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <Card
                  key={notification.id}
                  className={`border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.is_read ? "ring-2 ring-blue-100" : ""
                  } hover:shadow-md transition-shadow cursor-pointer w-full mx-0`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-3">
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0 mt-0.5">{getNotificationIcon(notification.type)}</div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm sm:text-lg flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="break-words text-center sm:text-left w-full">{notification.title}</span>
                            <div className="flex justify-center sm:justify-start gap-1">
                              {!notification.is_read && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  Nuevo
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs flex-shrink-0 hidden sm:inline-flex">
                                {getPriorityLabel(notification.priority)}
                              </Badge>
                            </div>
                          </CardTitle>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-1 justify-center sm:justify-start">
                            <div className="flex items-center gap-1 flex-shrink-0 justify-center sm:justify-start">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span>
                                {format(new Date(notification.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                              </span>
                            </div>
                            {notification.scheduled_for && (
                              <div className="flex items-center gap-1 justify-center sm:justify-start">
                                <Settings className="w-3 h-3 flex-shrink-0" />
                                <span>
                                  Programada:{" "}
                                  {format(new Date(notification.scheduled_for), "dd/MM/yyyy HH:mm", { locale: es })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-shrink-0 h-8 w-8 p-0 sm:h-auto sm:w-auto sm:p-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                        >
                          <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-2">
                    <div className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-3 break-words whitespace-pre-wrap text-center sm:text-left">
                      {notification.message}
                    </div>

                    {/* Birthday notifications show a simple indicator - overlay handled separately */}
                    {(notification.type === "birthday_daily" ||
                      notification.type === "birthday_monthly" ||
                      (notification.type === "general" && notification.metadata?.birthday)) &&
                      notification.metadata && (
                        <div className="mt-2 text-center sm:text-left">
                          <span className="text-2xl">🎂🎉🎈</span>
                          <p className="text-sm text-pink-600 font-medium mt-1">
                            {notification.metadata.birthday_member_name || notification.metadata.member_name}
                          </p>
                        </div>
                      )}

                    {/* Show metadata if available */}
                    {notification.metadata && (
                      <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded break-words text-center sm:text-left">
                        {notification.type === "song_selection" && notification.metadata.song_title && (
                          <div className="break-words">
                            Canción: <span className="font-medium break-words">{notification.metadata.song_title}</span>
                          </div>
                        )}
                        {notification.metadata.service_title && (
                          <div className="break-words">
                            Servicio:{" "}
                            <span className="font-medium break-words">{notification.metadata.service_title}</span>
                          </div>
                        )}
                        {notification.metadata.selected_by_name && (
                          <div className="break-words">
                            Seleccionado por:{" "}
                            <span className="font-medium break-words">{notification.metadata.selected_by_name}</span>
                          </div>
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
    </div>
  );
};

export default NotificationCenter;

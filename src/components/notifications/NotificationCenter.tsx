import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bell,
  Check,
  Clock,
  Music,
  Calendar,
  UserCheck,
  MessageSquare,
  Settings,
  Gift,
  BookOpen,
  Lightbulb,
  Heart,
  AlertTriangle,
  Users,
  Mic,
  Church,
  Droplets,
  Volume2,
  Info,
  Book,
  Video,
  FileText,
  AlertCircle,
  Users as UsersIcon,
  Megaphone,
  User,
  MapPin,
  Users as GroupIcon,
  Clock as TimeIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
  const [filter, setFilter] = useState<"all" | "unread" | "overlay" | "agenda" | "repertory" | "director_replacement">(
    "all",
  );
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

          // Solo agregar si es para el usuario actual o es broadcast (recipient_id null)
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user && (newNotification.recipient_id === user.id || newNotification.recipient_id === null)) {
              setNotifications((prev) => [newNotification, ...prev]);

              // Solo mostrar toast si no es una notificación programada
              if (newNotification.notification_category !== "scheduled") {
                toast({
                  title: newNotification.title,
                  description: newNotification.message,
                  duration: 3000,
                });
              }
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

      // Obtener notificaciones para el usuario actual Y notificaciones broadcast (recipient_id null)
      const { data, error } = await supabase
        .from("system_notifications")
        .select("*")
        .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
        .order("created_at", { ascending: false })
        .limit(100); // Aumentar límite para incluir más notificaciones

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

  // Función mejorada para obtener iconos según el tipo de notificación
  const getNotificationIcon = (type: string, category?: string) => {
    // Iconos para notificaciones de overlays
    const overlayIcons: Record<string, JSX.Element> = {
      service_overlay: <Calendar className="w-5 h-5 text-blue-600" />,
      daily_verse: <Book className="w-5 h-5 text-green-600" />,
      daily_advice: <Lightbulb className="w-5 h-5 text-yellow-600" />,
      death_announcement: <AlertCircle className="w-5 h-5 text-gray-600" />,
      meeting_announcement: <UsersIcon className="w-5 h-5 text-blue-600" />,
      special_service: <Church className="w-5 h-5 text-purple-600" />,
      prayer_request: <Heart className="w-5 h-5 text-pink-600" />,
      blood_donation: <Droplets className="w-5 h-5 text-red-600" />,
      extraordinary_rehearsal: <Volume2 className="w-5 h-5 text-indigo-600" />,
      ministry_instructions: <FileText className="w-5 h-5 text-sky-600" />,
      birthday: <Gift className="w-5 h-5 text-pink-600" />,
    };

    // Iconos para notificaciones del sistema (categorías específicas)
    const systemIcons: Record<string, JSX.Element> = {
      agenda_notification: <Calendar className="w-5 h-5 text-blue-600" />,
      song_selection: <Music className="w-5 h-5 text-green-600" />,
      director_replacement_request: <UserCheck className="w-5 h-5 text-orange-600" />,
      birthday_daily: <Gift className="w-5 h-5 text-pink-600" />,
      birthday_monthly: <Gift className="w-5 h-5 text-pink-600" />,
      general: <MessageSquare className="w-5 h-5 text-gray-600" />,
      scheduled: <Clock className="w-5 h-5 text-gray-600" />,
    };

    // Primero verificar si es un tipo de overlay
    if (overlayIcons[type]) {
      return overlayIcons[type];
    }

    // Luego verificar si es un tipo del sistema
    if (systemIcons[type]) {
      return systemIcons[type];
    }

    // Para notificaciones programadas (category = 'scheduled')
    if (category === "scheduled") {
      return <Clock className="w-5 h-5 text-blue-600" />;
    }

    // Por defecto
    return <Bell className="w-5 h-5 text-gray-600" />;
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

  // Determinar si una notificación es de tipo overlay
  const isOverlayNotification = (notification: Notification): boolean => {
    const overlayTypes = [
      "service_overlay",
      "daily_verse",
      "daily_advice",
      "death_announcement",
      "meeting_announcement",
      "special_service",
      "prayer_request",
      "blood_donation",
      "extraordinary_rehearsal",
      "ministry_instructions",
      "birthday",
    ];
    return overlayTypes.includes(notification.type) || notification.notification_category === "scheduled";
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.is_read;
    if (filter === "overlay") return isOverlayNotification(notification);
    if (filter === "agenda")
      return notification.notification_category === "agenda" || notification.type === "service_overlay";
    if (filter === "repertory") return notification.notification_category === "repertory";
    if (filter === "director_replacement") return notification.type === "director_replacement_request";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const overlayCount = notifications.filter(isOverlayNotification).length;

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

          {/* Filters - Mejorados para incluir overlays */}
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start w-full">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              Todas ({notifications.length})
            </Button>
            <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
              Sin leer ({unreadCount})
            </Button>
            <Button
              variant={filter === "overlay" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("overlay")}
            >
              <Megaphone className="w-4 h-4 mr-1" />
              Overlays ({overlayCount})
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
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type, notification.notification_category)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-sm sm:text-lg flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <span className="break-words text-center sm:text-left w-full">{notification.title}</span>
                            <div className="flex justify-center sm:justify-start gap-1">
                              {!notification.is_read && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  Nuevo
                                </Badge>
                              )}
                              {notification.notification_category === "scheduled" && (
                                <Badge variant="outline" className="text-xs flex-shrink-0 bg-blue-50">
                                  Programado
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

                    {/* Mostrar información específica de overlays - AGENDA DE SERVICIOS */}
                    {isOverlayNotification(notification) && notification.metadata && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-4">
                          {/* Información para service_overlay (agenda de presentaciones) */}
                          {notification.type === "service_overlay" && notification.metadata.services_info && (
                            <>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Detalles de la Agenda
                              </h4>

                              {/* Información general */}
                              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-gray-500" />
                                  <span className="font-medium">Fecha:</span>
                                </div>
                                <div>
                                  {notification.metadata.service_date
                                    ? format(new Date(notification.metadata.service_date), "EEEE, dd 'de' MMMM", {
                                        locale: es,
                                      })
                                    : "No especificada"}
                                </div>

                                <div className="flex items-center gap-1">
                                  <GroupIcon className="w-3 h-3 text-gray-500" />
                                  <span className="font-medium">Servicios:</span>
                                </div>
                                <div>{notification.metadata.total_services || 0} servicio(s)</div>
                              </div>

                              {/* Lista detallada de servicios */}
                              {Array.isArray(notification.metadata.services_info) &&
                                notification.metadata.services_info.length > 0 && (
                                  <div className="space-y-3">
                                    <h5 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                      DESGLOSE POR SERVICIO
                                    </h5>

                                    {notification.metadata.services_info.map((service: any, index: number) => (
                                      <div
                                        key={service.id || index}
                                        className="p-3 bg-white rounded border border-gray-100 shadow-sm"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <div
                                              className="w-3 h-3 rounded-full"
                                              style={{ backgroundColor: service.group_color || "#3B82F6" }}
                                            />
                                            <span className="font-medium text-sm">Servicio {index + 1}</span>
                                          </div>
                                          <Badge variant="outline" className="text-xs">
                                            {service.service_type || "Regular"}
                                          </Badge>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-center gap-1">
                                            <TimeIcon className="w-3 h-3 text-gray-400" />
                                            <span className="font-medium">Hora:</span>
                                            <span>{service.time || "No especificada"}</span>
                                          </div>

                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3 text-gray-400" />
                                            <span className="font-medium">Dirige:</span>
                                            <span className="font-semibold">{service.director || "No asignado"}</span>
                                          </div>

                                          <div className="flex items-center gap-1">
                                            <GroupIcon className="w-3 h-3 text-gray-400" />
                                            <span className="font-medium">Grupo:</span>
                                            <span>{service.group_name || "No especificado"}</span>
                                          </div>

                                          {service.location && service.location !== "Templo Principal" && (
                                            <div className="flex items-center gap-1">
                                              <MapPin className="w-3 h-3 text-gray-400" />
                                              <span className="font-medium">Lugar:</span>
                                              <span>{service.location}</span>
                                            </div>
                                          )}

                                          {service.special_activity && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                              <span className="font-medium">Actividad especial:</span>{" "}
                                              {service.special_activity}
                                            </div>
                                          )}

                                          {/* Canciones del servicio */}
                                          {Array.isArray(service.songs) && service.songs.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-gray-100">
                                              <div className="flex items-center gap-1 mb-1">
                                                <Music className="w-3 h-3 text-green-500" />
                                                <span className="text-xs font-medium">
                                                  Canciones ({service.songs.length}):
                                                </span>
                                              </div>
                                              <div className="text-xs text-gray-600 space-y-1">
                                                {service.songs.slice(0, 3).map((song: any, songIndex: number) => (
                                                  <div key={song.id || songIndex} className="flex items-start gap-1">
                                                    <span className="text-green-600">•</span>
                                                    <span className="truncate">{song.title || "Sin título"}</span>
                                                  </div>
                                                ))}
                                                {service.songs.length > 3 && (
                                                  <div className="text-gray-500 text-xs">
                                                    +{service.songs.length - 3} más...
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </>
                          )}

                          {/* Información para daily_verse */}
                          {notification.type === "daily_verse" && notification.metadata.verse_reference && (
                            <>
                              <div className="font-medium">Referencia:</div>
                              <div>{notification.metadata.verse_reference}</div>
                              {notification.metadata.verse_text && (
                                <>
                                  <div className="font-medium">Versículo:</div>
                                  <div className="italic">{notification.metadata.verse_text}</div>
                                </>
                              )}
                            </>
                          )}

                          {/* Información para daily_advice */}
                          {notification.type === "daily_advice" && (
                            <>
                              {notification.metadata.advice_title && (
                                <>
                                  <div className="font-medium">Título:</div>
                                  <div>{notification.metadata.advice_title}</div>
                                </>
                              )}
                            </>
                          )}

                          {/* Información para blood_donation */}
                          {notification.type === "blood_donation" && (
                            <>
                              {notification.metadata.recipient_name && (
                                <>
                                  <div className="font-medium">Paciente:</div>
                                  <div>{notification.metadata.recipient_name}</div>
                                </>
                              )}
                              {notification.metadata.blood_type && (
                                <>
                                  <div className="font-medium">Tipo de sangre:</div>
                                  <div>{notification.metadata.blood_type}</div>
                                </>
                              )}
                              {notification.metadata.medical_center && (
                                <>
                                  <div className="font-medium">Centro médico:</div>
                                  <div>{notification.metadata.medical_center}</div>
                                </>
                              )}
                            </>
                          )}

                          {/* Información para extraordinary_rehearsal */}
                          {notification.type === "extraordinary_rehearsal" && (
                            <>
                              {notification.metadata.activity_name && (
                                <>
                                  <div className="font-medium">Actividad:</div>
                                  <div>{notification.metadata.activity_name}</div>
                                </>
                              )}
                              {notification.metadata.date && (
                                <>
                                  <div className="font-medium">Fecha:</div>
                                  <div>{notification.metadata.date}</div>
                                </>
                              )}
                              {notification.metadata.rehearsal_time && (
                                <>
                                  <div className="font-medium">Hora:</div>
                                  <div>{notification.metadata.rehearsal_time}</div>
                                </>
                              )}
                            </>
                          )}

                          {/* Información para ministry_instructions */}
                          {notification.type === "ministry_instructions" && (
                            <>
                              {notification.metadata.priority && (
                                <>
                                  <div className="font-medium">Prioridad:</div>
                                  <div className="capitalize">{notification.metadata.priority}</div>
                                </>
                              )}
                            </>
                          )}

                          {/* Información para anuncios generales */}
                          {["death_announcement", "meeting_announcement", "special_service", "prayer_request"].includes(
                            notification.type,
                          ) && (
                            <>
                              {notification.metadata.title && (
                                <>
                                  <div className="font-medium">Título del anuncio:</div>
                                  <div>{notification.metadata.title}</div>
                                </>
                              )}
                            </>
                          )}

                          {/* Mostrar metadata general si existe */}
                          {Object.entries(notification.metadata).map(([key, value]) => {
                            if (
                              typeof value === "string" &&
                              value &&
                              ![
                                "verse_reference",
                                "verse_text",
                                "advice_title",
                                "advice_message",
                                "recipient_name",
                                "blood_type",
                                "medical_center",
                                "activity_name",
                                "date",
                                "rehearsal_time",
                                "priority",
                                "title",
                                "instructions",
                                "service_date",
                                "total_services",
                                "services_info",
                              ].includes(key)
                            ) {
                              return (
                                <React.Fragment key={key}>
                                  <div className="font-medium">{key.replace(/_/g, " ")}:</div>
                                  <div>{String(value)}</div>
                                </React.Fragment>
                              );
                            }
                            return null;
                          })}
                        </div>
                      </div>
                    )}

                    {/* Birthday notifications */}
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

                    {/* Mostrar metadata del sistema (no overlay) */}
                    {!isOverlayNotification(notification) && notification.metadata && (
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

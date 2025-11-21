import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Clock, Calendar, Plus, Edit, Trash2, Bell, Save, X, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ScheduledNotification {
  id: string;
  name: string;
  description: string;
  notification_type: string;
  day_of_week: number;
  time: string;
  is_active: boolean;
  target_audience: string;
  metadata: any;
  created_at: string;
}

const daysOfWeek = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const notificationTypes = [
  { value: "weekend_service", label: "Programa de Servicios" },
  { value: "general", label: "Notificación General" },
  { value: "reminder", label: "Recordatorio" },
];

const ScheduledNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    notification_type: "weekend_service", // Cambiado a weekend_service
    day_of_week: 5, // Viernes por defecto (para servicios de fin de semana)
    time: "07:30",
    target_audience: "all",
    is_active: true,
    metadata: {
      service_date: "",
      month_order: "",
      special_event: "",
      services: [],
    },
  });

  useEffect(() => {
    fetchScheduledNotifications();
  }, []);

  const fetchScheduledNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .order("day_of_week", { ascending: true });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching scheduled notifications:", error);
      toast.error("Error al cargar las notificaciones programadas");
    } finally {
      setLoading(false);
    }
  };

  // Función para crear notificaciones de servicio usando el sistema global
  const createWeekendServiceNotification = async (serviceData: any) => {
    try {
      const { error } = await supabase.from("system_notifications").insert({
        type: "weekend_service",
        title: `🎼 Programa de Servicios - ${serviceData.month_order}`,
        message:
          "Se ha publicado el programa de servicios para este fin de semana. Revisa tu participación y prepárate para un tiempo de bendición.",
        recipient_id: null, // null = notificación global para todos
        notification_category: "agenda",
        priority: 2,
        metadata: serviceData,
      });

      if (error) throw error;

      console.log("✅ Service notification created successfully");
      toast.success("Notificación de servicios creada exitosamente");
    } catch (error) {
      console.error("Error creating service notification:", error);
      toast.error("Error al crear la notificación de servicios");
    }
  };

  // Función para probar la notificación inmediatamente
  const testNotification = async (notification: ScheduledNotification) => {
    try {
      if (notification.notification_type === "weekend_service") {
        // Crear datos de ejemplo para servicios de fin de semana
        const serviceData = {
          service_date: new Date().toISOString().split("T")[0],
          month_order: "Primera Semana de Diciembre",
          special_event: "Bautismo Especial",
          services: [
            {
              time: "8:00 AM",
              director: {
                name: "Félix Nicolás Peralta Hernández",
                photo:
                  "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/3d75bc74-76bb-454a-b3e0-d6e4de45d577.JPG",
              },
              group: "Grupo de Aleida",
              voices: [
                {
                  name: "Aleida Geomar Batista Ventura",
                  photo:
                    "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/00a916a8-ab94-4cc0-81ae-668dd6071416.JPG",
                },
                {
                  name: "Eliabi Joana Sierra Castillo",
                  photo:
                    "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c4089748-7168-4472-8e7c-bf44b4355906.JPG",
                },
              ],
            },
            {
              time: "10:45 AM",
              director: {
                name: "Armando Noel Charle",
                photo:
                  "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/d6602109-ad3e-4db6-ab4a-2984dadfc569.JPG",
              },
              group: "Grupo de Keyla",
              voices: [
                {
                  name: "Keyla Yanira Medrano Medrano",
                  photo:
                    "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c24659e9-b473-4ecd-97e7-a90526d23502.JPG",
                },
                {
                  name: "Yindhia Carolina Santana Castillo",
                  photo:
                    "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/11328db1-559f-4dcf-9024-9aef18435700.JPG",
                },
              ],
            },
          ],
        };

        await createWeekendServiceNotification(serviceData);
      } else {
        // Para otros tipos de notificaciones
        const { error } = await supabase.from("system_notifications").insert({
          type: notification.notification_type,
          title: `Prueba: ${notification.name}`,
          message: notification.description || "Esta es una notificación de prueba programada.",
          recipient_id: null,
          notification_category: "system",
          priority: 1,
          metadata: notification.metadata || {},
        });

        if (error) throw error;
        toast.success("Notificación de prueba enviada");
      }
    } catch (error) {
      console.error("Error testing notification:", error);
      toast.error("Error al enviar notificación de prueba");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const submitData = {
        ...formData,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      if (editingNotification) {
        const { error } = await supabase
          .from("scheduled_notifications")
          .update(submitData)
          .eq("id", editingNotification.id);

        if (error) throw error;
        toast.success("Notificación programada actualizada correctamente");
      } else {
        const { error } = await supabase.from("scheduled_notifications").insert(submitData);

        if (error) throw error;
        toast.success("Notificación programada creada correctamente");
      }

      setIsDialogOpen(false);
      setEditingNotification(null);
      resetForm();
      fetchScheduledNotifications();
    } catch (error) {
      console.error("Error saving scheduled notification:", error);
      toast.error("Error al guardar la notificación programada");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta notificación programada?")) {
      return;
    }

    try {
      const { error } = await supabase.from("scheduled_notifications").delete().eq("id", id);

      if (error) throw error;
      toast.success("Notificación programada eliminada correctamente");
      fetchScheduledNotifications();
    } catch (error) {
      console.error("Error deleting scheduled notification:", error);
      toast.error("Error al eliminar la notificación programada");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase.from("scheduled_notifications").update({ is_active: isActive }).eq("id", id);

      if (error) throw error;
      toast.success(`Notificación ${isActive ? "activada" : "desactivada"} correctamente`);
      fetchScheduledNotifications();
    } catch (error) {
      console.error("Error toggling notification:", error);
      toast.error("Error al cambiar el estado de la notificación");
    }
  };

  const openEditDialog = (notification: ScheduledNotification) => {
    setEditingNotification(notification);
    setFormData({
      name: notification.name,
      description: notification.description || "",
      notification_type: notification.notification_type,
      day_of_week: notification.day_of_week,
      time: notification.time,
      target_audience: notification.target_audience,
      is_active: notification.is_active,
      metadata: notification.metadata || {
        service_date: "",
        month_order: "",
        special_event: "",
        services: [],
      },
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      notification_type: "weekend_service",
      day_of_week: 5, // Viernes por defecto
      time: "07:30",
      target_audience: "all",
      is_active: true,
      metadata: {
        service_date: "",
        month_order: "",
        special_event: "",
        services: [],
      },
    });
  };

  const openCreateDialog = () => {
    setEditingNotification(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const getDayLabel = (dayOfWeek: number) => {
    return daysOfWeek.find((day) => day.value === dayOfWeek)?.label || "Desconocido";
  };

  const getTypeLabel = (type: string) => {
    return notificationTypes.find((t) => t.value === type)?.label || type;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notificaciones Programadas</h1>
          <p className="text-gray-600 mt-2">
            Configura notificaciones automáticas que se enviarán según el horario programado
          </p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva Notificación
        </Button>
      </div>

      {/* Información del Sistema */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Sistema de Notificaciones Global</h3>
              <p className="text-blue-700 text-sm mt-1">
                Las notificaciones de tipo "Programa de Servicios" se mostrarán automáticamente en el overlay global de
                la aplicación. No es necesario un preview manual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {notifications.map((notification) => (
          <Card key={notification.id} className="border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{notification.name}</CardTitle>
                  <Badge variant={notification.is_active ? "default" : "secondary"}>
                    {notification.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {getTypeLabel(notification.notification_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => testNotification(notification)}
                    className="flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Probar
                  </Button>
                  <Switch
                    checked={notification.is_active}
                    onCheckedChange={(checked) => handleToggleActive(notification.id, checked)}
                  />
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(notification)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(notification.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      <strong>Día:</strong> {getDayLabel(notification.day_of_week)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>
                      <strong>Hora:</strong> {notification.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Bell className="w-4 h-4" />
                    <span>
                      <strong>Audiencia:</strong> {notification.target_audience === "all" ? "Todos" : "Específica"}
                    </span>
                  </div>
                </div>
                {notification.description && (
                  <div className="text-sm text-gray-600">
                    <strong>Descripción:</strong>
                    <p className="mt-1">{notification.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay notificaciones programadas</h3>
            <p className="text-gray-600 mb-4">
              Crea tu primera notificación programada para enviar recordatorios automáticos.
            </p>
            <Button onClick={openCreateDialog} className="flex items-center gap-2 mx-auto">
              <Plus className="w-4 h-4" />
              Crear Notificación
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingNotification ? "Editar Notificación Programada" : "Nueva Notificación Programada"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de la notificación"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descripción de la notificación"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notification_type">Tipo de Notificación</Label>
              <Select
                value={formData.notification_type}
                onValueChange={(value) => setFormData({ ...formData, notification_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el tipo" />
                </SelectTrigger>
                <SelectContent>
                  {notificationTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="day_of_week">Día de la Semana</Label>
              <Select
                value={formData.day_of_week.toString()}
                onValueChange={(value) => setFormData({ ...formData, day_of_week: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el día" />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Hora</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Activa</Label>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button type="submit">
                <Save className="w-4 h-4 mr-2" />
                {editingNotification ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduledNotifications;

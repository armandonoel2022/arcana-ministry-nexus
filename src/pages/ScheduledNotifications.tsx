import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Clock, Calendar, Plus, Edit, Trash2, Bell, Save, X, Eye, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ServiceNotificationOverlay from "@/components/notifications/ServiceNotificationOverlay";
import { DailyVerseOverlay } from "@/components/notifications/DailyVerseOverlay";
import { DailyAdviceOverlay } from "@/components/notifications/DailyAdviceOverlay";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ScheduledNotification {
  id: string;
  name: string;
  description: string;
  notification_type: string;
  days_of_week: number[];
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
  { value: "service_overlay", label: "Overlay de Servicios" },
  { value: "daily_verse", label: "Versículo del Día" },
  { value: "daily_advice", label: "Consejo del Día" },
  { value: "general", label: "Notificación General" },
  { value: "reminder", label: "Recordatorio" },
];

const ScheduledNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showServicePreview, setShowServicePreview] = useState(false);
  const [showVersePreview, setShowVersePreview] = useState(false);
  const [showAdvicePreview, setShowAdvicePreview] = useState(false);
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [testingNotification, setTestingNotification] = useState<ScheduledNotification | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    notification_type: "service_overlay",
    days_of_week: [1],
    time: "07:30",
    target_audience: "all",
    is_active: true,
    metadata: {
      verse_text: "",
      verse_reference: "",
      advice_title: "",
      advice_message: "",
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
        .order("time", { ascending: true });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error("Error fetching scheduled notifications:", error);
      toast.error("Error al cargar las notificaciones programadas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.days_of_week.length === 0) {
      toast.error("Debes seleccionar al menos un día");
      return;
    }

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
      days_of_week: notification.days_of_week || [1],
      time: notification.time,
      target_audience: notification.target_audience,
      is_active: notification.is_active,
      metadata: notification.metadata || {
        verse_text: "",
        verse_reference: "",
        advice_title: "",
        advice_message: "",
      },
    });
    setSelectedDays(notification.days_of_week || [1]);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      notification_type: "service_overlay",
      days_of_week: [1],
      time: "07:30",
      target_audience: "all",
      is_active: true,
      metadata: {
        verse_text: "",
        verse_reference: "",
        advice_title: "",
        advice_message: "",
      },
    });
    setSelectedDays([]);
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

  const getTypeColor = (type: string) => {
    const colors = {
      service_overlay: "bg-blue-100 text-blue-800 border-blue-200",
      daily_verse: "bg-green-100 text-green-800 border-green-200",
      daily_advice: "bg-yellow-100 text-yellow-800 border-yellow-200",
      general: "bg-gray-100 text-gray-800 border-gray-200",
      reminder: "bg-purple-100 text-purple-800 border-purple-200",
    };
    return colors[type as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const handlePreview = (notification: ScheduledNotification) => {
    setTestingNotification(notification);
    switch (notification.notification_type) {
      case "service_overlay":
        setShowServicePreview(true);
        break;
      case "daily_verse":
        setShowVersePreview(true);
        break;
      case "daily_advice":
        setShowAdvicePreview(true);
        break;
      default:
        toast.info("Vista previa no disponible para este tipo de notificación");
    }
  };

  const handleTestNotification = async (notification: ScheduledNotification) => {
    try {
      // Guardar la notificación que se está probando
      setTestingNotification(notification);

      // Mostrar el overlay directamente (igual que preview)
      switch (notification.notification_type) {
        case "service_overlay":
          setShowServicePreview(true);
          break;
        case "daily_verse":
          setShowVersePreview(true);
          break;
        case "daily_advice":
          setShowAdvicePreview(true);
          break;
        default:
          toast.info("Vista previa no disponible para este tipo de notificación");
          return;
      }

      // También crear la notificación en system_notifications para registro
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
      toast.success("Notificación de prueba enviada al sistema");
    } catch (error) {
      console.error("Error testing notification:", error);
      toast.error("Error al enviar notificación de prueba");
    }
  };

  const toggleDaySelection = (day: number) => {
    const newDays = formData.days_of_week.includes(day) 
      ? formData.days_of_week.filter((d) => d !== day) 
      : [...formData.days_of_week, day].sort();
    
    setFormData({ ...formData, days_of_week: newDays });
    setSelectedDays(newDays);
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

      {/* Panel de Pruebas de Notificaciones */}
      <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Panel de Prueba de Notificaciones
          </CardTitle>
          <p className="text-sm text-gray-600">
            Prueba los diferentes tipos de overlays de notificaciones
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Cumpleaños */}
            <div className="p-4 bg-pink-100 rounded-lg border-2 border-pink-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                🎁 Cumpleaños
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Notificación de cumpleaños con confeti y sonido
              </p>
              <Button
                size="sm"
                className="w-full"
                onClick={async () => {
                  try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;

                    const { error } = await supabase.from('system_notifications').insert({
                      type: 'birthday_daily',
                      title: '🎉 ¡Feliz Cumpleaños!',
                      message: 'Hoy es el cumpleaños de un miembro especial',
                      recipient_id: user.id,
                      notification_category: 'birthday',
                      priority: 3,
                      metadata: {
                        member_name: 'Miembro de Prueba',
                        member_photo: null,
                        sound: 'birthday',
                        confetti: true
                      }
                    });
                    
                    if (error) throw error;
                    toast.success('Notificación de cumpleaños enviada');
                  } catch (error) {
                    console.error(error);
                    toast.error('Error al enviar notificación');
                  }
                }}
              >
                Probar Notificación
              </Button>
            </div>

            {/* Versículo del Día */}
            <div className="p-4 bg-blue-100 rounded-lg border-2 border-blue-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                📖 Versículo del Día
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Versículo bíblico diario con reflexión
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowVersePreview(true)}
              >
                Probar Notificación
              </Button>
            </div>

            {/* Consejo del Día */}
            <div className="p-4 bg-yellow-100 rounded-lg border-2 border-yellow-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                💡 Consejo del Día
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Consejo diario para músicos
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowAdvicePreview(true)}
              >
                Probar Notificación
              </Button>
            </div>

            {/* Programa de Servicios */}
            <div className="p-4 bg-green-100 rounded-lg border-2 border-green-200">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                🎵 Programa de Servicios
              </h3>
              <p className="text-xs text-gray-600 mb-3">
                Overlay con detalles del próximo servicio
              </p>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => setShowServicePreview(true)}
              >
                Probar Notificación
              </Button>
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
                  <Badge variant="outline" className={getTypeColor(notification.notification_type)}>
                    {getTypeLabel(notification.notification_type)}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(notification)}
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleTestNotification(notification)}
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
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mt-0.5" />
                    <div>
                      <strong>Días:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {notification.days_of_week.sort((a, b) => a - b).map((day) => (
                          <Badge key={day} variant="outline" className="text-xs">
                            {getDayLabel(day)}
                          </Badge>
                        ))}
                      </div>
                    </div>
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

              {/* Metadata específica para cada tipo */}
              {notification.metadata && (
                <Collapsible className="mt-4">
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                    Ver detalles específicos
                    <ChevronDown className="w-4 h-4" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 p-3 bg-gray-50 rounded-lg">
                    {notification.notification_type === "daily_verse" && (
                      <div className="text-sm">
                        <strong>Versículo:</strong> {notification.metadata.verse_text}
                        <br />
                        <strong>Referencia:</strong> {notification.metadata.verse_reference}
                      </div>
                    )}
                    {notification.notification_type === "daily_advice" && (
                      <div className="text-sm">
                        <strong>Consejo:</strong> {notification.metadata.advice_title}
                        <br />
                        <strong>Mensaje:</strong> {notification.metadata.advice_message}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
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
              Crea tu primera notificación programada para mostrar overlays automáticamente.
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

            {/* Campos específicos según el tipo */}
            {formData.notification_type === "daily_verse" && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900">Configuración del Versículo</h4>
                <div className="space-y-2">
                  <Label htmlFor="verse_text">Texto del Versículo</Label>
                  <Textarea
                    id="verse_text"
                    value={formData.metadata.verse_text}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, verse_text: e.target.value },
                      })
                    }
                    placeholder="Porque de tal manera amó Dios al mundo..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="verse_reference">Referencia</Label>
                  <Input
                    id="verse_reference"
                    value={formData.metadata.verse_reference}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, verse_reference: e.target.value },
                      })
                    }
                    placeholder="Juan 3:16"
                  />
                </div>
              </div>
            )}

            {formData.notification_type === "daily_advice" && (
              <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-yellow-900">Configuración del Consejo</h4>
                <div className="space-y-2">
                  <Label htmlFor="advice_title">Título del Consejo</Label>
                  <Input
                    id="advice_title"
                    value={formData.metadata.advice_title}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, advice_title: e.target.value },
                      })
                    }
                    placeholder="La importancia de la oración"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advice_message">Mensaje del Consejo</Label>
                  <Textarea
                    id="advice_message"
                    value={formData.metadata.advice_message}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        metadata: { ...formData.metadata, advice_message: e.target.value },
                      })
                    }
                    placeholder="La oración es nuestra línea directa con Dios..."
                    rows={4}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Días de la Semana</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Selecciona los días en que se enviará esta notificación
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {daysOfWeek.map((day) => (
                  <label
                    key={day.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.days_of_week.includes(day.value)
                        ? "bg-primary/10 border-primary"
                        : "hover:bg-muted border-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.days_of_week.includes(day.value)}
                      onChange={() => toggleDaySelection(day.value)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">{day.label}</span>
                  </label>
                ))}
              </div>
              {formData.days_of_week.length === 0 && (
                <p className="text-sm text-red-500 mt-2">Debes seleccionar al menos un día</p>
              )}
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

            <div className="flex justify-end space-x-2 pt-4">
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

      {/* Overlays de Preview y Test */}
      {showServicePreview && (
        <ServiceNotificationOverlay
          forceShow={true}
          onClose={() => {
            setShowServicePreview(false);
            setTestingNotification(null);
          }}
          onNavigate={(path) => {
            setShowServicePreview(false);
            setTestingNotification(null);
            navigate(path);
          }}
        />
      )}

      {showVersePreview && (
        <DailyVerseOverlay
          verseText={testingNotification?.metadata?.verse_text || "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna."}
          verseReference={testingNotification?.metadata?.verse_reference || "Juan 3:16"}
          onClose={() => {
            setShowVersePreview(false);
            setTestingNotification(null);
          }}
        />
      )}

      {showAdvicePreview && (
        <DailyAdviceOverlay
          title={testingNotification?.metadata?.advice_title || "Practica con Propósito"}
          message={testingNotification?.metadata?.advice_message || "La práctica deliberada es más efectiva que simplemente tocar por horas. Enfócate en tus debilidades y establece metas específicas para cada sesión de práctica."}
          onClose={() => {
            setShowAdvicePreview(false);
            setTestingNotification(null);
          }}
        />
      )}
    </div>
  );
};

export default ScheduledNotifications;

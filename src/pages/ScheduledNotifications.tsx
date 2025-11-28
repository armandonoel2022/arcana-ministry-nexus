import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Clock,
  Calendar,
  Plus,
  Edit,
  Trash2,
  Bell,
  Save,
  X,
  Eye,
  Play,
  BookOpen,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import ServiceNotificationOverlay from "@/components/notifications/ServiceNotificationOverlay";
import { DailyVerseOverlay } from "@/components/notifications/DailyVerseOverlay";
import { DailyAdviceOverlay } from "@/components/notifications/DailyAdviceOverlay";
import GeneralAnnouncementOverlay from "@/components/notifications/GeneralAnnouncementOverlay";
import MinistryInstructionsOverlay from "@/components/notifications/MinistryInstructionsOverlay";
import ExtraordinaryRehearsalOverlay from "@/components/notifications/ExtraordinaryRehearsalOverlay";
import BloodDonationOverlay from "@/components/notifications/BloodDonationOverlay";
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
  { value: "death_announcement", label: "Anuncio de Fallecimiento" },
  { value: "meeting_announcement", label: "Convocatoria a Reunión" },
  { value: "special_service", label: "Servicio Especial" },
  { value: "prayer_request", label: "Solicitud de Oración" },
  { value: "blood_donation", label: "Donación de Sangre Urgente" },
  { value: "extraordinary_rehearsal", label: "Ensayo Extraordinario" },
  { value: "ministry_instructions", label: "Instrucciones a Integrantes" },
];

const ScheduledNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showServicePreview, setShowServicePreview] = useState(false);
  const [showVersePreview, setShowVersePreview] = useState(false);
  const [showAdvicePreview, setShowAdvicePreview] = useState(false);
  const [showGeneralAnnouncement, setShowGeneralAnnouncement] = useState(false);
  const [showMinistryInstructions, setShowMinistryInstructions] = useState(false);
  const [showExtraordinaryRehearsal, setShowExtraordinaryRehearsal] = useState(false);
  const [showBloodDonation, setShowBloodDonation] = useState(false);
  const [editingNotification, setEditingNotification] = useState<ScheduledNotification | null>(null);
  const [testingNotification, setTestingNotification] = useState<any>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loadingTest, setLoadingTest] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    notification_type: "service_overlay",
    days_of_week: [1],
    time: "07:30",
    target_audience: "all",
    is_active: true,
    metadata: {
      // Daily verse & advice (auto-loaded)
      verse_text: "",
      verse_reference: "",
      advice_title: "",
      advice_message: "",
      // General announcement fields
      title: "",
      message: "",
      // Ministry instructions fields
      instructions: "",
      priority: "normal",
      // Extraordinary rehearsal fields
      activity_name: "",
      date: "",
      rehearsal_time: "",
      location: "",
      additional_notes: "",
      // Blood donation fields
      recipient_name: "",
      blood_type: "",
      contact_phone: "",
      medical_center: "",
      family_contact: "",
      urgency_level: "urgent",
      additional_info: "",
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
      metadata: {
        verse_text: notification.metadata?.verse_text || "",
        verse_reference: notification.metadata?.verse_reference || "",
        advice_title: notification.metadata?.advice_title || "",
        advice_message: notification.metadata?.advice_message || "",
        title: notification.metadata?.title || "",
        message: notification.metadata?.message || "",
        instructions: notification.metadata?.instructions || "",
        priority: notification.metadata?.priority || "normal",
        activity_name: notification.metadata?.activity_name || "",
        date: notification.metadata?.date || "",
        rehearsal_time: notification.metadata?.rehearsal_time || "",
        location: notification.metadata?.location || "",
        additional_notes: notification.metadata?.additional_notes || "",
        recipient_name: notification.metadata?.recipient_name || "",
        blood_type: notification.metadata?.blood_type || "",
        contact_phone: notification.metadata?.contact_phone || "",
        medical_center: notification.metadata?.medical_center || "",
        family_contact: notification.metadata?.family_contact || "",
        urgency_level: notification.metadata?.urgency_level || "urgent",
        additional_info: notification.metadata?.additional_info || "",
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
        title: "",
        message: "",
        instructions: "",
        priority: "normal",
        activity_name: "",
        date: "",
        rehearsal_time: "",
        location: "",
        additional_notes: "",
        recipient_name: "",
        blood_type: "",
        contact_phone: "",
        medical_center: "",
        family_contact: "",
        urgency_level: "urgent",
        additional_info: "",
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
      death_announcement: "bg-gray-100 text-gray-800 border-gray-200",
      meeting_announcement: "bg-blue-100 text-blue-800 border-blue-200",
      special_service: "bg-purple-100 text-purple-800 border-purple-200",
      prayer_request: "bg-amber-100 text-amber-800 border-amber-200",
      blood_donation: "bg-red-100 text-red-800 border-red-200",
      extraordinary_rehearsal: "bg-indigo-100 text-indigo-800 border-indigo-200",
      ministry_instructions: "bg-blue-100 text-blue-800 border-blue-200",
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
      case "death_announcement":
      case "meeting_announcement":
      case "special_service":
      case "prayer_request":
        setShowGeneralAnnouncement(true);
        break;
      case "ministry_instructions":
        setShowMinistryInstructions(true);
        break;
      case "extraordinary_rehearsal":
        setShowExtraordinaryRehearsal(true);
        break;
      case "blood_donation":
        setShowBloodDonation(true);
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
        case "death_announcement":
        case "meeting_announcement":
        case "special_service":
        case "prayer_request":
          setShowGeneralAnnouncement(true);
          break;
        case "ministry_instructions":
          setShowMinistryInstructions(true);
          break;
        case "extraordinary_rehearsal":
          setShowExtraordinaryRehearsal(true);
          break;
        case "blood_donation":
          setShowBloodDonation(true);
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

  // Auto-generate name based on notification type and selected days
  useEffect(() => {
    const typeNames: Record<string, string> = {
      service_overlay: "Overlay de Servicios",
      daily_verse: "Versículo del Día",
      daily_advice: "Consejo del Día",
      death_announcement: "Anuncio de Fallecimiento",
      meeting_announcement: "Convocatoria a Reunión",
      special_service: "Servicio Especial",
      prayer_request: "Solicitud de Oración",
      blood_donation: "Donación de Sangre Urgente",
      extraordinary_rehearsal: "Ensayo Extraordinario",
      ministry_instructions: "Instrucciones a Integrantes",
    };

    const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const selectedDays = formData.days_of_week
      .sort()
      .map((d) => dayNames[d])
      .join(", ");

    const autoName = `${typeNames[formData.notification_type] || formData.notification_type} - ${selectedDays}`;
    setFormData((prev) => ({ ...prev, name: autoName }));
  }, [formData.notification_type, formData.days_of_week]);

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: "var(--gradient-primary)", width: "100vw", maxWidth: "100vw" }}
      >
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-3 sm:p-6 relative overflow-hidden"
      style={{ background: "var(--gradient-primary)", width: "100vw", maxWidth: "100vw" }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header con identidad ARCANA */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-arcana-gradient rounded-full flex items-center justify-center flex-shrink-0">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
              Notificaciones Programadas
            </h1>
            <p className="text-xs sm:text-sm text-white/80 truncate">Configura notificaciones automáticas</p>
          </div>
          <Button
            onClick={openCreateDialog}
            size="sm"
            className="flex-shrink-0 bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Panel de Contenido Principal */}
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
          {/* Panel de Gestión de Overlays - Grid Responsivo */}
          <Card className="w-full mb-6 border-0 shadow-lg">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <span>📱</span>
                <span className="truncate">Gestión de Overlays</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm truncate">
                Configura y prueba notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {/* Cumpleaños */}
                <Card className="border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg sm:text-xl">🎁</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-pink-800 dark:text-pink-200 truncate">
                          Cumpleaños
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-2">Próximo cumpleaños del ministerio</p>
                      <div className="space-y-1.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-pink-600 text-pink-600 hover:bg-pink-50 text-xs h-8"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              notification_type: "birthday",
                              days_of_week: [1],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-pink-600 hover:bg-pink-700 text-white text-xs h-8"
                          onClick={async () => {
                            setLoadingTest("birthday");
                            try {
                              const { data: members, error } = await supabase
                                .from("members")
                                .select("*")
                                .eq("is_active", true)
                                .not("fecha_nacimiento", "is", null);

                              if (error) throw error;

                              const today = new Date();
                              const upcomingBirthdays = members
                                ?.map((member) => {
                                  if (!member.fecha_nacimiento) return null;
                                  const birthDate = new Date(member.fecha_nacimiento);
                                  const nextBirthday = new Date(
                                    today.getFullYear(),
                                    birthDate.getMonth(),
                                    birthDate.getDate(),
                                  );
                                  if (nextBirthday < today) {
                                    nextBirthday.setFullYear(today.getFullYear() + 1);
                                  }
                                  const daysUntil = Math.ceil(
                                    (nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
                                  );
                                  return { ...member, daysUntil, nextBirthday };
                                })
                                .filter(Boolean)
                                .sort((a, b) => a.daysUntil - b.daysUntil);

                              if (upcomingBirthdays && upcomingBirthdays.length > 0) {
                                const nextBirthday = upcomingBirthdays[0];
                                window.dispatchEvent(
                                  new CustomEvent("testBirthdayOverlay", {
                                    detail: {
                                      id: nextBirthday.id,
                                      nombres: nextBirthday.nombres,
                                      apellidos: nextBirthday.apellidos,
                                      photo_url: nextBirthday.photo_url,
                                      cargo: nextBirthday.cargo,
                                      fecha_nacimiento: nextBirthday.fecha_nacimiento,
                                    },
                                  }),
                                );
                                toast.success(`Mostrando cumpleaños de ${nextBirthday.nombres}`);
                              } else {
                                toast.error("No hay cumpleaños próximos");
                              }
                            } catch (error) {
                              console.error("Error fetching birthday:", error);
                              toast.error("Error al cargar cumpleaños");
                            } finally {
                              setLoadingTest(null);
                            }
                          }}
                          disabled={loadingTest === "birthday"}
                        >
                          {loadingTest === "birthday" ? "Cargando..." : "Vista Previa"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Versículo del Día */}
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg sm:text-xl">📖</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-blue-800 dark:text-blue-200 truncate">
                          Versículo del Día
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-2">Versículo bíblico diario</p>
                      <div className="space-y-1.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 text-xs h-8"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              notification_type: "daily_verse",
                              days_of_week: [1, 2, 3, 4, 5, 6, 0],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-blue-600 text-blue-600 hover:bg-blue-50 text-xs h-8"
                          onClick={async () => {
                            try {
                              const today = new Date().toISOString().split("T")[0];
                              const juan316Id = "e424c67b-5b7b-49a5-9a28-227d65100371";

                              await supabase.from("daily_verses").delete().eq("date", today);

                              const { data: allVerses } = await supabase
                                .from("bible_verses")
                                .select("*")
                                .neq("id", juan316Id)
                                .limit(100);

                              if (allVerses && allVerses.length > 0) {
                                const newVerse = allVerses[Math.floor(Math.random() * allVerses.length)];

                                await supabase.from("daily_verses").insert({
                                  date: today,
                                  verse_id: newVerse.id,
                                  reflection: "Reflexión generada automáticamente",
                                });

                                // Actualizar el estado para mostrar el nuevo versículo
                                setTestingNotification({
                                  type: "daily_verse",
                                  title: "Versículo del Día",
                                  message: newVerse.text,
                                  metadata: {
                                    verse_reference: `${newVerse.book} ${newVerse.chapter}:${newVerse.verse}`,
                                  },
                                });

                                toast.success(
                                  `Versículo cambiado: ${newVerse.book} ${newVerse.chapter}:${newVerse.verse}`,
                                );
                              }
                            } catch (error) {
                              console.error("Error:", error);
                              toast.error("Error al cambiar versículo");
                            }
                          }}
                        >
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Cambiar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
                          onClick={async () => {
                            try {
                              // Cargar el versículo actual del día
                              const today = new Date().toISOString().split("T")[0];

                              const { data: dailyVerse } = await supabase
                                .from("daily_verses")
                                .select(
                                  `
                                  *,
                                  bible_verses (*)
                                `,
                                )
                                .eq("date", today)
                                .single();

                              if (dailyVerse && dailyVerse.bible_verses) {
                                const verse = dailyVerse.bible_verses as any;
                                setTestingNotification({
                                  type: "daily_verse",
                                  title: "Versículo del Día",
                                  message: verse.text,
                                  metadata: {
                                    verse_reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
                                  },
                                });
                                setShowVersePreview(true);
                              } else {
                                toast.error("No hay versículo del día configurado");
                              }
                            } catch (error) {
                              console.error("Error:", error);
                              toast.error("Error al cargar versículo");
                            }
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Vista Previa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Consejo del Día */}
                <Card className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg sm:text-xl">💡</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-yellow-800 dark:text-yellow-200 truncate">
                          Consejo del Día
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-2">Consejos musicales y vocales</p>
                      <div className="space-y-1.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-yellow-600 text-yellow-600 hover:bg-yellow-50 text-xs h-8"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              notification_type: "daily_advice",
                              days_of_week: [1, 2, 3, 4, 5, 6, 0],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-yellow-600 text-yellow-600 hover:bg-yellow-50 text-xs h-8"
                          onClick={async () => {
                            try {
                              const { data: adviceList } = await supabase
                                .from("daily_advice")
                                .select("*")
                                .eq("is_active", true);

                              if (adviceList && adviceList.length > 0) {
                                const randomAdvice = adviceList[Math.floor(Math.random() * adviceList.length)];

                                // Actualizar el estado para mostrar el nuevo consejo
                                setTestingNotification({
                                  type: "daily_advice",
                                  title: "Consejo del Día",
                                  message: randomAdvice.message,
                                  metadata: {
                                    advice_title: randomAdvice.title,
                                    advice_message: randomAdvice.message,
                                  },
                                });

                                toast.success(`Consejo actualizado: ${randomAdvice.title}`);
                              } else {
                                toast.error("No hay consejos disponibles");
                              }
                            } catch (error) {
                              console.error("Error:", error);
                              toast.error("Error al cambiar consejo");
                            }
                          }}
                        >
                          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Cambiar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white text-xs h-8"
                          onClick={async () => {
                            try {
                              // Cargar un consejo aleatorio de la base de datos
                              const { data: adviceList } = await supabase
                                .from("daily_advice")
                                .select("*")
                                .eq("is_active", true);

                              if (adviceList && adviceList.length > 0) {
                                const randomAdvice = adviceList[Math.floor(Math.random() * adviceList.length)];

                                setTestingNotification({
                                  type: "daily_advice",
                                  title: "Consejo del Día",
                                  message: randomAdvice.message,
                                  metadata: {
                                    advice_title: randomAdvice.title,
                                    advice_message: randomAdvice.message,
                                  },
                                });
                                setShowAdvicePreview(true);
                              } else {
                                toast.error("No hay consejos disponibles");
                              }
                            } catch (error) {
                              console.error("Error:", error);
                              toast.error("Error al cargar consejo");
                            }
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Vista Previa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Resto de las tarjetas con el mismo patrón responsivo */}
                {/* Programa de Servicios */}
                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg sm:text-xl">🎵</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-green-800 dark:text-green-200 truncate">
                          Programa de Servicios
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-2">Próximo servicio de adoración</p>
                      <div className="space-y-1.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-green-600 text-green-600 hover:bg-green-50 text-xs h-8"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              notification_type: "service_overlay",
                              days_of_week: [1],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                          onClick={() => setShowServicePreview(true)}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Vista Previa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Donación de Sangre Urgente */}
                <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg sm:text-xl">🩸</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-red-800 dark:text-red-200 truncate">
                          Donación de Sangre
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-2">Solicitud urgente de sangre</p>
                      <div className="space-y-1.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-red-600 text-red-600 hover:bg-red-50 text-xs h-8"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              notification_type: "blood_donation",
                              days_of_week: [0, 1, 2, 3, 4, 5, 6],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-red-600 hover:bg-red-700 text-white text-xs h-8"
                          onClick={() => {
                            setTestingNotification({
                              type: "blood_donation",
                              title: "Donación de Sangre Urgente",
                              message: "Se necesita donación de sangre con urgencia",
                              metadata: {
                                recipient_name: "Ejemplo de Paciente",
                                blood_type: "O+",
                                contact_phone: "809-555-0100",
                                medical_center: "Hospital Ejemplo",
                                family_contact: "Familiar del Paciente",
                                urgency_level: "urgent",
                              },
                            });
                            setShowBloodDonation(true);
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Vista Previa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Ensayo Extraordinario */}
                <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg sm:text-xl">🎭</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-indigo-800 dark:text-indigo-200 truncate">
                          Ensayo Extraordinario
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-2">Convocatoria a ensayo</p>
                      <div className="space-y-1.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50 text-xs h-8"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              notification_type: "extraordinary_rehearsal",
                              days_of_week: [0, 1, 2, 3, 4, 5, 6],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                          onClick={() => {
                            setTestingNotification({
                              type: "extraordinary_rehearsal",
                              title: "Ensayo Extraordinario",
                              message: "Se convoca a ensayo extraordinario",
                              metadata: {
                                activity_name: "Evento Especial Navideño",
                                date: "2025-12-15",
                                rehearsal_time: "18:00",
                                location: "Templo Principal",
                                additional_notes: "Traer partituras actualizadas",
                              },
                            });
                            setShowExtraordinaryRehearsal(true);
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Vista Previa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Instrucciones a Integrantes */}
                <Card className="border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950 dark:to-blue-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg sm:text-xl">📋</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-sky-800 dark:text-sky-200 truncate">
                          Instrucciones
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-2">Instrucciones al ministerio</p>
                      <div className="space-y-1.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-sky-600 text-sky-600 hover:bg-sky-50 text-xs h-8"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              notification_type: "ministry_instructions",
                              days_of_week: [0, 1, 2, 3, 4, 5, 6],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-sky-600 hover:bg-sky-700 text-white text-xs h-8"
                          onClick={() => {
                            setTestingNotification({
                              type: "ministry_instructions",
                              title: "Instrucciones Ministeriales",
                              message: "Instrucciones importantes",
                              metadata: {
                                instructions: "Todo el ministerio debe subir al altar para la ministración especial",
                                priority: "high",
                              },
                            });
                            setShowMinistryInstructions(true);
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Vista Previa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Anuncios Generales */}
                <Card className="border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950 dark:to-slate-900 hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-gray-500 to-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-lg sm:text-xl">📢</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-200 truncate">
                          Anuncios
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/70 line-clamp-2">Anuncios generales</p>
                      <div className="space-y-1.5 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full border-gray-600 text-gray-600 hover:bg-gray-50 text-xs h-8"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              notification_type: "death_announcement",
                              days_of_week: [0, 1, 2, 3, 4, 5, 6],
                            });
                            setIsDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          className="w-full bg-gray-600 hover:bg-gray-700 text-white text-xs h-8"
                          onClick={() => {
                            setTestingNotification({
                              type: "death_announcement",
                              title: "Anuncio Importante",
                              message: "Información relevante para el ministerio",
                              metadata: {
                                title: "Convocatoria a Reunión",
                                message: "Se convoca a todos los integrantes del ministerio a reunión general",
                              },
                            });
                            setShowGeneralAnnouncement(true);
                          }}
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          Vista Previa
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Notificaciones Programadas */}
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card key={notification.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base sm:text-lg truncate">{notification.name}</CardTitle>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <Badge variant={notification.is_active ? "default" : "secondary"} className="text-xs">
                            {notification.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getTypeColor(notification.notification_type)}`}
                          >
                            {getTypeLabel(notification.notification_type)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(notification)}
                        className="flex items-center gap-1 text-xs h-8"
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestNotification(notification)}
                        className="flex items-center gap-1 text-xs h-8"
                      >
                        <Play className="w-3 h-3" />
                        Probar
                      </Button>
                      <Switch
                        checked={notification.is_active}
                        onCheckedChange={(checked) => handleToggleActive(notification.id, checked)}
                        className="scale-75"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(notification)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(notification.id)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-gray-600">
                        <Calendar className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong>Días:</strong>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {notification.days_of_week
                              .sort((a, b) => a - b)
                              .map((day) => (
                                <Badge key={day} variant="outline" className="text-xs">
                                  {getDayLabel(day)}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4 flex-shrink-0" />
                        <span>
                          <strong>Hora:</strong> {notification.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Bell className="w-4 h-4 flex-shrink-0" />
                        <span>
                          <strong>Audiencia:</strong> {notification.target_audience === "all" ? "Todos" : "Específica"}
                        </span>
                      </div>
                    </div>
                    {notification.description && (
                      <div className="text-gray-600">
                        <strong>Descripción:</strong>
                        <p className="mt-1 line-clamp-3">{notification.description}</p>
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
        </div>
      </div>

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
              <Label htmlFor="name">Nombre (Generado Automáticamente)</Label>
              <Input
                id="name"
                value={formData.name}
                placeholder="Nombre de la notificación"
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                El nombre se genera automáticamente según el tipo y los días seleccionados
              </p>
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
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                      Carga Automática desde Base de Datos
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Los versículos del día se cargarán automáticamente desde la tabla{" "}
                      <code className="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-xs font-mono">
                        daily_verses
                      </code>{" "}
                      y rotarán entre los versículos disponibles cada día.
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                      No necesitas ingresar texto manualmente. El sistema seleccionará automáticamente el versículo del
                      día.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formData.notification_type === "daily_advice" && (
              <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                      Carga Automática desde Base de Datos
                    </h4>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Los consejos del día se cargarán automáticamente desde la tabla{" "}
                      <code className="bg-yellow-100 dark:bg-yellow-900 px-1.5 py-0.5 rounded text-xs font-mono">
                        daily_advice
                      </code>{" "}
                      y rotarán entre los consejos activos disponibles.
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 italic">
                      No necesitas ingresar texto manualmente. El sistema seleccionará automáticamente el consejo del
                      día.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* General Announcements */}
            {["death_announcement", "meeting_announcement", "special_service", "prayer_request"].includes(
              formData.notification_type,
            ) && (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-2">
                  <Label htmlFor="title">Título del Anuncio</Label>
                  <Input
                    id="title"
                    value={formData.metadata.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, title: e.target.value } })
                    }
                    placeholder="Ej: Fallecimiento de hermano/a, Reunión General, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Mensaje</Label>
                  <Textarea
                    id="message"
                    value={formData.metadata.message || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, message: e.target.value } })
                    }
                    placeholder="Detalles del anuncio..."
                    rows={4}
                    required
                  />
                </div>
              </div>
            )}

            {/* Ministry Instructions */}
            {formData.notification_type === "ministry_instructions" && (
              <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="space-y-2">
                  <Label htmlFor="instructions-title">Título de las Instrucciones</Label>
                  <Input
                    id="instructions-title"
                    value={formData.metadata.title || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, title: e.target.value } })
                    }
                    placeholder="Ej: Instrucciones para el próximo servicio"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions">Instrucciones Detalladas</Label>
                  <Textarea
                    id="instructions"
                    value={formData.metadata.instructions || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, instructions: e.target.value } })
                    }
                    placeholder="Ejemplo:&#10;- Todo el ministerio debe subir al altar&#10;- Quedense con los micrófonos&#10;- Tendremos presentación de niños&#10;- Necesitamos una canción para la ministración"
                    rows={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={formData.metadata.priority || "normal"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, priority: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Extraordinary Rehearsal */}
            {formData.notification_type === "extraordinary_rehearsal" && (
              <div className="space-y-4 p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-lg border border-indigo-200 dark:border-indigo-800">
                <div className="space-y-2">
                  <Label htmlFor="activity_name">Nombre de la Actividad</Label>
                  <Input
                    id="activity_name"
                    value={formData.metadata.activity_name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, activity_name: e.target.value } })
                    }
                    placeholder="Ej: Presentación Especial de Navidad"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rehearsal_date">Fecha del Ensayo</Label>
                    <Input
                      id="rehearsal_date"
                      type="date"
                      value={formData.metadata.date || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, metadata: { ...formData.metadata, date: e.target.value } })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rehearsal_time">Hora del Ensayo</Label>
                    <Input
                      id="rehearsal_time"
                      type="time"
                      value={formData.metadata.rehearsal_time || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, metadata: { ...formData.metadata, rehearsal_time: e.target.value } })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rehearsal_location">Lugar</Label>
                  <Input
                    id="rehearsal_location"
                    value={formData.metadata.location || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, location: e.target.value } })
                    }
                    placeholder="Ej: Templo Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rehearsal_notes">Notas Adicionales</Label>
                  <Textarea
                    id="rehearsal_notes"
                    value={formData.metadata.additional_notes || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, additional_notes: e.target.value } })
                    }
                    placeholder="Información adicional..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Blood Donation */}
            {formData.notification_type === "blood_donation" && (
              <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient_name">Nombre del Paciente</Label>
                    <Input
                      id="recipient_name"
                      value={formData.metadata.recipient_name || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, metadata: { ...formData.metadata, recipient_name: e.target.value } })
                      }
                      placeholder="Nombre completo"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blood_type">Tipo de Sangre</Label>
                    <Select
                      value={formData.metadata.blood_type || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, metadata: { ...formData.metadata, blood_type: value } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medical_center">Centro Médico</Label>
                  <Input
                    id="medical_center"
                    value={formData.metadata.medical_center || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, medical_center: e.target.value } })
                    }
                    placeholder="Ej: Hospital Central"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Teléfono de Contacto</Label>
                    <Input
                      id="contact_phone"
                      value={formData.metadata.contact_phone || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, metadata: { ...formData.metadata, contact_phone: e.target.value } })
                      }
                      placeholder="(809) 123-4567"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="family_contact">Familiar Cercano</Label>
                    <Input
                      id="family_contact"
                      value={formData.metadata.family_contact || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, metadata: { ...formData.metadata, family_contact: e.target.value } })
                      }
                      placeholder="Nombre del familiar"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency_level">Nivel de Urgencia</Label>
                  <Select
                    value={formData.metadata.urgency_level || "urgent"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, urgency_level: value } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional_info">Información Adicional</Label>
                  <Textarea
                    id="additional_info"
                    value={formData.metadata.additional_info || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, metadata: { ...formData.metadata, additional_info: e.target.value } })
                    }
                    placeholder="Detalles adicionales..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Días de la Semana</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Selecciona los días en que se enviará esta notificación
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

      {showVersePreview && testingNotification && (
        <DailyVerseOverlay
          verseText={testingNotification.message || "Cargando versículo..."}
          verseReference={testingNotification.metadata?.verse_reference || ""}
          onClose={() => {
            setShowVersePreview(false);
            setTestingNotification(null);
          }}
        />
      )}

      {showAdvicePreview && (
        <DailyAdviceOverlay
          title={testingNotification?.metadata?.advice_title || "Practica con Propósito"}
          message={
            testingNotification?.metadata?.advice_message ||
            "La práctica deliberada es más efectiva que simplemente tocar por horas. Enfócate en tus debilidades y establece metas específicas para cada sesión de práctica."
          }
          onClose={() => {
            setShowAdvicePreview(false);
            setTestingNotification(null);
          }}
        />
      )}

      {showGeneralAnnouncement && testingNotification && (
        <GeneralAnnouncementOverlay
          title={testingNotification.metadata?.title || "Anuncio Importante"}
          message={testingNotification.metadata?.message || testingNotification.description}
          announcementType={testingNotification.notification_type as any}
          onClose={() => {
            setShowGeneralAnnouncement(false);
            setTestingNotification(null);
          }}
        />
      )}

      {showMinistryInstructions && testingNotification && (
        <MinistryInstructionsOverlay
          title={testingNotification.metadata?.title || "Instrucciones"}
          instructions={testingNotification.metadata?.instructions || testingNotification.description}
          priority={testingNotification.metadata?.priority || "normal"}
          onClose={() => {
            setShowMinistryInstructions(false);
            setTestingNotification(null);
          }}
        />
      )}

      {showExtraordinaryRehearsal && testingNotification && (
        <ExtraordinaryRehearsalOverlay
          activityName={testingNotification.metadata?.activity_name || testingNotification.name}
          date={testingNotification.metadata?.date || new Date().toISOString()}
          time={testingNotification.metadata?.rehearsal_time || ""}
          location={testingNotification.metadata?.location}
          additionalNotes={testingNotification.metadata?.additional_notes}
          onClose={() => {
            setShowExtraordinaryRehearsal(false);
            setTestingNotification(null);
          }}
        />
      )}

      {showBloodDonation && testingNotification && (
        <BloodDonationOverlay
          recipientName={testingNotification.metadata?.recipient_name || ""}
          bloodType={testingNotification.metadata?.blood_type || ""}
          contactPhone={testingNotification.metadata?.contact_phone || ""}
          medicalCenter={testingNotification.metadata?.medical_center || ""}
          familyContact={testingNotification.metadata?.family_contact || ""}
          urgencyLevel={testingNotification.metadata?.urgency_level || "urgent"}
          additionalInfo={testingNotification.metadata?.additional_info}
          onClose={() => {
            setShowBloodDonation(false);
            setTestingNotification(null);
          }}
        />
      )}
    </div>
  );
};

export default ScheduledNotifications;

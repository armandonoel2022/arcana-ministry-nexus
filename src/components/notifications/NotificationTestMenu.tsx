import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, Music, Gift, BookOpen, Sparkles, Coffee, UserCheck, Baby, Heart, Droplets, Users, Mic } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

const NotificationTestMenu = () => {
  const [sending, setSending] = useState<string | null>(null);
  const { toast } = useToast();

  const testNotification = async (type: string, data: any) => {
    setSending(type);
    try {
      const { error } = await supabase.from("system_notifications").insert({
        type: data.type,
        title: data.title,
        message: data.message,
        recipient_id: null,
        notification_category: data.category,
        priority: data.priority || 2,
        metadata: data.metadata || {},
      });

      if (error) throw error;

      toast({
        title: "Notificación enviada",
        description: `La notificación de ${type} ha sido enviada exitosamente.`,
      });

      if (type === "cumpleaños") {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      toast({
        title: "Error",
        description: `No se pudo enviar la notificación de ${type}.`,
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const testBirthday = () => {
    testNotification("cumpleaños", {
      type: "birthday",
      title: "🎂 ¡Feliz Cumpleaños Sugey A.!",
      message: "¡Hoy está de cumpleaños Sugey A. González Garó! Recuerda dedicarle un mensaje de felicitación.",
      category: "general",
      priority: 3,
      metadata: {
        birthday_member_id: "test-member-1",
        birthday_member_name: "Sugey A. González Garó",
        birthday_member_photo: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/be61d066-5707-4763-8d8c-16d19597dc3a.JPG",
        member_role: "Vocalista",
        birthday_date: new Date().toISOString().split("T")[0],
        show_overlay: true,
      },
    });
  };

  const testDirectorChange = () => {
    testNotification("cambio de director", {
      type: "director_change",
      title: "Cambio de Director - Domingo 8:00 AM",
      message: "Se ha realizado un cambio de director para el servicio del domingo.",
      category: "agenda",
      priority: 2,
      metadata: {
        service_date: new Date().toISOString().split("T")[0],
        service_title: "Servicio Dominical - 8:00 AM",
        original_director: "Juan Pérez",
        original_director_photo: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/d6602109-ad3e-4db6-ab4a-2984dadfc569.JPG",
        new_director: "María García",
        new_director_photo: "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/00a916a8-ab94-4cc0-81ae-668dd6071416.JPG",
        reason: "Compromiso familiar",
        show_overlay: true,
      },
    });
  };

  const testBirthAnnouncement = () => {
    testNotification("nacimiento", {
      type: "birth_announcement",
      title: "🎉 ¡Ha Nacido un Bebé!",
      message: "¡Celebramos el nacimiento del bebé de la familia Rodríguez!",
      category: "general",
      priority: 3,
      metadata: {
        baby_name: "Samuel David",
        parent_names: "Carlos y Ana Rodríguez",
        birth_date: new Date().toISOString().split("T")[0],
        weight: "3.5 kg",
        message: "¡Damos gracias a Dios por esta bendición!",
        show_overlay: true,
      },
    });
  };

  const testPregnancyReveal = () => {
    testNotification("embarazo", {
      type: "pregnancy_reveal",
      title: "💕 ¡Estamos Esperando un Bebé!",
      message: "¡La familia Martínez anuncia que están esperando un bebé!",
      category: "general",
      priority: 2,
      metadata: {
        parent_names: "Pedro y Laura Martínez",
        expected_date: "Agosto 2025",
        message: "¡Nos llena de alegría compartir esta noticia con nuestra familia ministerial!",
        show_overlay: true,
      },
    });
  };

  const testBloodDonation = () => {
    testNotification("donación de sangre", {
      type: "blood_donation",
      title: "🩸 Donación de Sangre Urgente",
      message: "Se necesita sangre tipo O+ para un hermano de la iglesia.",
      category: "general",
      priority: 3,
      metadata: {
        blood_type: "O+",
        recipient_name: "Carlos Méndez",
        medical_center: "Hospital HOMS",
        contact_phone: "809-555-1234",
        urgency_level: "urgente",
        show_overlay: true,
      },
    });
  };

  const testDirectorRequest = () => {
    // Disparar evento para overlay de solicitud de reemplazo
    window.dispatchEvent(new CustomEvent('testDirectorRequestOverlay', {
      detail: {
        id: 'test-request-1',
        service_id: 'test-service-1',
        original_director_id: 'test-original',
        original_director: { full_name: 'Juan Pérez', photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/d6602109-ad3e-4db6-ab4a-2984dadfc569.JPG' },
        service: { title: 'Servicio Dominical - 8:00 AM', service_date: new Date().toISOString() },
        reason: 'Tengo un compromiso familiar y no podré asistir este domingo.',
        requested_at: new Date().toISOString(),
      }
    }));
    toast({
      title: "Overlay disparado",
      description: "Se ha disparado el overlay de solicitud de reemplazo de director.",
    });
  };

  const testDailyVerse = () => {
    testNotification("versículo", {
      type: "daily_verse",
      title: "📖 Versículo del Día",
      message: '"Porque mis pensamientos no son vuestros pensamientos, ni vuestros caminos mis caminos, dice Jehová." - Isaías 55:8',
      category: "spiritual",
      priority: 1,
      metadata: {
        verse_text: "Porque mis pensamientos no son vuestros pensamientos, ni vuestros caminos mis caminos, dice Jehová.",
        verse_reference: "Isaías 55:8",
        show_overlay: true,
      },
    });
  };

  const testDailyAdvice = () => {
    testNotification("consejo", {
      type: "daily_advice",
      title: "💡 Consejo del Día",
      message: '🎵 "La música es el lenguaje del alma"\n\n✨ Recuerda que cada nota que tocas tiene el poder de tocar corazones.',
      category: "training",
      priority: 1,
      metadata: {
        advice_title: "La música es el lenguaje del alma",
        advice_message: "Recuerda que cada nota que tocas tiene el poder de tocar corazones.",
        show_overlay: true,
      },
    });
  };

  const testSpecialEvent = () => {
    testNotification("evento especial", {
      type: "special_event",
      title: "🎊 Evento Especial - Culto Misionero",
      message: "¡Se acerca nuestro Culto Misionero! Próximo Domingo a las 10:00 AM.",
      category: "events",
      priority: 3,
      metadata: {
        event_title: "Culto Misionero",
        event_date: new Date().toISOString(),
        event_location: "Templo Principal",
        show_overlay: true,
      },
    });
  };

  const testWeekendService = () => {
    testNotification("servicio", {
      type: "service_overlay",
      title: "🎼 Programa de Servicios",
      message: "Se ha publicado el programa de servicios para este fin de semana.",
      category: "agenda",
      priority: 2,
      metadata: {
        show_overlay: true,
      },
    });
  };

  const notifications = [
    {
      id: "birthday",
      title: "Cumpleaños",
      description: "Overlay de celebración de cumpleaños",
      icon: Gift,
      color: "bg-pink-500",
      action: testBirthday,
    },
    {
      id: "director_change",
      title: "Cambio de Director",
      description: "Notificación de cambio de director",
      icon: UserCheck,
      color: "bg-orange-500",
      action: testDirectorChange,
    },
    {
      id: "director_request",
      title: "Solicitud de Reemplazo",
      description: "Overlay de solicitud de reemplazo de director",
      icon: Users,
      color: "bg-amber-500",
      action: testDirectorRequest,
    },
    {
      id: "birth",
      title: "Anuncio de Nacimiento",
      description: "Celebración del nacimiento de un bebé",
      icon: Baby,
      color: "bg-blue-400",
      action: testBirthAnnouncement,
    },
    {
      id: "pregnancy",
      title: "Revelación de Embarazo",
      description: "Anuncio de embarazo",
      icon: Heart,
      color: "bg-rose-400",
      action: testPregnancyReveal,
    },
    {
      id: "blood",
      title: "Donación de Sangre",
      description: "Solicitud urgente de donación",
      icon: Droplets,
      color: "bg-red-500",
      action: testBloodDonation,
    },
    {
      id: "verse",
      title: "Versículo del Día",
      description: "Versículo bíblico diario",
      icon: BookOpen,
      color: "bg-blue-500",
      action: testDailyVerse,
    },
    {
      id: "advice",
      title: "Consejo del Día",
      description: "Consejo motivacional",
      icon: Coffee,
      color: "bg-green-500",
      action: testDailyAdvice,
    },
    {
      id: "event",
      title: "Evento Especial",
      description: "Notificación de eventos",
      icon: Sparkles,
      color: "bg-purple-500",
      action: testSpecialEvent,
    },
    {
      id: "service",
      title: "Servicios",
      description: "Programa de servicios",
      icon: Calendar,
      color: "bg-indigo-500",
      action: testWeekendService,
    },
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-6 h-6 text-blue-600" />
          <span>Menú de Pruebas de Notificaciones</span>
        </CardTitle>
        <p className="text-sm text-gray-600">Prueba diferentes tipos de notificaciones superpuestas</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          const isLoading = sending === notification.id;

          return (
            <div
              key={notification.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${notification.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{notification.title}</h3>
                  <p className="text-sm text-gray-600">{notification.description}</p>
                </div>
              </div>
              <Button
                onClick={() => {
                  setSending(notification.id);
                  notification.action();
                }}
                disabled={isLoading}
                size="sm"
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Music className="w-4 h-4" />
                <span>{isLoading ? "Enviando..." : "Probar"}</span>
              </Button>
            </div>
          );
        })}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Nota sobre las notificaciones</h4>
              <p className="text-sm text-blue-700 mt-1">
                Las notificaciones aparecerán en la esquina superior derecha de la pantalla y también se almacenarán en
                el centro de notificaciones para revisión posterior.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTestMenu;

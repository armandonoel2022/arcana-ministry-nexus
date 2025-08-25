import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, BookOpen, MessageSquare, Calendar, Church, Lightbulb, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from 'canvas-confetti';

const NotificationTestButton = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const testNotification = async (type: string, data: any) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para probar las notificaciones",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('system_notifications')
        .insert({
          type: type,
          recipient_id: user.id,
          title: data.title,
          message: data.message,
          metadata: data.metadata || {},
          priority: data.priority || 1,
          notification_category: data.category || 'test'
        });

      if (error) throw error;

      // Efectos especiales para cumpleaños
      if (type === 'birthday') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }

      toast({
        title: "¡Notificación enviada!",
        description: `La notificación de prueba "${data.title}" se ha enviado correctamente.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo enviar la notificación: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Funciones específicas de prueba
  const testBirthday = () => testNotification('birthday', {
    title: "🎉 ¡Feliz Cumpleaños! 🎂",
    message: "¡Hoy está de cumpleaños un integrante del ministerio!",
    metadata: {
      birthday_member_name: "Juan Carlos Medina",
      birthday_member_photo: "/lovable-uploads/43125001-4383-4612-84dd-b01a2ee6a562.png",
      birthday_date: new Date().toISOString(),
      is_birthday_person: false
    },
    priority: 3,
    category: 'birthday'
  });

  const testDailyVerse = () => testNotification('daily_verse', {
    title: "Versículo del Día - ARCANA",
    message: "Ministerio ADN\nArca de Noé",
    metadata: {
      verse_text: "Todo lo que respira alabe a JAH. Aleluya.",
      verse_reference: "Salmo 150:6",
      verse_version: "RVR1960"
    },
    priority: 2,
    category: 'spiritual'
  });

  const testDailyAdvice = () => testNotification('daily_advice', {
    title: "💡 Consejo del Día para Músicos",
    message: "Practica con dedicación, pero también escucha tu cuerpo y descansa cuando sea necesario.",
    metadata: {
      advice_category: "técnica_musical",
      tip_of_day: true
    },
    priority: 1,
    category: 'training'
  });

  const testSpecialEvent = () => testNotification('special_event', {
    title: "🎊 Evento Especial - Concierto de Navidad",
    message: "Se acerca nuestro concierto navideño. ¡Prepárense para una noche llena de alabanza!",
    metadata: {
      event_name: "Concierto de Navidad 2025",
      event_date: "2025-12-20",
      event_location: "Templo Principal"
    },
    priority: 3,
    category: 'events'
  });

  const testWeekendService = () => testNotification('weekend_service', {
    title: "📅 Programa de Servicios - 4to Domingo de Agosto",
    message: "Consulta el programa de servicios para este fin de semana",
    metadata: {
      service_date: "2025-08-24",
      month_order: "4to Domingo",
      special_event: "Culto Misionero",
      services: [
        {
          time: "8:00 a.m.",
          director: {
            name: "Keyla Medrano",
            photo: "/lovable-uploads/43125001-4383-4612-84dd-b01a2ee6a562.png"
          },
          group: "Grupo de Keyla",
          voices: [
            { name: "Keyla Medrano", photo: "/lovable-uploads/43125001-4383-4612-84dd-b01a2ee6a562.png" },
            { name: "Carolina Santana", photo: "/lovable-uploads/74634c97-a2ef-403b-9fa0-89d9207b7b00.png" },
            { name: "Arisoni Liriano", photo: "/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" },
            { name: "Lorena Pacheco", photo: "/lovable-uploads/a58d8d74-4ced-444f-b402-8a028fc7f65e.png" },
            { name: "Sugey Garó", photo: "/lovable-uploads/43125001-4383-4612-84dd-b01a2ee6a562.png" }
          ]
        },
        {
          time: "10:45 a.m.",
          director: {
            name: "Roosevelt Martínez",
            photo: "/lovable-uploads/74634c97-a2ef-403b-9fa0-89d9207b7b00.png"
          },
          group: "Grupo de Massy",
          voices: [
            { name: "Damaris Castillo", photo: "/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" },
            { name: "Jisell Mauricio", photo: "/lovable-uploads/a58d8d74-4ced-444f-b402-8a028fc7f65e.png" },
            { name: "Abraham Valera", photo: "/lovable-uploads/43125001-4383-4612-84dd-b01a2ee6a562.png" },
            { name: "Rosely Montero", photo: "/lovable-uploads/74634c97-a2ef-403b-9fa0-89d9207b7b00.png" },
            { name: "Rode Santana", photo: "/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" }
          ]
        }
      ]
    },
    priority: 2,
    category: 'agenda'
  });

  const notifications = [
    {
      icon: <Gift className="w-8 h-8" />,
      title: "Cumpleaños",
      description: "Notificación de cumpleaños con confeti y sonido",
      color: "from-pink-500 to-purple-500",
      action: testBirthday
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Versículo del Día",
      description: "Versículo bíblico diario con reflexión",
      color: "from-blue-500 to-indigo-500",
      action: testDailyVerse
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Consejo del Día",
      description: "Consejo diario para músicos y ministerio",
      color: "from-yellow-500 to-orange-500",
      action: testDailyAdvice
    },
    {
      icon: <Church className="w-8 h-8" />,
      title: "Evento Especial",
      description: "Notificación de eventos especiales del ministerio",
      color: "from-purple-500 to-pink-500",
      action: testSpecialEvent
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Programa de Servicios",
      description: "Programa detallado del fin de semana con fotos",
      color: "from-green-500 to-blue-500",
      action: testWeekendService
    }
  ];

  return (
    <div className="space-y-6">
      {/* Grid de notificaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notifications.map((notification, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow duration-300 border-2 hover:border-gray-300">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className={`p-4 rounded-full bg-gradient-to-r ${notification.color} text-white`}>
                  {notification.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900 mb-2">
                    {notification.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {notification.description}
                  </p>
                  <Button 
                    onClick={notification.action}
                    disabled={loading}
                    className={`w-full bg-gradient-to-r ${notification.color} hover:opacity-90 text-white border-0`}
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Probar Notificación
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instrucciones */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            ¿Cómo usar estas pruebas?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-blue-700">
            <li>• Las notificaciones aparecerán superpuestas en cualquier pantalla donde estés</li>
            <li>• También se guardarán en tu centro de notificaciones para verlas después</li>
            <li>• Puedes cerrar las notificaciones haciendo clic en el botón de cerrar (X)</li>
            <li>• Las notificaciones de cumpleaños incluyen confeti y sonidos especiales</li>
            <li>• El programa de servicios muestra las fotos de los integrantes del ministerio</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTestButton;
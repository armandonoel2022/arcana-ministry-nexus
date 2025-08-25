import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Calendar, Music, Gift, BookOpen, Sparkles, Coffee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import confetti from 'canvas-confetti';

const NotificationTestMenu = () => {
  const [sending, setSending] = useState<string | null>(null);
  const { toast } = useToast();

  const testNotification = async (type: string, data: any) => {
    setSending(type);
    try {
      const { error } = await supabase
        .from('system_notifications')
        .insert({
          type: data.type,
          title: data.title,
          message: data.message,
          recipient_id: null, // null significa que es para todos
          notification_category: data.category,
          priority: data.priority || 2,
          metadata: data.metadata || {}
        });

      if (error) throw error;

      toast({
        title: "Notificación enviada",
        description: `La notificación de ${type} ha sido enviada exitosamente.`,
      });

      // Efecto especial para cumpleaños
      if (type === 'cumpleaños') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
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
    testNotification('cumpleaños', {
      type: 'birthday_daily',
      title: '🎂 ¡Feliz Cumpleaños Sugey A.!',
      message: '🎉 ¡Hoy está de cumpleaños Sugey A. González Garó! 🎂\n\nRecuerda ir a la sala de chat general y dedicarle un mensaje de felicitación. ¡Hagamos que se sienta especial en su día! ✨',
      category: 'birthday',
      priority: 3,
      metadata: {
        birthday_member_name: 'Sugey A. González Garó',
        birthday_member_photo: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/be61d066-5707-4763-8d8c-16d19597dc3a.JPG',
        birthday_date: new Date().toISOString().split('T')[0],
        show_confetti: true,
        play_birthday_sound: true
      }
    });
  };

  const testDailyVerse = () => {
    testNotification('versículo', {
      type: 'daily_verse',
      title: '📖 Versículo del Día',
      message: '"Porque mis pensamientos no son vuestros pensamientos, ni vuestros caminos mis caminos, dice Jehová."\n\n- Isaías 55:8 (RVR1960)\n\n💭 Reflexión: Confía en los planes de Dios, aunque no los comprendas completamente.',
      category: 'spiritual',
      priority: 1
    });
  };

  const testDailyAdvice = () => {
    testNotification('consejo', {
      type: 'daily_advice',
      title: '💡 Consejo del Día',
      message: '🎵 "La música es el lenguaje del alma"\n\n✨ Recuerda que cada nota que tocas y cada voz que alzas en alabanza tiene el poder de tocar corazones y acercar a las personas a Dios. ¡Practica con amor y dedicación!',
      category: 'training',
      priority: 1
    });
  };

  const testSpecialEvent = () => {
    testNotification('evento especial', {
      type: 'special_event',
      title: '🎊 Evento Especial - Culto Misionero',
      message: '🌍 ¡Se acerca nuestro Culto Misionero!\n\n📅 Fecha: Próximo Domingo\n⏰ Hora: 10:00 AM\n📍 Lugar: Templo Principal\n\n¡Prepárate para un tiempo especial de adoración y misiones! 🙏',
      category: 'events',
      priority: 3
    });
  };

  const testWeekendService = () => {
    testNotification('weekend_service', {
      type: 'weekend_service',
      title: '🎼 Programa de Servicios - 4to Domingo de Agosto',
      message: 'Se ha publicado el programa de servicios para el fin de semana. Revisa tu participación y prepárate para un tiempo de bendición.',
      category: 'agenda',
      priority: 2,
      metadata: {
        service_date: '2025-08-24',
        month_order: '4to Domingo',
        special_event: 'Culto Misionero'
      }
    });
  };

  const notifications = [
    {
      id: 'birthday',
      title: 'Cumpleaños',
      description: 'Notificación de cumpleaños con confetti y sonido',
      icon: Gift,
      color: 'bg-pink-500',
      action: testBirthday
    },
    {
      id: 'verse',
      title: 'Versículo del Día',
      description: 'Versículo bíblico diario con reflexión',
      icon: BookOpen,
      color: 'bg-blue-500',
      action: testDailyVerse
    },
    {
      id: 'advice',
      title: 'Consejo del Día',
      description: 'Consejo motivacional para músicos',
      icon: Coffee,
      color: 'bg-green-500',
      action: testDailyAdvice
    },
    {
      id: 'event',
      title: 'Eventos Especiales',
      description: 'Notificación de eventos importantes',
      icon: Sparkles,
      color: 'bg-purple-500',
      action: testSpecialEvent
    },
    {
      id: 'service',
      title: 'Servicio del Fin de Semana',
      description: 'Programa detallado con integrantes y fotos',
      icon: Calendar,
      color: 'bg-indigo-500',
      action: testWeekendService
    }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bell className="w-6 h-6 text-blue-600" />
          <span>Menú de Pruebas de Notificaciones</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Prueba diferentes tipos de notificaciones superpuestas
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((notification) => {
          const Icon = notification.icon;
          const isLoading = sending === notification.id;
          
          return (
            <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
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
                <span>{isLoading ? 'Enviando...' : 'Probar'}</span>
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
                Las notificaciones aparecerán en la esquina superior derecha de la pantalla 
                y también se almacenarán en el centro de notificaciones para revisión posterior.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationTestMenu;
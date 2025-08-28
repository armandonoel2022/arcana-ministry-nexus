import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gift, BookOpen, MessageSquare, Church, Lightbulb, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import confetti from 'canvas-confetti';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Importar componentes necesarios
import BirthdayCard from '@/components/birthday/BirthdayCard';

const NotificationTestButton = () => {
  const [loading, setLoading] = useState(false);
  const [showBirthdayOverlay, setShowBirthdayOverlay] = useState(false);
  const [showVerseOverlay, setShowVerseOverlay] = useState(false);
  const [showAdviceOverlay, setShowAdviceOverlay] = useState(false);
  const [showEventOverlay, setShowEventOverlay] = useState(false);
  const [currentContent, setCurrentContent] = useState<any>(null);
  const { toast } = useToast();

  // Función para reproducir sonido de cumpleaños (desde BirthdayNotificationBanner.tsx)
  const playBirthdaySound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const notes = [
        { freq: 261.63, duration: 0.3 },
        { freq: 261.63, duration: 0.2 },
        { freq: 293.66, duration: 0.4 },
        { freq: 261.63, duration: 0.4 },
        { freq: 349.23, duration: 0.4 },
        { freq: 329.63, duration: 0.8 },
      ];

      let currentTime = audioContext.currentTime;
      
      notes.forEach((note) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(note.freq, currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + note.duration);
        
        currentTime += note.duration + 0.1;
      });
    } catch (error) {
      console.log('No se pudo reproducir el sonido de cumpleaños:', error);
    }
  };

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

      if (type === 'birthday') {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        playBirthdaySound();
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

  // Función para obtener etiqueta del rol (desde BirthdayModule.tsx)
  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      'pastor': 'Pastor',
      'pastora': 'Pastora',
      'director_alabanza': 'Director de Alabanza',
      'directora_alabanza': 'Directora de Alabanza',
      'director_musical': 'Director Musical',
      'corista': 'Corista',
      'directora_danza': 'Directora de Danza',
      'director_multimedia': 'Director Multimedia',
      'camarografo': 'Camarógrafo',
      'camarógrafa': 'Camarógrafa',
      'encargado_piso': 'Encargado de Piso',
      'encargada_piso': 'Encargada de Piso',
      'musico': 'Músico',
      'sonidista': 'Sonidista',
      'encargado_luces': 'Encargado de Luces',
      'encargado_proyeccion': 'Encargado de Proyección',
      'encargado_streaming': 'Encargado de Streaming'
    };
    return roleLabels[role] || role;
  };

  // Funciones específicas de prueba
  const testBirthday = async () => {
    setLoading(true);
    try {
      // Obtener datos de un miembro de ejemplo para el cumpleaños
      const { data: members, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (error) throw error;

      if (members && members.length > 0) {
        const member = members[0];
        setCurrentContent({
          type: 'birthday',
          member: {
            id: member.id,
            nombres: member.nombres || 'Usuario',
            apellidos: member.apellidos || 'Ejemplo',
            photo_url: member.photo_url,
            cargo: member.cargo || 'corista'
          }
        });
        setShowBirthdayOverlay(true);
        
        // También crear la notificación en BD
        await testNotification('birthday', {
          title: "🎉 ¡Feliz Cumpleaños! 🎂",
          message: "¡Hoy está de cumpleaños un integrante del ministerio!",
          metadata: {
            birthday_member_name: `${member.nombres} ${member.apellidos}`,
            birthday_member_photo: member.photo_url,
            birthday_date: new Date().toISOString(),
            is_birthday_person: false
          },
          priority: 3,
          category: 'birthday'
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo cargar datos de cumpleaños: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testDailyVerse = async () => {
    setLoading(true);
    try {
      // Obtener versículo del día
      const { data: verses, error } = await supabase
        .from('daily_verses')
        .select('*')
        .order('date', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (verses && verses.length > 0) {
        const verse = verses[0];
        setCurrentContent({
          type: 'verse',
          verse: verse
        });
        setShowVerseOverlay(true);
        
        await testNotification('daily_verse', {
          title: "📖 Versículo del Día",
          message: verse.verse_text,
          metadata: {
            verse_text: verse.verse_text,
            verse_reference: verse.verse_reference,
            verse_version: verse.version || "RVR1960"
          },
          priority: 2,
          category: 'spiritual'
        });
      } else {
        // Usar versículo de ejemplo si no hay en la base de datos
        setCurrentContent({
          type: 'verse',
          verse: {
            verse_text: "Todo lo que respira alabe a JAH. Aleluya.",
            verse_reference: "Salmo 150:6",
            version: "RVR1960"
          }
        });
        setShowVerseOverlay(true);
        
        await testNotification('daily_verse', {
          title: "📖 Versículo del Día",
          message: "Todo lo que respira alabe a JAH. Aleluya.",
          metadata: {
            verse_text: "Todo lo que respira alabe a JAH. Aleluya.",
            verse_reference: "Salmo 150:6",
            verse_version: "RVR1960"
          },
          priority: 2,
          category: 'spiritual'
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo cargar el versículo: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testDailyAdvice = async () => {
    setLoading(true);
    try {
      // Obtener consejo aleatorio
      const { data: advice, error } = await supabase
        .from('musician_tips')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (advice && advice.length > 0) {
        const tip = advice[0];
        setCurrentContent({
          type: 'advice',
          advice: tip
        });
        setShowAdviceOverlay(true);
        
        await testNotification('daily_advice', {
          title: "💡 Consejo del Día",
          message: tip.content,
          metadata: {
            advice_category: tip.category || "técnica_musical",
            tip_of_day: true
          },
          priority: 1,
          category: 'training'
        });
      } else {
        // Usar consejo de ejemplo si no hay en la base de datos
        setCurrentContent({
          type: 'advice',
          advice: {
            content: "Practica con dedicación, pero también escucha tu cuerpo y descansa cuando sea necesario.",
            category: "técnica_musical"
          }
        });
        setShowAdviceOverlay(true);
        
        await testNotification('daily_advice', {
          title: "💡 Consejo del Día",
          message: "Practica con dedicación, pero también escucha tu cuerpo y descansa cuando sea necesario.",
          metadata: {
            advice_category: "técnica_musical",
            tip_of_day: true
          },
          priority: 1,
          category: 'training'
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo cargar el consejo: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const testSpecialEvent = async () => {
    setLoading(true);
    try {
      // Obtener evento próximo
      const { data: events, error } = await supabase
        .from('events')
        .select('*')
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (events && events.length > 0) {
        const event = events[0];
        setCurrentContent({
          type: 'event',
          event: event
        });
        setShowEventOverlay(true);
        
        await testNotification('special_event', {
          title: "🎊 Evento Especial",
          message: event.description,
          metadata: {
            event_name: event.title,
            event_date: event.date,
            event_location: event.location
          },
          priority: 3,
          category: 'events'
        });
      } else {
        // Usar evento de ejemplo si no hay en la base de datos
        setCurrentContent({
          type: 'event',
          event: {
            title: "Concierto de Navidad 2025",
            description: "Se acerca nuestro concierto navideño. ¡Prepárense para una noche llena de alabanza!",
            date: "2025-12-20",
            location: "Templo Principal"
          }
        });
        setShowEventOverlay(true);
        
        await testNotification('special_event', {
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
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `No se pudo cargar el evento: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
    }
  ];

  // Componente para overlay de versículo
  const VerseOverlay = ({ verse, onClose }) => {
    if (!verse) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 shadow-2xl border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-blue-900">Versículo del Día</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                >
                  ✕
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="text-center mb-4">
                  <BookOpen className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-gray-900">{verse.verse_reference}</h3>
                </div>
                
                <div className="text-lg text-gray-800 italic text-center mb-6">
                  "{verse.verse_text}"
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  {verse.version || "RVR1960"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Componente para overlay de consejo
  const AdviceOverlay = ({ advice, onClose }) => {
    if (!advice) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
          <Card className="border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 shadow-2xl border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-amber-900">Consejo del Día</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                >
                  ✕
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="text-center mb-4">
                  <Lightbulb className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-gray-900">💡 Para Músicos</h3>
                </div>
                
                <div className="text-lg text-gray-800 text-center mb-6">
                  {advice.content}
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  Categoría: {advice.category || "General"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Componente para overlay de evento
  const EventOverlay = ({ event, onClose }) => {
    if (!event) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md animate-in slide-in-from-bottom-4 fade-in duration-300">
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 shadow-2xl border-2">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-2xl font-bold text-purple-900">Evento Especial</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-purple-600 hover:text-purple-800 hover:bg-purple-100"
                >
                  ✕
                </Button>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="text-center mb-4">
                  <Church className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                  <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
                </div>
                
                <div className="text-lg text-gray-800 text-center mb-4">
                  {event.description}
                </div>
                
                <div className="text-sm text-gray-600 text-center mb-2">
                  📅 {new Date(event.date).toLocaleDateString()}
                </div>
                
                <div className="text-sm text-gray-600 text-center">
                  📍 {event.location || "Templo Principal"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Grid de notificaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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

      {/* Overlays */}
      {showBirthdayOverlay && currentContent?.type === 'birthday' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 via-blue-50 to-blue-50 shadow-2xl border-2">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-blue-900">Tarjeta de Cumpleaños</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBirthdayOverlay(false)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                  >
                    ✕
                  </Button>
                </div>
                
                <BirthdayCard member={currentContent.member} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {showVerseOverlay && currentContent?.type === 'verse' && (
        <VerseOverlay 
          verse={currentContent.verse} 
          onClose={() => setShowVerseOverlay(false)} 
        />
      )}

      {showAdviceOverlay && currentContent?.type === 'advice' && (
        <AdviceOverlay 
          advice={currentContent.advice} 
          onClose={() => setShowAdviceOverlay(false)} 
        />
      )}

      {showEventOverlay && currentContent?.type === 'event' && (
        <EventOverlay 
          event={currentContent.event} 
          onClose={() => setShowEventOverlay(false)} 
        />
      )}

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
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationTestButton;
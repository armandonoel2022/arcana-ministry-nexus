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
    const today = new Date();
    
    // Buscar cumpleaños de hoy primero - usando la tabla 'members' como se requiere
    const { data: members, error } = await supabase
      .from('members')
      .select('*')
      .eq('is_active', true)
      .not('fecha_nacimiento', 'is', null);

    if (error) throw error;

    // Filtrar cumpleaños de hoy
    const todaysBirthdays = members?.filter(member => {
      if (!member.fecha_nacimiento) return false;
      const birthDate = new Date(member.fecha_nacimiento);
      return birthDate.getMonth() === today.getMonth() && 
             birthDate.getDate() === today.getDate();
    }) || [];

    let selectedMember;

    if (todaysBirthdays.length > 0) {
      // Usar cumpleaños de hoy
      selectedMember = todaysBirthdays[0];
    } else {
      // Buscar el próximo cumpleaños
      const upcomingBirthdays = members?.filter(member => {
        if (!member.fecha_nacimiento) return false;
        const birthDate = new Date(member.fecha_nacimiento);
        const thisYear = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        const nextYear = new Date(today.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
        
        return thisYear >= today || nextYear >= today;
      }).sort((a, b) => {
        const aDate = new Date(a.fecha_nacimiento);
        const bDate = new Date(b.fecha_nacimiento);
        const aThisYear = new Date(today.getFullYear(), aDate.getMonth(), aDate.getDate());
        const bThisYear = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
        
        if (aThisYear < today) aThisYear.setFullYear(today.getFullYear() + 1);
        if (bThisYear < today) bThisYear.setFullYear(today.getFullYear() + 1);
        
        return aThisYear.getTime() - bThisYear.getTime();
      });

      selectedMember = upcomingBirthdays?.[0];
    }

    if (!selectedMember) {
      toast({
        title: "No hay cumpleaños",
        description: "No se encontraron cumpleaños próximos",
        variant: "default",
      });
      return;
    }

    // Crear notificación real que será capturada por NotificationOverlay
    await testNotification('birthday_daily', {
      title: `🎉 ¡Feliz Cumpleaños ${selectedMember.nombres}!`,
      message: `¡Hoy está de cumpleaños ${selectedMember.nombres} ${selectedMember.apellidos}! Recuerda ir a la sala de chat general y dedicarle un mensaje de felicitación.`,
      metadata: {
        birthday_member_name: `${selectedMember.nombres} ${selectedMember.apellidos}`,
        birthday_member_photo: selectedMember.photo_url,
        birthday_date: new Date().toISOString().split('T')[0],
        show_confetti: true,
        play_birthday_sound: true,
        is_birthday_person: todaysBirthdays.length > 0
      },
      priority: 3,
      category: 'birthday'
    });

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
    // Obtener la fecha de hoy en formato ISO (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];
    
    // Consulta IDÉNTICA a la de EventosEspeciales.tsx (líneas 41-46)
    const { data: events, error } = await supabase
      .from('services')
      .select('*')
      .gte('service_date', today)
      .ilike('leader', '%TODOS%')
      .order('service_date', { ascending: true })
      .limit(1); // Solo necesitamos el próximo evento

    if (error) {
      console.error('Error fetching eventos:', error);
      throw new Error(`Error al cargar eventos: ${error.message}`);
    }

    // Funciones de formateo IDÉNTICAS a EventosEspeciales.tsx (líneas 83-99)
    const formatDate = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric', 
          month: 'long',
          day: 'numeric'
        });
      } catch (error) {
        console.error('Error formateando fecha:', error, dateString);
        return 'Fecha por definir';
      }
    };

    const formatTime = (dateString: string) => {
      try {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.error('Error formateando hora:', error, dateString);
        return 'Hora por definir';
      }
    };

    if (events && events.length > 0) {
      const event = events[0];
      console.log('Evento obtenido:', event); // Debug
      
      const formattedDate = `${formatDate(event.service_date)} • ${formatTime(event.service_date)}`;
      
      // Crear mensaje formateado
      const message = `🎉 Próximo Evento Especial:\n\n📅 ${event.title}\n🗓️ ${formattedDate}\n📍 ${event.location || 'Templo Principal'}\n👥 Participación: ${event.leader}\n🎯 ${event.special_activity || 'Actividad especial'}`;

      setCurrentContent({
        type: 'event',
        event: event,
        formattedDate: formattedDate
      });
      setShowEventOverlay(true);
      
      await testNotification('special_event', {
        title: `🎊 ${event.title}`,
        message: message,
        metadata: {
          event_name: event.title,
          event_date: event.service_date,
          event_location: event.location || 'Templo Principal',
          event_participation: event.leader,
          special_activity: event.special_activity || 'Actividad especial'
        },
        priority: 3,
        category: 'events'
      });
    } else {
      // Si no hay eventos próximos, usar datos de ejemplo
      const exampleDate = new Date();
      exampleDate.setDate(exampleDate.getDate() + 7); // 7 días en el futuro
      
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
          weekday: 'long',
          year: 'numeric', 
          month: 'long',
          day: 'numeric'
        });
      };

      const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        });
      };

      const formattedDate = `${formatDate(exampleDate)} • ${formatTime(exampleDate)}`;
      
      const exampleEvent = {
        title: "Concierto de Navidad 2025",
        service_date: exampleDate.toISOString(),
        location: "Templo Principal",
        leader: "TODOS los integrantes",
        special_activity: "Presentación especial del coro navideño",
        description: "Se acerca nuestro concierto navideño. ¡Prepárense para una noche llena de alabanza!"
      };

      const message = `🎉 Próximo Evento Especial:\n\n📅 ${exampleEvent.title}\n🗓️ ${formattedDate}\n📍 ${exampleEvent.location}\n👥 Participación: ${exampleEvent.leader}\n🎯 ${exampleEvent.special_activity}`;

      setCurrentContent({
        type: 'event',
        event: exampleEvent,
        formattedDate: formattedDate
      });
      setShowEventOverlay(true);
      
      await testNotification('special_event', {
        title: `🎊 ${exampleEvent.title}`,
        message: message,
        metadata: {
          event_name: exampleEvent.title,
          event_date: exampleEvent.service_date,
          event_location: exampleEvent.location,
          event_participation: exampleEvent.leader,
          special_activity: exampleEvent.special_activity
        },
        priority: 3,
        category: 'events'
      });

      toast({
        title: "Evento de ejemplo",
        description: "No hay eventos reales próximos, mostrando ejemplo",
        variant: "default",
      });
    }
  } catch (error: any) {
    console.error('Error en testSpecialEvent:', error);
    toast({
      title: "Error",
      description: error.message || "No se pudo cargar los eventos especiales",
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
  // Componente para overlay de evento
const EventOverlay = ({ event, onClose }) => {
  if (!event) return null;
  
  // Funciones de formateo consistentes con EventosEspeciales.tsx
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric', 
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, dateString);
      return 'Fecha por definir';
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formateando hora:', error, dateString);
      return 'Hora por definir';
    }
  };

  const formattedDate = event.service_date ? formatDate(event.service_date) : 'Fecha por definir';
  const formattedTime = event.service_date ? formatTime(event.service_date) : 'Hora por definir';
  
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
                <h3 className="text-xl font-bold text-gray-900">{event.title || 'Evento Especial'}</h3>
              </div>
              
              {/* Actividad Especial */}
              {event.special_activity && (
                <div className="text-lg text-gray-800 text-center mb-4">
                  🎯 {event.special_activity}
                </div>
              )}
              
              {/* Fecha y Hora */}
              <div className="text-sm text-gray-600 text-center mb-2">
                📅 {formattedDate}
              </div>
              
              <div className="text-sm text-gray-600 text-center mb-2">
                🕒 {formattedTime}
              </div>
              
              {/* Ubicación */}
              {event.location && (
                <div className="text-sm text-gray-600 text-center mb-2">
                  📍 {event.location}
                </div>
              )}
              
              {/* Participación */}
              {event.leader && (
                <div className="text-sm text-gray-600 text-center mb-4">
                  👥 Participación: {event.leader}
                </div>
              )}
              
              {/* Notas adicionales */}
              {event.notes && (
                <div className="bg-blue-50 p-3 rounded-lg mt-4">
                  <h4 className="font-semibold text-blue-700 mb-1">📝 Notas:</h4>
                  <p className="text-sm text-blue-600">{event.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default NotificationTestButton;
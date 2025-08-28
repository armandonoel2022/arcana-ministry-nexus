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
    // Buscar datos reales de cumpleaños de la tabla members  
    const { data: members, error } = await supabase  
      .from('members')  
      .select('*')  
      .eq('is_active', true)  
      .not('fecha_nacimiento', 'is', null)  
      .limit(1);  
  
    if (error) throw error;  
  
    if (members && members.length > 0) {  
      const member = members[0];  
        
      // Replicar exactamente la función generateBirthdayCard del BirthdayModule  
      setCurrentContent({  
        type: 'birthday',  
        member: {  
          id: member.id,  
          nombres: member.nombres,  
          apellidos: member.apellidos,  
          photo_url: member.photo_url,  
          cargo: member.cargo  
        }  
      });  
      setShowBirthdayOverlay(true);  
        
      // NO enviar notificación - solo generar la tarjeta como en el módulo original  
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
    // Usar la misma lógica que DailyVerse.tsx para obtener el versículo  
    const today = new Date().toISOString().split('T')[0];  
      
    const { data: dailyVerse, error } = await supabase  
      .from('daily_verses')  
      .select(`  
        *,  
        bible_verses (  
          book,  
          chapter,  
          verse,  
          text,  
          version  
        )  
      `)  
      .eq('date', today)  
      .single();  
  
    if (error && error.code !== 'PGRST116') {  
      throw error;  
    }  
  
    let verseData = dailyVerse;  
      
    if (!verseData) {  
      // Si no hay versículo para hoy, crear uno aleatorio como en DailyVerse.tsx  
      const { data: verses, error: versesError } = await supabase  
        .from('bible_verses')  
        .select('*');  
  
      if (versesError) throw versesError;  
  
      if (verses && verses.length > 0) {  
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];  
          
        const { data: newDailyVerse, error: createError } = await supabase  
          .from('daily_verses')  
          .insert({  
            verse_id: randomVerse.id,  
            date: today,  
            reflection: "Que este versículo te inspire y fortalezca tu fe hoy."  
          })  
          .select(`  
            *,  
            bible_verses (  
              book,  
              chapter,  
              verse,  
              text,  
              version  
            )  
          `)  
          .single();  
  
        if (createError) throw createError;  
        verseData = newDailyVerse;  
      }  
    }  
  
    if (verseData && verseData.bible_verses) {  
      // Mostrar overlay como en el módulo espiritual - NO enviar notificación  
      setCurrentContent({  
        type: 'verse',  
        verse: {  
          verse_text: verseData.bible_verses.text,  
          verse_reference: `${verseData.bible_verses.book} ${verseData.bible_verses.chapter}:${verseData.bible_verses.verse}`,  
          version: verseData.bible_verses.version,  
          reflection: verseData.reflection  
        }  
      });  
      setShowVerseOverlay(true);  
    } else {  
      toast({  
        title: "Error",  
        description: "No se pudo cargar el versículo del día",  
        variant: "destructive",  
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
      // Arrays de consejos del módulo de Recomendaciones  
      const voiceTips = [  
        {  
          id: "voice-1",  
          title: "Ejercicio de Respiración Diafragmática",  
          description: "Acuéstate boca arriba, coloca un libro sobre tu abdomen y respira profundamente, haciendo que el libro suba y baje. Repite 10 veces.",  
          why: "Fortalece el control del aire para notas sostenidas."  
        },  
        {  
          id: "voice-2",  
          title: "Vocalización en Escalas",  
          description: "Canta 'Do-Re-Mi-Fa-Sol-Fa-Mi-Re-Do' en 3 tonalidades diferentes (empezando en C, D, E).",  
          why: "Mejora tu rango y afinación."  
        },  
        {  
          id: "voice-3",  
          title: "Hidratación Profunda",  
          description: "Té de jengibre con miel 30 minutos antes de cantar. Evita lácteos y café.",  
          why: "Reduce la irritación de cuerdas vocales."  
        },  
        {  
          id: "voice-4",  
          title: "Ejercicio de Resonancia Nasal",  
          description: "Canta 'Mmmmm' en una nota media, sintiendo la vibración en la nariz. Mantén 10 segundos, repite 5 veces.",  
          why: "Mejora el tono brillante y la proyección."  
        },  
        {  
          id: "voice-5",  
          title: "Deslizamiento de Voz",  
          description: "Desliza tu voz de la nota más grave a la más aguda que puedas (como un sirena), luego vuelve. 3 repeticiones.",  
          why: "Flexibiliza las cuerdas vocales."  
        }  
      ];  
    
      const musicTips = [  
        {  
          id: "music-1",  
          instrument: "guitarra",  
          title: "Ejercicio de Cambios de Acordes",  
          description: "Practica transiciones entre G, C, D y Em a 60 BPM durante 10 minutos.",  
          why: "Mejora fluidez en alabanza contemporánea."  
        },  
        {  
          id: "music-2",  
          instrument: "batería",  
          title: "Ritmo 6/8 con Metrónomo",  
          description: "Toca un patrón básico de 6/8 a 80 BPM, enfocándote en el hi-hat.",  
          why: "Esencial para himnos y baladas."  
        },  
        {  
          id: "music-3",  
          instrument: "bajo",  
          title: "Walking Bass en C",  
          description: "Crea una línea de bajo caminando entre C, E, G y A.",  
          why: "Fortalece creatividad en interludios."  
        },  
        {  
          id: "music-4",  
          instrument: "teclado",  
          title: "Acordes con Inversiones",  
          description: "Practica C (Do), G/B (Sol/Si), Am (La menor) en secuencia, usando inversiones. 5 minutos.",  
          why: "Suaviza transiciones en alabanza."  
        }  
      ];  
    
      const danceTips = [  
        {  
          id: "dance-1",  
          style: "alabanza",  
          title: "Flujo con Pañuelos",  
          description: "Practica movimientos circulares con pañuelos en ambas manos al ritmo de 4/4.",  
          why: "Añade expresión visual a la adoración."  
        },  
        {  
          id: "dance-2",  
          style: "intercesión",  
          title: "Posturas de Quebrantamiento",  
          description: "Combina arrodillarse, levantar manos y giros lentos en secuencia.",  
          why: "Profundiza en la conexión espiritual."  
        },  
        {  
          id: "dance-3",  
          style: "festiva",  
          title: "Saltos con Palmas Sincronizadas",  
          description: "Salta en X mientras palmeas arriba y abajo (8 repeticiones).",  
          why: "Energiza alabanza jubilosa."  
        }  
      ];  
    
      // Combinar todos los consejos en un solo array  
      const allTips = [  
        ...voiceTips.map(tip => ({ ...tip, type: 'voice', category: 'Técnica Vocal' })),  
        ...musicTips.map(tip => ({ ...tip, type: 'music', category: tip.instrument || 'Música' })),  
        ...danceTips.map(tip => ({ ...tip, type: 'dance', category: tip.style || 'Danza' }))  
      ];  
        
      // Seleccionar uno aleatorio  
      const randomTip = allTips[Math.floor(Math.random() * allTips.length)];  
    
      // Crear mensaje formateado  
      const message = `💡 Consejo del Día para ${randomTip.category}:\n\n📝 ${randomTip.title}\n🎯 ${randomTip.description}\n✨ Objetivo: ${randomTip.why}`;  
    
      setCurrentContent({  
        type: 'advice',  
        advice: {  
          title: randomTip.title,  
          content: randomTip.description,  
          category: randomTip.category,  
          why: randomTip.why  
        }  
      });  
      setShowAdviceOverlay(true);  
        
      await testNotification('daily_advice', {  
        title: "💡 Consejo del Día",  
        message: message,  
        metadata: {  
          advice_category: randomTip.category,  
          tip_type: randomTip.type,  
          tip_of_day: true  
        },  
        priority: 1,  
        category: 'training'  
      });  
    
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
                  <h3 className="text-xl font-bold text-gray-900">{advice.title}</h3>  
                </div>  
                  
                <div className="space-y-4">  
                  <div className="text-lg text-gray-800 text-center">  
                    {advice.content}  
                  </div>  
                    
                  {advice.why && (  
                    <div className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-400">  
                      <h4 className="font-semibold text-amber-700 mb-1">✨ Objetivo:</h4>  
                      <p className="text-sm text-amber-600">{advice.why}</p>  
                    </div>  
                  )}  
                    
                  <div className="text-sm text-gray-600 text-center">  
                    Categoría: {advice.category || "General"}  
                  </div>  
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

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Panel de Prueba de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifications.map((notification, index) => (
              <Card key={index} className={`bg-gradient-to-r ${notification.color} text-white`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    {notification.icon}
                    <h3 className="text-xl font-bold">{notification.title}</h3>
                  </div>
                  <p className="mb-4 opacity-90">{notification.description}</p>
                  <Button
                    onClick={notification.action}
                    disabled={loading}
                    variant="secondary"
                    className="w-full"
                  >
                    {loading ? "Enviando..." : "Probar Notificación"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overlays para mostrar contenido específico */}
      {showBirthdayOverlay && currentContent?.type === 'birthday' && (  
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">  
          <div className="max-w-4xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 fade-in duration-300">  
            <div className="relative">  
              <Button  
                variant="ghost"  
                size="sm"  
                onClick={() => setShowBirthdayOverlay(false)}  
                className="absolute top-4 right-4 z-10 bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800"  
              >  
                ✕  
              </Button>  
              <BirthdayCard   
                member={currentContent.member}  
                onDownload={() => setShowBirthdayOverlay(false)}  
              />  
            </div>  
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
    </div>
  );
};

export default NotificationTestButton;
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Calendar, Download, Gift, BookOpen, MessageSquare, Church, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { supabase } from "@/integrations/supabase/client";
import confetti from 'canvas-confetti';

const NotificationTesting = () => {
  const [showServiceOverlay, setShowServiceOverlay] = useState(false);
  const [showBirthdayOverlay, setShowBirthdayOverlay] = useState(false);
  const [loading, setLoading] = useState(false);
  const cardRef1 = useRef(null);
  const cardRef2 = useRef(null);
  const birthdayCardRef = useRef(null);
  const { toast } = useToast();

  // Datos de ejemplo para el miembro de cumpleaños
  const birthdayMember = {
    id: '1',
    nombres: 'Armando',
    apellidos: 'Noel',
    photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/d6602109-ad3e-4db6-ab4a-2984dadfc569.JPG',
    cargo: 'director_alabanza'
  };

  const mockServiceData = [
    // ... (todo el contenido de mockServiceData que ya tienes)
    // Se mantiene igual que en tu código anterior
  ];

  // Función para reproducir sonido de cumpleaños
  const playBirthdaySound = () => {
    try {
      // Crear un audio con una melodía de cumpleaños simple usando Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Melodía de "Happy Birthday" simplificada
      const notes = [
        { freq: 261.63, duration: 0.3 }, // C
        { freq: 261.63, duration: 0.2 }, // C
        { freq: 293.66, duration: 0.4 }, // D
        { freq: 261.63, duration: 0.4 }, // C
        { freq: 349.23, duration: 0.4 }, // F
        { freq: 329.63, duration: 0.8 }, // E
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

  // Función para obtener etiqueta del rol
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

  // Función para descargar tarjeta de cumpleaños
  const downloadBirthdayCard = async () => {
    if (!birthdayCardRef.current) return;

    try {
      setShowBirthdayOverlay(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(birthdayCardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#f8fafc',
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `cumpleanos-${birthdayMember.nombres.toLowerCase()}-${birthdayMember.apellidos.toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "¡Descarga exitosa!",
        description: "La tarjeta de cumpleaños se ha descargado correctamente",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  // Función para probar notificación de cumpleaños
  const testBirthday = async () => {
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
          type: 'birthday',
          recipient_id: user.id,
          title: "🎉 ¡Feliz Cumpleaños! 🎂",
          message: "¡Hoy está de cumpleaños un integrante del ministerio!",
          metadata: {
            birthday_member_name: "Armando Noel",
            birthday_member_photo: birthdayMember.photo_url,
            birthday_date: new Date().toISOString(),
            is_birthday_person: false
          },
          priority: 3,
          notification_category: 'birthday'
        });

      if (error) throw error;

      // Mostrar confeti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      // Reproducir sonido de cumpleaños
      playBirthdaySound();

      // Mostrar overlay de cumpleaños
      setShowBirthdayOverlay(true);

      toast({
        title: "¡Notificación enviada!",
        description: "La notificación de cumpleaños se ha enviado correctamente.",
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

  // Componente de tarjeta de cumpleaños
  const BirthdayCard = () => {
    return (
      <div 
        ref={birthdayCardRef}
        className="mx-auto bg-gradient-to-br from-blue-50 via-white to-blue-100 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
        style={{ 
          width: '600px', 
          height: '900px',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          minHeight: '900px',
          maxWidth: '600px'
        }}
      >
        {/* Encabezado con logo */}
        <div className="text-center mb-8">
          <img 
            src="/lovable-uploads/74634c97-a2ef-403b-9fa0-89d9207b7b00.png" 
            alt="ADN Ministerio Logo" 
            className="w-24 h-auto mx-auto mb-3"
            style={{ 
              maxWidth: '96px',
              height: 'auto'
            }}
          />
          <div 
            className="text-xl font-bold text-blue-600" 
            style={{ 
              fontWeight: '700',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            Ministerio ADN
          </div>
          <div 
            className="text-base text-blue-500" 
            style={{ 
              fontWeight: '500',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            Arca de Noé
          </div>
        </div>

        {/* Foto del integrante */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-pink-500 to-red-500 rounded-full blur-sm opacity-60"></div>
            <Avatar className="relative w-48 h-48 border-6 border-white shadow-xl">
              <AvatarImage
                src={birthdayMember.photo_url || undefined}
                alt={`${birthdayMember.nombres} ${birthdayMember.apellidos}`}
                className="object-cover"
                style={{
                  objectFit: 'cover'
                }}
              />
              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-4xl font-bold">
                {birthdayMember.nombres.charAt(0)}{birthdayMember.apellidos.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Mensaje principal */}
        <div className="text-center space-y-6">
          <div 
            className="text-4xl font-bold text-orange-500"
            style={{ 
              fontWeight: '900', 
              lineHeight: '1.1',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
              color: '#f97316'
            }}
          >
            ¡Feliz Cumpleaños!
          </div>
          
          <div 
            className="text-3xl font-bold text-blue-600"
            style={{ 
              fontWeight: '700',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            {birthdayMember.nombres} {birthdayMember.apellidos}
          </div>
          
          <div 
            className="text-xl text-blue-500 font-medium"
            style={{ 
              fontWeight: '600',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
          >
            {getRoleLabel(birthdayMember.cargo)}
          </div>

          {/* Pastel decorativo */}
          <div className="text-6xl mb-6" style={{ fontSize: '4rem', lineHeight: '1' }}>🎂</div>

          {/* Mensaje de felicitación */}
          <div className="bg-white/90 p-6 rounded-2xl shadow-lg mx-auto border border-gray-100" style={{ maxWidth: '480px' }}>
            <p 
              className="text-lg leading-relaxed text-gray-700 font-medium"
              style={{ 
                fontWeight: '500', 
                lineHeight: '1.4',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
              }}
            >
              Gracias por tu entrega y pasión en el ministerio ADN Arca de Noé.
            </p>
            <p 
              className="text-2xl font-bold text-blue-600 mt-4"
              style={{ 
                fontWeight: '700',
                fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
              }}
            >
              ¡Que Dios te bendiga!
            </p>
          </div>

          {/* Decoración inferior */}
          <div 
            className="flex justify-center items-center space-x-3 text-3xl mt-8"
            style={{ fontSize: '2.5rem' }}
          >
            <span>🎉</span>
            <span>🎈</span>
            <span>🎁</span>
            <span>🎊</span>
          </div>
        </div>
      </div>
    );
  };

  // Componente NotificationTestButton integrado
  const NotificationTestButton = () => {
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
        action: () => console.log("Test verse")
      },
      {
        icon: <Lightbulb className="w-8 h-8" />,
        title: "Consejo del Día",
        description: "Consejo diario para músicos y ministerio",
        color: "from-yellow-500 to-orange-500",
        action: () => console.log("Test advice")
      },
      {
        icon: <Church className="w-8 h-8" />,
        title: "Evento Especial",
        description: "Notificación de eventos especiales del ministerio",
        color: "from-purple-500 to-pink-500",
        action: () => console.log("Test event")
      },
      {
        icon: <Calendar className="w-8 h-8" />,
        title: "Programa de Servicios",
        description: "Programa detallado del fin de semana con fotos",
        color: "from-green-500 to-blue-500",
        action: () => setShowServiceOverlay(true)
      }
    ];

    return (
      <div className="space-y-6">
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
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Bell className="w-8 h-8 text-arcana-blue-600" />
          Pruebas de Notificaciones
        </h1>
        <p className="text-gray-600">
          Prueba diferentes tipos de notificaciones superpuestas del sistema ARCANA
        </p>
      </div>

      {/* Botón específico para mostrar el Service Overlay */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Calendar className="w-5 h-5" />
            Vista Previa del Overlay de Servicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-blue-700 mb-4">
            Este botón te mostrará directamente el overlay de servicios con datos de prueba reales, 
            incluyendo las fotos de los directores y responsables de voces.
          </p>
          <Button
            onClick={() => setShowServiceOverlay(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Mostrar Overlay de Servicios
          </Button>
        </CardContent>
      </Card>

      <NotificationTestButton />

      {/* Overlay de cumpleaños */}
      {showBirthdayOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto">
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
                
                <BirthdayCard />
                
                <div className="flex justify-center mt-6 space-x-4">
                  <Button 
                    onClick={downloadBirthdayCard}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    <Download className="w-4 h-4" />
                    Descargar Tarjeta
                  </Button>
                  <Button
                    onClick={() => setShowBirthdayOverlay(false)}
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    Cerrar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Overlay de servicios (se mantiene igual) */}
      {showServiceOverlay && (
        // ... (código del overlay de servicios que ya tienes)
      )}
    </div>
  );
};

export default NotificationTesting;
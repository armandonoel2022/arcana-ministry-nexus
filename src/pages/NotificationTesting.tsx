import React, { useState, useRef, useEffect } from 'react';
import { Bell, Calendar, Download, MapPin, Clock, Users, BookOpen, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotificationTestButton from '@/components/notifications/NotificationTestButton';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import arcaNoeLogo from '@/assets/arca-noe-logo.png';
import ServiceNotificationOverlay from '@/components/notifications/ServiceNotificationOverlay';
import { DailyVerseOverlay } from '@/components/notifications/DailyVerseOverlay';
import { DailyAdviceOverlay } from '@/components/notifications/DailyAdviceOverlay';

// Definir interfaces para el evento de retiro
interface RetiroEvent {
  id: string;
  title: string;
  description: string;
  service_date: string;
  leader: string;
  location: string;
  special_activity: string;
  service_type: string;
}

const NotificationTesting = () => {
  const [showServiceOverlay, setShowServiceOverlay] = useState(false);
  const [showRetiroOverlay, setShowRetiroOverlay] = useState(false);
  const [showVerseOverlay, setShowVerseOverlay] = useState(false);
  const [showAdviceOverlay, setShowAdviceOverlay] = useState(false);
  const [retiroEvent, setRetiroEvent] = useState<RetiroEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const retiroRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch del próximo retiro desde la base de datos
  const fetchRetiroEvent = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .or('service_type.eq.especial,description.ilike.%retiro%,special_activity.ilike.%retiro%')
        .gte('service_date', new Date().toISOString())
        .order('service_date', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const service = data[0];
        setRetiroEvent({
          id: service.id,
          title: service.title,
          description: service.description || 'Retiro Congregacional',
          service_date: service.service_date,
          leader: service.leader || 'Designados por el pastor Roosevelt',
          location: service.location || 'Templo Principal',
          special_activity: service.special_activity || 'Santa Comunión',
          service_type: service.service_type
        });
      }
    } catch (error) {
      console.error('Error fetching retiro event:', error);
      // Fallback a los datos del 5 de octubre que ya sabemos que existen
      setRetiroEvent({
        id: '2932b9e4-e409-4f81-8d6e-065828a0ef85',
        title: '09:00 a.m.',
        description: 'Retiro Congregacional',
        service_date: '2025-10-05T00:00:00+00:00',
        leader: 'Designados por el pastor Roosevelt Martínez',
        location: 'Templo Principal',
        special_activity: 'Santa Comunión',
        service_type: 'especial'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetiroEvent();
  }, []);

  const RetiroFlyerOverlay = React.forwardRef<HTMLDivElement>((props, ref) => {
    if (!retiroEvent) return null;

    const formatDate = (dateString: string) => {
      const formatted = new Date(dateString).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC', // Evita desfases al convertir desde UTC
      });
      // Capitalizar el mes
      return formatted.replace(/ de ([a-záéíóúñ]+)/, (_m, p1) => ` de ${p1.charAt(0).toUpperCase()}${p1.slice(1)}`);
    };

    const getEventTime = (title: string) => {
      const match = title.match(/(\d{1,2}:\d{2})/);
      return match ? match[1] : '09:00';
    };

    return (
      <div 
        ref={ref}
        className="mx-auto relative overflow-hidden border border-gray-100"
        style={{ 
          width: '400px', 
          height: '980px',
          backgroundColor: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          borderRadius: '16px'
        }}
      >
        {/* Background Pattern - Simplified */}
        <div 
          className="absolute top-10 left-10 rounded-full"
          style={{ 
            width: '80px', 
            height: '80px', 
            backgroundColor: 'rgba(147, 197, 253, 0.2)' 
          }}
        ></div>
        <div 
          className="absolute top-32 right-8 rounded-full"
          style={{ 
            width: '48px', 
            height: '48px', 
            backgroundColor: 'rgba(196, 181, 253, 0.2)' 
          }}
        ></div>
        <div 
          className="absolute bottom-20 left-8 rounded-full"
          style={{ 
            width: '64px', 
            height: '64px', 
            backgroundColor: 'rgba(129, 140, 248, 0.2)' 
          }}
        ></div>

        <div className="relative z-10 p-8 text-center" style={{ height: '100%' }}>
          {/* Header */}
          <div className="mb-6">
            <img 
              src={arcaNoeLogo} 
              alt="Logo ADN" 
              className="mx-auto mb-3 opacity-90"
              style={{ width: '64px', height: '64px' }}
            />
            <h1 className="text-lg font-bold text-blue-700 tracking-wide mb-1">
              MINISTERIO ADN
            </h1>
            <p className="text-blue-600 font-medium">Arca de Noé</p>
          </div>

          {/* Event Icon */}
          <div 
            className="mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg"
            style={{ 
              width: '128px', 
              height: '128px',
              backgroundColor: '#fb923c',
              backgroundImage: 'linear-gradient(135deg, #fb923c 0%, #ef4444 100%)'
            }}
          >
            <span style={{ fontSize: '48px', lineHeight: '1' }}>⛪</span>
          </div>

          {/* Main Title - Simplified with solid background */}
          <div className="mb-6">
            <div 
              className="mx-auto rounded-lg py-3 px-4 mb-4 shadow-lg"
              style={{ 
                backgroundColor: '#ef4444',
                backgroundImage: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
                maxWidth: '350px'
              }}
            >
              <h2 className="text-2xl font-bold text-white" style={{ margin: 0, padding: 0 }}>
                ¡{retiroEvent.description}!
              </h2>
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {formatDate(retiroEvent.service_date)}
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-3 mb-6">
            <div 
              className="rounded-lg p-3 shadow-sm border mx-auto"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', maxWidth: '300px' }}
            >
              <div className="flex items-center justify-center gap-2 text-blue-800">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">{getEventTime(retiroEvent.title)} a.m.</span>
              </div>
            </div>
            
            <div 
              className="rounded-lg p-3 shadow-sm border mx-auto"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', maxWidth: '300px' }}
            >
              <div className="flex items-center justify-center gap-2 text-blue-800">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">{retiroEvent.location}</span>
              </div>
            </div>
            
            <div 
              className="rounded-lg p-3 shadow-sm border mx-auto"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', maxWidth: '320px' }}
            >
              <div className="flex items-center justify-center gap-2 text-blue-800 text-center">
                <Users className="w-5 h-5 flex-shrink-0" />
                <span className="font-semibold text-sm leading-tight">{retiroEvent.leader}</span>
              </div>
            </div>
          </div>

          {/* Santa Comunión */}
          <div 
            className="rounded-lg p-3 mb-4 border mx-auto"
            style={{ 
              backgroundColor: 'rgba(147, 51, 234, 0.1)',
              borderColor: 'rgba(147, 51, 234, 0.2)',
              maxWidth: '320px'
            }}
          >
            <div className="text-purple-700 font-semibold text-sm mb-1">Actividad Especial</div>
            <div className="text-purple-800 font-bold flex items-center justify-center gap-2">
              <span>✝️</span>
              <span>Santa Comunión</span>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="flex justify-center space-x-4 mb-3">
            <span style={{ fontSize: '20px' }}>🙏</span>
            <span style={{ fontSize: '20px' }}>✝️</span>
            <span style={{ fontSize: '20px' }}>❤️</span>
          </div>

          {/* Call to Action */}
          <div 
            className="text-white rounded-lg p-3 mb-3 mx-auto"
            style={{ 
              backgroundColor: '#2563eb',
              backgroundImage: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
              maxWidth: '320px'
            }}
          >
            <p className="font-bold text-sm" style={{ margin: 0 }}>
              Ven y adoremos juntos a nuestro Dios
            </p>
          </div>

          {/* Ensayo General */}
          <div 
            className="rounded-lg p-3 mb-3 border mx-auto"
            style={{ 
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              borderColor: 'rgba(220, 38, 38, 0.2)',
              maxWidth: '340px'
            }}
          >
            <div className="text-red-700 font-bold text-xs text-center leading-tight">
              ENSAYO GENERAL EL VIERNES 03 DE OCTUBRE<br />
              A LAS 07:00 P.M. NO FALTES
            </div>
          </div>

          {/* Blessing */}
          <div className="text-blue-700 font-bold text-base mb-3">
            ¡Que Dios te bendiga! 🙌
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-gray-200 mt-auto">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
              <img 
                src={arcaNoeLogo} 
                alt="Logo" 
                className="opacity-70"
                style={{ width: '16px', height: '16px' }}
              />
              <span>Sistema ARCANA • Arca de Noé</span>
            </div>
          </div>
        </div>
      </div>
    );
  });

  RetiroFlyerOverlay.displayName = 'RetiroFlyerOverlay';

  const waitForImages = async (container: HTMLElement) => {
    const images = Array.from(container.querySelectorAll('img')) as HTMLImageElement[];
    try {
      await Promise.all(
        images.map((img) => (img.complete ? Promise.resolve() : (img.decode ? img.decode() : Promise.resolve())))
      );
    } catch {
      // ignore decode errors
    }
  };

  const downloadRetiroCard = async () => {
    if (!retiroRef.current) return;

    try {
      setShowRetiroOverlay(true);
      // Esperar más tiempo para que todos los elementos se rendericen
      await new Promise(resolve => setTimeout(resolve, 700));
      await waitForImages(retiroRef.current);

      const target = retiroRef.current as HTMLElement;

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: target.offsetWidth,
        height: target.offsetHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
        foreignObjectRendering: false,
        imageTimeout: 15000,
      });

      const eventDate = retiroEvent ? new Date(retiroEvent.service_date).toISOString().split('T')[0] : '2025-10-05';
      const link = document.createElement('a');
      link.download = `retiro-congregacional-${eventDate}-flyer.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "¡Descarga exitosa!",
        description: "El flyer del Retiro Congregacional se ha descargado correctamente",
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

      {/* Panel de Prueba de Notificaciones */}
      <Card className="border-2 border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Panel de Prueba de Notificaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Cumpleaños */}
            <Card className="bg-gradient-to-br from-pink-100 to-purple-100 border-pink-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  🎁 Cumpleaños
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  Notificación de cumpleaños con confeti y sonido
                </p>
                <NotificationTestButton />
              </CardContent>
            </Card>

            {/* Versículo del Día */}
            <Card className="bg-gradient-to-br from-blue-100 to-purple-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Versículo del Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  Versículo bíblico diario con reflexión
                </p>
                <Button
                  onClick={() => setShowVerseOverlay(true)}
                  variant="outline"
                  className="w-full"
                >
                  Probar Notificación
                </Button>
              </CardContent>
            </Card>

            {/* Consejo del Día */}
            <Card className="bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lightbulb className="w-5 h-5" />
                  Consejo del Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  Consejo o tip diario del sistema
                </p>
                <Button
                  onClick={() => setShowAdviceOverlay(true)}
                  variant="outline"
                  className="w-full"
                >
                  Probar Notificación
                </Button>
              </CardContent>
            </Card>

            {/* Overlay de Servicios */}
            <Card className="bg-gradient-to-br from-blue-100 to-indigo-100 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Programa de Servicios
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 mb-3">
                  Overlay completo con servicios del fin de semana
                </p>
                <Button
                  onClick={() => setShowServiceOverlay(true)}
                  variant="outline"
                  className="w-full"
                >
                  Probar Notificación
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Nuevo Card para el Retiro Congregacional */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Calendar className="w-5 h-5" />
            Retiro Congregacional - 5 de Octubre
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
            {retiroEvent ? 
              `Flyer dinámico para el ${retiroEvent.description} del ${new Date(retiroEvent.service_date).toLocaleDateString('es-ES')}. Datos obtenidos en tiempo real de la agenda ministerial.` :
              "Cargando información del próximo retiro desde la agenda ministerial..."
            }
          </p>
          <Button
            onClick={() => !loading && setShowRetiroOverlay(true)}
            disabled={loading || !retiroEvent}
            className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {loading ? "Cargando..." : "Mostrar Flyer del Retiro"}
          </Button>
        </CardContent>
      </Card>

      {/* Service Notification Overlay */}
      {showServiceOverlay && (
        <ServiceNotificationOverlay 
          forceShow={true}
          onClose={() => setShowServiceOverlay(false)}
        />
      )}

      {/* Daily Verse Overlay */}
      {showVerseOverlay && (
        <DailyVerseOverlay
          verseText="Confía en el Señor de todo corazón, y no en tu propia inteligencia. Reconócelo en todos tus caminos, y él allanará tus sendas."
          verseReference="Proverbios 3:5-6"
          onClose={() => setShowVerseOverlay(false)}
        />
      )}

      {/* Daily Advice Overlay */}
      {showAdviceOverlay && (
        <DailyAdviceOverlay
          title="Prepárate con tiempo"
          message="Recuerda revisar el repertorio de canciones para el servicio del próximo domingo. La preparación anticipada mejora la calidad de la alabanza."
          onClose={() => setShowAdviceOverlay(false)}
        />
      )}

      {/* Retiro Flyer Overlay */}
      {showRetiroOverlay && retiroEvent && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[95vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
                <img 
                  src={arcaNoeLogo} 
                  alt="Logo Arca de Noé" 
                  className="w-6 h-6 object-contain"
                />
                Flyer del Retiro
              </h2>
              <Button
                onClick={() => setShowRetiroOverlay(false)}
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-800 h-8 w-8 p-0"
              >
                ✕
              </Button>
            </div>

            <div className="flex justify-center mb-4">
              <div data-flyer-container="true">
                <RetiroFlyerOverlay ref={retiroRef} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                onClick={downloadRetiroCard}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar Flyer
              </Button>
              <Button
                onClick={() => fetchRetiroEvent()}
                variant="outline"
                className="border-green-300 text-green-700 hover:bg-green-50"
              >
                🔄 Actualizar Datos
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTesting;
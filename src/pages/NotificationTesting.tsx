import React, { useState, useRef } from 'react';
import { Bell, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotificationTestButton from '@/components/notifications/NotificationTestButton';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';

const NotificationTesting = () => {
  const [showServiceOverlay, setShowServiceOverlay] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const cardRef1 = useRef(null);
  const cardRef2 = useRef(null);
  const { toast } = useToast();

  const mockServiceData = [
    {
      id: '1',
      service_date: '2025-08-31',
      title: 'Primer Servicio - 8:00 AM',
      leader: 'Armando Noel',
      service_type: 'regular',
      location: 'Templo Principal',
      special_activity: 'Servicio Dominical',
      worship_groups: {
        id: '1',
        name: 'Grupo de Aleida',
        color_theme: '#3B82F6'
      },
      group_members: [
        {
          id: 'director-1',
          user_id: 'director',
          instrument: 'Director',
          is_leader: true,
          profiles: {
            id: 'director',
            full_name: 'Armando Noel',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/d6602109-ad3e-4db6-ab4a-2984dadfc569.JPG'
          }
        },
        {
          id: 'voice-1',
          user_id: 'voice-1',
          instrument: 'Soprano - Micrófono #1',
          is_leader: false,
          profiles: {
            id: 'voice-1',
            full_name: 'Aleida Geomar Batista',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/00a916a8-ab94-4cc0-81ae-668dd6071416.JPG'
          }
        },
        {
          id: 'voice-2',
          user_id: 'voice-2',
          instrument: 'Soprano - Micrófono #2',
          is_leader: false,
          profiles: {
            id: 'voice-2',
            full_name: 'Eliabi Joana Sierra',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c4089748-7168-4472-8e7c-bf44b4355906.JPG'
          }
        },
        {
          id: 'voice-3',
          user_id: 'voice-3',
          instrument: 'Tenor - Micrófono #3',
          is_leader: false,
          profiles: {
            id: 'voice-3',
            full_name: 'Fredderid Abrahan Valera Montoya',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/7a1645d8-75fe-498c-a2e9-f1057ff3521f.JPG'
          }
        },
        {
          id: 'voice-4',
          user_id: 'voice-4',
          instrument: 'Contralto - Micrófono #4',
          is_leader: false,
          profiles: {
            id: 'voice-4',
            full_name: 'Fior Daliza Paniagua',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/8cebc294-ea61-40d0-9b04-08d7d474332c.JPG'
          }
        },
        {
          id: 'voice-5',
          user_id: 'voice-5',
          instrument: 'Contralto - Micrófono #5',
          is_leader: false,
          profiles: {
            id: 'voice-5',
            full_name: 'Ruth Esmailin Ramirez',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/619c1a4e-42db-4549-8890-16392cfa2a87.JPG'
          }
        }
      ],
      selected_songs: [
        { id: '1', title: 'Tu nombre es Cristo', artist: 'Marcos Witt', song_order: 1 },
        { id: '2', title: 'Libre', artist: 'Miel San Marcos', song_order: 2 },
        { id: '3', title: 'Desde mi interior', artist: 'Hillsong en Español', song_order: 3 }
      ],
      offering_song: { title: 'Este corito es', artist: '' }
    },
    {
      id: '2',
      service_date: '2025-08-31',
      title: 'Segundo Servicio - 10:45 AM',
      leader: 'Nicolas Peralta',
      service_type: 'regular',
      location: 'Templo Principal',
      special_activity: 'Servicio Dominical',
      worship_groups: {
        id: '2',
        name: 'Grupo de Keyla',
        color_theme: '#8B5CF6'
      },
      group_members: [
        {
          id: 'director-2',
          user_id: 'director-2',
          instrument: 'Director',
          is_leader: true,
          profiles: {
            id: 'director-2',
            full_name: 'Nicolas Peralta',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/f36d35a3-aa9c-4bd6-9b1a-ca1dd4326e3f.JPG'
          }
        },
        {
          id: 'voice-6',
          user_id: 'voice-6',
          instrument: 'Soprano - Micrófono #1',
          is_leader: false,
          profiles: {
            id: 'voice-6',
            full_name: 'Keyla Yanira Medrano Medrano',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c24659e9-b473-4ecd-97e7-a90526d23502.JPG'
          }
        },
        {
          id: 'voice-7',
          user_id: 'voice-7',
          instrument: 'Soprano - Micrófono #2',
          is_leader: false,
          profiles: {
            id: 'voice-7',
            full_name: 'Yindia Carolina Santana Castillo',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/11328db1-559f-4dcf-9024-9aef18435700.JPG'
          }
        },
        {
          id: 'voice-8',
          user_id: 'voice-8',
          instrument: 'Bajo - Micrófono #3',
          is_leader: false,
          profiles: {
            id: 'voice-8',
            full_name: 'Arizoni Liriano',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/4eed809d-9437-48d5-935e-cf8b4aa8024a.png'
          }
        },
        {
          id: 'voice-9',
          user_id: 'voice-9',
          instrument: 'Contralto - Micrófono #4',
          is_leader: false,
          profiles: {
            id: 'voice-9',
            full_name: 'Aida Lorena Pacheco de Santana',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/82b62449-5046-455f-af7b-da8e5dbc6327.JPG'
          }
        },
        {
          id: 'voice-10',
          user_id: 'voice-10',
          instrument: 'Contralto - Micrófono #5',
          is_leader: false,
          profiles: {
            id: 'voice-10',
            full_name: 'Sugey A. Gonzalez Garo',
            photo_url: 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/be61d066-5707-4763-8d8c-16d19597dc3a.JPG'
          }
        }
      ],
      selected_songs: [
        { id: '4', title: 'Me gozaré / Oh moradora de Sión', artist: 'Marcos Witt', song_order: 1 },
        { id: '5', title: 'Me uno al cielo', artist: 'ADN - Arca de Noé', song_order: 2 },
        { id: '6', title: 'Tu Nombre', artist: 'Miel San Marcos', song_order: 3 }
      ],
      offering_song: { title: 'Hosanna', artist: 'Marco Barrientos' }
    }
  ];

  const downloadServiceCard = async (serviceId, ref) => {
    if (!ref.current) return;

    try {
      window.scrollTo(0, 0);
      await new Promise(resolve => setTimeout(resolve, 500));

      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#f8fafc',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(`[data-service-card="${serviceId}"]`);
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'relative';
          }
        }
      });

      const service = mockServiceData.find(s => s.id === serviceId);
      const link = document.createElement('a');
      link.download = `servicio-${service.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      toast({
        title: "¡Descarga exitosa!",
        description: `La tarjeta del ${service.title} se ha descargado correctamente`,
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

  const ServiceCard = ({ service, ref }) => {
    const directorMember = service.group_members.find(m => m.is_leader);
    const responsibleVoices = service.group_members.filter(m => !m.is_leader);

    return (
      <div 
        ref={ref}
        data-service-card={service.id}
        className="bg-white/90 rounded-xl p-6 border border-blue-200 shadow-lg mx-auto"
        style={{ maxWidth: '600px' }}
      >
        {/* Service Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">{service.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-blue-700 font-medium">{service.worship_groups.name}</span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">{service.special_activity}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Songs and Director */}
          <div className="space-y-4">
            {/* Director */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-blue-800 mb-3">Director/a de Alabanza</div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border-3 border-blue-300 shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600">
                  <img
                    src={directorMember?.profiles?.photo_url}
                    alt={service.leader}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full hidden items-center justify-center text-white text-lg font-bold">
                    {service.leader.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{service.leader}</div>
                  <div className="text-sm text-blue-600">Líder del Servicio</div>
                </div>
              </div>
            </div>

            {/* Selected Songs */}
            {service.selected_songs && service.selected_songs.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 text-green-600">🎵</div>
                  <div className="text-sm font-semibold text-green-800">Canciones Seleccionadas</div>
                </div>
                <div className="space-y-2">
                  {service.selected_songs.slice(0, 3).map((song, index) => (
                    <div key={song.id} className="flex items-center gap-2 text-sm">
                      <span className="w-5 h-5 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900">{song.title}</div>
                        {song.artist && (
                          <div className="text-xs text-gray-600">{song.artist}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {service.selected_songs.length > 3 && (
                    <div className="text-xs text-green-700 font-medium">
                      +{service.selected_songs.length - 3} canciones más
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Offering Song */}
            {service.offering_song && (
              <div className="bg-amber-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 text-amber-600">🎵</div>
                  <div className="text-sm font-semibold text-amber-800">Canción de Ofrendas</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold">
                    $
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{service.offering_song.title}</div>
                    {service.offering_song.artist && (
                      <div className="text-xs text-gray-600">{service.offering_song.artist}</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Voices */}
          <div>
            {responsibleVoices.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 h-full">
                <div className="text-sm font-semibold text-purple-800 mb-3">Responsables de Voces</div>
                <div className="grid grid-cols-1 gap-3">
                  {responsibleVoices.slice(0, 6).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-purple-200 overflow-hidden bg-gradient-to-r from-purple-400 to-pink-400">
                        <img
                          src={member.profiles?.photo_url}
                          alt={member.profiles?.full_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full hidden items-center justify-center text-white text-sm font-bold">
                          {member.profiles?.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {member.profiles?.full_name}
                        </div>
                        <div className="text-xs text-purple-600">
                          {member.instrument}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
            className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Mostrar Overlay de Servicios
          </Button>
        </CardContent>
      </Card>
      
      <NotificationTestButton />

      {/* Service Overlay Mock */}
      {showServiceOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto">
          <div className="w-full max-w-4xl animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 shadow-2xl border-2">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-blue-900 mb-1">
                          Programa de Servicios
                        </h2>
                        <p className="text-blue-700">
                          Domingo, 31 de Agosto - 5to Domingo
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowServiceOverlay(false)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                    >
                      ✕
                    </Button>
                  </div>

                  {/* Services List */}
                  <div className="space-y-6">
                    {mockServiceData.map((service) => {
                      const ref = service.id === '1' ? cardRef1 : cardRef2;
                      return (
                        <ServiceCard key={service.id} service={service} ref={ref} />
                      );
                    })}
                  </div>

                  {/* Warning Message */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800">
                      ⚠️ <strong>Importante:</strong> Revise el programa completo y confirme su disponibilidad. 
                      En caso de algún inconveniente, coordine los reemplazos necesarios.
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button 
                      onClick={() => downloadServiceCard('1', cardRef1)}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                    >
                      <Download className="w-4 h-4" />
                      Descargar 1er Servicio
                    </Button>
                    <Button 
                      onClick={() => downloadServiceCard('2', cardRef2)}
                      className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                    >
                      <Download className="w-4 h-4" />
                      Descargar 2do Servicio
                    </Button>
                    <Button
                      onClick={() => setShowServiceOverlay(false)}
                      variant="outline"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                    >
                      ✕ Cerrar
                    </Button>
                  </div>

                  {/* Footer */}
                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-500">
                      💒 Mensaje automatizado del Sistema ARCANA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationTesting;
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Calendar, Download, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotificationTestButton from '@/components/notifications/NotificationTestButton';
import html2canvas from 'html2canvas';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import arcaNoeLogo from '@/assets/arca-noe-logo.png';

// Definir interfaces para los tipos de datos
interface Profile {
  id: string;
  full_name: string;
  photo_url?: string;
}

interface GroupMember {
  id: string;
  user_id: string;
  instrument: string;
  is_leader: boolean;
  profiles: Profile;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  song_order: number;
}

interface WorshipGroup {
  id: string;
  name: string;
  color_theme: string;
}

interface Service {
  id: string;
  service_date: string;
  title: string;
  leader: string;
  service_type: string;
  location: string;
  special_activity: string;
  worship_groups: WorshipGroup;
  group_members: GroupMember[];
  selected_songs: Song[];
  offering_song: { title: string; artist: string };
}

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

interface ServiceCardProps {
  service: Service;
}

const NotificationTesting = () => {
  const [showServiceOverlay, setShowServiceOverlay] = useState(false);
  const [showRetiroOverlay, setShowRetiroOverlay] = useState(false);
  const [retiroEvent, setRetiroEvent] = useState<RetiroEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const cardRef1 = useRef<HTMLDivElement>(null);
  const cardRef2 = useRef<HTMLDivElement>(null);
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

  const mockServiceData: Service[] = [
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
        color_theme: '#3B82F6'
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

  const downloadServiceCard = async (serviceId: string, ref: React.RefObject<HTMLDivElement>) => {
    if (!ref.current) return;

    try {
      // Asegurarnos de que el overlay esté visible
      setShowServiceOverlay(true);
      
      // Esperar un momento para que el DOM se actualice
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(ref.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#f8fafc',
        logging: false,
      });

      const service = mockServiceData.find(s => s.id === serviceId);
      if (!service) return;

      const link = document.createElement('a');
      link.download = `servicio-${service.title.toLowerCase().replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

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

  const ServiceCard = React.forwardRef<HTMLDivElement, ServiceCardProps>(({ service }, ref) => {
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
          <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
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
                <div className="w-16 h-16 rounded-full border-3 border-blue-300 shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600">
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

            {/* Selected Songs - Manteniendo el verde */}
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

            {/* Offering Song - Manteniendo el amarillo */}
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
              <div className="bg-blue-50 rounded-lg p-4 h-full">
                <div className="text-sm font-semibold text-blue-800 mb-3">Responsables de Voces</div>
                <div className="grid grid-cols-1 gap-3">
                  {responsibleVoices.slice(0, 6).map((member) => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-2 border-blue-200 overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600">
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
                        <div className="text-xs text-blue-600">
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
  });

  ServiceCard.displayName = 'ServiceCard';

  const RetiroFlyerOverlay = React.forwardRef<HTMLDivElement>((props, ref) => {
    if (!retiroEvent) return null;

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
      ];
      return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    };

    const getEventTime = (title: string) => {
      const match = title.match(/(\d{1,2}:\d{2})/);
      return match ? match[1] : '09:00';
    };

    return (
      <div 
        ref={ref}
        className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl shadow-2xl mx-auto relative overflow-hidden"
        style={{ maxWidth: '400px', minHeight: '600px' }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-blue-300"></div>
          <div className="absolute top-32 right-8 w-12 h-12 rounded-full bg-purple-300"></div>
          <div className="absolute bottom-20 left-8 w-16 h-16 rounded-full bg-indigo-300"></div>
        </div>

        <div className="relative z-10 p-8 text-center">
          {/* Header */}
          <div className="mb-6">
            <img 
              src={arcaNoeLogo} 
              alt="Logo ADN" 
              className="w-16 h-16 mx-auto mb-3 opacity-90"
            />
            <h1 className="text-lg font-bold text-blue-700 tracking-wide">
              MINISTERIO ADN
            </h1>
            <p className="text-blue-600 font-medium">Arca de Noé</p>
          </div>

          {/* Event Icon */}
          <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center shadow-lg">
            <div className="text-6xl">⛪</div>
          </div>

          {/* Main Title */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">
              ¡{retiroEvent.description}!
            </h2>
            <div className="text-2xl font-bold text-blue-700">
              {formatDate(retiroEvent.service_date)}
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-4 mb-6">
            <div className="bg-white/80 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-blue-800">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">{getEventTime(retiroEvent.title)} a.m.</span>
              </div>
            </div>
            
            <div className="bg-white/80 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-blue-800">
                <MapPin className="w-5 h-5" />
                <span className="font-semibold">{retiroEvent.location}</span>
              </div>
            </div>
            
            <div className="bg-white/80 rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-center gap-2 text-blue-800">
                <Users className="w-5 h-5" />
                <span className="font-semibold">{retiroEvent.leader}</span>
              </div>
            </div>
          </div>

          {/* Special Activity */}
          {retiroEvent.special_activity && (
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-6">
              <div className="text-purple-700 font-semibold text-sm mb-1">Actividad Especial</div>
              <div className="text-purple-800 font-bold">{retiroEvent.special_activity}</div>
            </div>
          )}

          {/* Decorative Elements */}
          <div className="flex justify-center space-x-2 mb-6">
            <div className="text-2xl">🙏</div>
            <div className="text-2xl">✝️</div>
            <div className="text-2xl">❤️</div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-4 mb-4">
            <p className="font-bold text-sm">
              ¡Ven y sé parte de este encuentro especial con Dios!
            </p>
          </div>

          {/* Blessing */}
          <div className="text-blue-700 font-bold text-lg">
            ¡Que Dios te bendiga! 🙌
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-xs">
              <img 
                src={arcaNoeLogo} 
                alt="Logo" 
                className="w-4 h-4 opacity-70"
              />
              <span>Sistema ARCANA • Arca de Noé</span>
            </div>
          </div>
        </div>
      </div>
    );
  });

  RetiroFlyerOverlay.displayName = 'RetiroFlyerOverlay';

  const downloadRetiroCard = async () => {
    if (!retiroRef.current) return;

    try {
      setShowRetiroOverlay(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(retiroRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#f8fafc',
        logging: false,
      });

      const link = document.createElement('a');
      const eventDate = retiroEvent ? new Date(retiroEvent.service_date).toISOString().split('T')[0] : '2025-10-05';
      link.download = `retiro-congregacional-${eventDate}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "¡Descarga exitosa!",
        description: "La tarjeta del Retiro Congregacional se ha descargado correctamente",
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

      {/* Service Overlay Mock */}
      {showServiceOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-auto">
          <div className="w-full max-w-4xl animate-in slide-in-from-bottom-4 fade-in duration-300">
            <Card className="border-blue-200 bg-gradient-to-r from-blue-50 via-blue-50 to-blue-50 shadow-2xl border-2">
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
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
                    <ServiceCard service={mockServiceData[0]} ref={cardRef1} />
                    <ServiceCard service={mockServiceData[1]} ref={cardRef2} />
                  </div>

                  {/* Warning Message - Manteniendo el amarillo */}
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
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    >
                      <Download className="w-4 h-4" />
                      Descargar 1er Servicio
                    </Button>
                    <Button 
                      onClick={() => downloadServiceCard('2', cardRef2)}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
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
                    <p className="text-xs text-blue-500">
                      💒 Mensaje automatizado del Sistema ARCANA
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
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
              <RetiroFlyerOverlay ref={retiroRef} />
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
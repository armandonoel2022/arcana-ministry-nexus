import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock, Users, Save, Music, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, getDay, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import html2canvas from 'html2canvas';

interface WeekendService {
  id: string;
  service_date: string;
  title: string;
  leader: string;
  service_type: string;
  location: string;
  special_activity: string | null;
  assigned_group_id?: string;
  worship_groups?: {
    id: string;
    name: string;
    color_theme: string;
  };
  group_members: {
    id: string;
    user_id: string;
    instrument: string;
    is_leader: boolean;
    profiles: {
      id: string;
      full_name: string;
      photo_url?: string;
    };
  }[];
  selected_songs?: {
    id: string;
    title: string;
    artist: string;
    song_order: number;
  }[];
}

interface ServiceProgramNotification {
  service_date: string;
  services: any[];
  special_event?: string;
}

const ServiceNotificationOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [services, setServices] = useState<WeekendService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const serviceCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Limpiar localStorage al montar el componente para evitar conflictos
    localStorage.removeItem('serviceNotificationDismissed');
    localStorage.removeItem('serviceNotificationLastShown');
    
    // Check if user has already interacted with the notification
    const hasInteracted = localStorage.getItem('serviceNotificationDismissed');
    const lastShownDate = localStorage.getItem('serviceNotificationLastShown');
    const today = new Date().toDateString();

    if (!hasInteracted || lastShownDate !== today) {
      fetchWeekendServices();
    } else {
      setIsLoading(false);
    }

    // Listen for service program notifications
    const handleNotifications = (payload: any) => {
      if (payload.eventType === 'INSERT' && 
          payload.new.type === 'daily_verse' && 
          payload.new.notification_category === 'agenda' &&
          payload.new.metadata?.service_date) {
        // Show overlay immediately for service program notifications
        showServiceProgramOverlay(payload.new.metadata);
      }
    };

    const channel = supabase
      .channel('service-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'system_notifications'
      }, handleNotifications)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showServiceProgramOverlay = (metadata: ServiceProgramNotification) => {
    if (metadata.services && Array.isArray(metadata.services)) {
      const formattedServices = metadata.services.map((service: any) => ({
        id: service.id || Date.now().toString(),
        service_date: metadata.service_date,
        title: `${service.time === '8:00 a.m.' ? 'Primer Servicio - 8:00 AM' : 'Segundo Servicio - 10:45 AM'}`,
        leader: service.director?.name || service.director || 'Por asignar',
        service_type: 'regular',
        location: 'Templo Principal',
        special_activity: metadata.special_event || null,
        worship_groups: service.group ? {
          id: '1',
          name: service.group,
          color_theme: '#3B82F6'
        } : undefined,
        group_members: [
          // Director
          ...(service.director ? [{
            id: 'director-' + service.time,
            user_id: 'director',
            instrument: 'Director',
            is_leader: true,
            profiles: {
              id: 'director',
              full_name: service.director?.name || service.director,
              photo_url: service.director?.photo
            }
          }] : []),
          // Responsables de voces
          ...((service.voices || []).map((voice: any, index: number) => ({
            id: 'voice-' + service.time + '-' + index,
            user_id: 'voice-' + index,
            instrument: index === 0 ? 'Soprano - Micrófono #1' : 
                       index === 1 ? 'Contralto - Micrófono #2' : 
                       index === 2 ? 'Tenor - Micrófono #3' : 
                       index === 3 ? 'Bajo - Micrófono #4' : 
                       `Voz ${index + 1} - Micrófono #${index + 1}`,
            is_leader: false,
            profiles: {
              id: 'voice-' + index,
              full_name: voice.name || 'Sin nombre',
              photo_url: voice.photo
            }
          })))
        ],
        selected_songs: (service.songs || []).map((song: any) => ({
          id: song.id || `song-${Date.now()}-${Math.random()}`,
          title: song.title || 'Sin título',
          artist: song.artist || 'Artista desconocido',
          song_order: song.song_order || 0
        }))
      }));
      
      setServices(formattedServices);
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 100);
      
      // Limpiar localStorage para asegurar que se muestre
      localStorage.removeItem('serviceNotificationDismissed');
      localStorage.removeItem('serviceNotificationLastShown');
    }
  };

  const getNextWeekend = () => {
    const now = new Date();
    const currentDay = getDay(now); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentHour = now.getHours();
    
    // Find next Friday (5)
    let daysUntilFriday = (5 - currentDay + 7) % 7;
    if (daysUntilFriday === 0 && currentHour >= 14) {
      daysUntilFriday = 7; // If it's Friday after 2 PM, show next week's weekend
    }
    
    const friday = new Date(now);
    friday.setDate(now.getDate() + daysUntilFriday);
    friday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    sunday.setHours(23, 59, 59, 999);
    
    return { start: friday, end: sunday };
  };

  const fetchWeekendServices = async () => {
    try {
      const { start, end } = getNextWeekend();
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          id,
          service_date,
          title,
          leader,
          service_type,
          location,
          special_activity,
          assigned_group_id,
          worship_groups (
            id,
            name,
            color_theme
          )
        `)
        .gte('service_date', start.toISOString())
        .lte('service_date', end.toISOString())
        .order('service_date', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // For each service, get the group members with their profiles and selected songs
        const servicesWithMembers = await Promise.all(  
          data.map(async (service) => {  
            let members: any[] = [];
            let selectedSongs: any[] = [];

            if (service.assigned_group_id) {
              const { data: membersData, error: membersError } = await supabase
                .from('group_members')
                .select(`
                  id,
                  user_id,
                  instrument,
                  is_leader,
                  profiles (
                    id,
                    full_name,
                    photo_url
                  )
                `)
                .eq('group_id', service.assigned_group_id)
                .eq('is_active', true);

              if (!membersError && membersData) {
                members = membersData;
              }
            }

            // Get selected songs for this service
            const { data: songsData, error: songsError } = await supabase
              .from('service_songs')
              .select(`
                id,
                song_order,
                songs (
                  id,
                  title,
                  artist
                )
              `)
              .eq('service_id', service.id)
              .order('song_order');

            if (!songsError && songsData) {
              selectedSongs = songsData.map((item: any) => ({
                id: item.songs.id,
                title: item.songs.title,
                artist: item.songs.artist,
                song_order: item.song_order
              }));
            }

            return {   
              ...service,   
              group_members: members,  
              selected_songs: selectedSongs,  
              // Corregir el tipo de worship_groups  
              worship_groups: Array.isArray(service.worship_groups) && service.worship_groups.length > 0   
                ? service.worship_groups[0]   
                : null  
            };  
          })  
        );

        setServices(servicesWithMembers as WeekendService[]);
        
        // Show the overlay with animation
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 100);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching weekend services:', error);
      setIsLoading(false);
    }
  };

  const closeOverlay = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('serviceNotificationDismissed', 'true');
      localStorage.setItem('serviceNotificationLastShown', new Date().toDateString());
    }, 300);
  };

  const saveToNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (services.length === 0) {
        toast.error('No hay servicios para guardar');
        return;
      }

      const servicesList = services.map(service => {
        const time = getServiceTime(service.title);
        const songsText = service.selected_songs && service.selected_songs.length > 0 
          ? `\nCanciones: ${service.selected_songs.map(s => s.title).join(', ')}`
          : '';
        return `${time} - ${service.leader}${songsText}`;
      }).join('\n\n• ');

      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: user.id,
          type: 'service_program',
          title: 'Programa de Servicios - Fin de Semana',
          message: `Servicios programados para ${format(new Date(services[0].service_date), 'EEEE, dd \'de\' MMMM', { locale: es })}:\n\n• ${servicesList}`,
          notification_category: 'agenda',
          metadata: {
            service_date: services[0].service_date,
            services: services.map(s => ({
              id: s.id,
              date: s.service_date,
              title: s.title,
              leader: s.leader,
              group: s.worship_groups?.name,
              time: getServiceTime(s.title),
              director: {
                name: s.leader,
                photo: s.group_members.find(m => m.is_leader)?.profiles?.photo_url
              },
              voices: getResponsibleVoices(s.group_members).map(v => ({
                name: v.profiles?.full_name,
                photo: v.profiles?.photo_url
              })),
              songs: s.selected_songs || []
            }))
          }
        });

      toast.success('Programa guardado en notificaciones');
      closeOverlay();
    } catch (error) {
      console.error('Error saving notification:', error);
      toast.error('Error al guardar la notificación');
    }
  };

  const getServiceTime = (serviceTitle: string) => {
    if (serviceTitle.toLowerCase().includes('primera') || serviceTitle.toLowerCase().includes('8:00') || serviceTitle.toLowerCase().includes('primer')) {
      return '8:00 AM';
    } else if (serviceTitle.toLowerCase().includes('segunda') || serviceTitle.toLowerCase().includes('10:45') || serviceTitle.toLowerCase().includes('segundo')) {
      return '10:45 AM';
    }
    return serviceTitle;
  };

  const getInitials = (name: string) => {
    if (!name) return 'NN';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getResponsibleVoices = (members: WeekendService['group_members']) => {
    return members.filter(member => 
      member.instrument?.toLowerCase().includes('soprano') ||
      member.instrument?.toLowerCase().includes('alto') ||
      member.instrument?.toLowerCase().includes('tenor') ||
      member.instrument?.toLowerCase().includes('bajo') ||
      member.instrument?.toLowerCase().includes('voice') ||
      member.instrument?.toLowerCase().includes('voz')
    );
  };

  const downloadServiceImage = async (serviceId: string, serviceTitle: string) => {
    try {
      const element = serviceCardRefs.current[serviceId];
      if (!element) {
        toast.error('No se pudo encontrar el servicio para descargar');
        return;
      }

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: true,
      });

      const link = document.createElement('a');
      link.download = `${serviceTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      toast.success('Imagen descargada exitosamente');
    } catch (error) {
      console.error('Error downloading service image:', error);
      toast.error('Error al descargar la imagen');
    }
  };

  if (isLoading) {
    return null;
  }

  if (!isVisible || services.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center py-8">
        <div 
          className={`w-full max-w-4xl transition-all duration-300 ease-out ${
            isAnimating 
              ? 'animate-in slide-in-from-bottom-4 fade-in duration-300' 
              : 'animate-out slide-out-to-top-4 fade-out duration-300'
          }`}
        >
          {/* Fixed Header */}
          <div className="bg-white rounded-t-xl p-4 border-b border-gray-200 sticky top-4 z-10 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-blue-900">
                    Programa de Servicios
                  </h2>
                  <p className="text-blue-700 text-sm">
                    {format(new Date(services[0].service_date), 'EEEE, dd \'de\' MMMM', { locale: es })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveToNotifications}
                  className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeOverlay}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Services Cards */}
          <div className="bg-white rounded-b-xl">
            <div className="p-6 space-y-6">
              {services.map((service) => {
                const serviceTime = getServiceTime(service.title);
                const director = service.leader;
                const directorMember = service.group_members.find(m => m.is_leader);
                const responsibleVoices = getResponsibleVoices(service.group_members).slice(0, 5);
                const hasSongs = service.selected_songs && service.selected_songs.length > 0;

                return (
                  <div 
                    key={service.id}
                    ref={el => serviceCardRefs.current[service.id] = el}
                    className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                  >
                    {/* Service Header */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold">
                              {service.title}
                            </h3>
                            <div className="flex items-center gap-2 text-blue-100">
                              {service.worship_groups && (
                                <>
                                  <Badge 
                                    variant="secondary"
                                    className="bg-white/20 text-white border-white/30 text-xs"
                                  >
                                    {service.worship_groups.name}
                                  </Badge>
                                  <span className="text-xs">•</span>
                                </>
                              )}
                              <span className="text-xs">{service.service_type === 'regular' ? 'Servicio Dominical' : service.service_type}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadServiceImage(service.id, service.title)}
                          className="text-white hover:bg-white/20"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {service.special_activity && (
                        <div className="mt-2 flex items-center gap-2 text-yellow-200">
                          <span className="text-lg">⭐</span>
                          <span className="font-medium">{service.special_activity}</span>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Left Side - Director */}
                        <div>
                          <h4 className="text-blue-800 font-semibold mb-4 text-center">Director/a de Alabanza</h4>
                          <div className="text-center mb-6">
                            <Avatar className="w-24 h-24 mx-auto mb-3 border-4 border-blue-200">
                              <AvatarImage
                                src={directorMember?.profiles?.photo_url}
                                alt={director}
                                className="object-cover object-center"
                                style={{ objectPosition: 'center top' }}
                              />
                              <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-bold">
                                {getInitials(director)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-bold text-gray-900 text-lg">{director}</div>
                              <div className="text-sm text-blue-600">Líder del Servicio</div>
                            </div>
                          </div>

                          {/* Selected Songs */}
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <Music className="w-4 h-4 text-gray-600" />
                              <h5 className="font-semibold text-gray-800">Canciones Seleccionadas</h5>
                            </div>
                            
                            {hasSongs ? (
                              <div className="space-y-2">
                                {service.selected_songs?.slice(0, 3).map((song, index) => (
                                  <div key={song.id} className="flex items-center gap-3 p-2 bg-green-50 rounded-md">
                                    <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
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
                                {service.selected_songs && service.selected_songs.length > 3 && (
                                  <div className="text-xs text-green-700 font-medium pl-9">
                                    +{service.selected_songs.length - 3} canciones más
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-800 italic">
                                  Pendiente de seleccionar las canciones
                                </p>
                              </div>
                            )}

                            {/* Offering Song */}
                            <div className="mt-4">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg">💰</span>
                                <h5 className="font-semibold text-yellow-700">Canción de Ofrendas</h5>
                              </div>
                              <div className="p-3 bg-yellow-50 rounded-md">
                                <div className="font-medium">Hosanna</div>
                                <div className="text-sm text-gray-600">Marco Barrientos</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Side - Voices */}
                        <div>
                          <h4 className="text-blue-800 font-semibold mb-4 text-center">Responsables de Voces</h4>
                          
                          {responsibleVoices.length > 0 ? (
                            <div className="space-y-3">
                              {responsibleVoices.map((member, index) => (
                                <div key={member.id} className="flex items-center gap-3">
                                  <Avatar className="w-12 h-12 border-2 border-blue-200">
                                    <AvatarImage
                                      src={member.profiles?.photo_url}
                                      alt={member.profiles?.full_name}
                                      className="object-cover object-center"
                                      style={{ objectPosition: 'center top' }}
                                    />
                                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold">
                                      {getInitials(member.profiles?.full_name || '')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-medium text-gray-900">
                                      {member.profiles?.full_name}
                                    </div>
                                    <div className="text-sm text-blue-600">
                                      {member.instrument}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              {responsibleVoices.length > 5 && (
                                <div className="text-xs text-blue-700 font-medium text-center pt-2">
                                  +{responsibleVoices.length - 5} integrantes más
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center p-4 bg-gray-50 rounded-md">
                              <p className="text-sm text-gray-600 italic">
                                No hay responsables de voces asignados
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning Message */}
            <div className="px-6 pb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800 text-center">
                  ⚠️ <strong>Importante:</strong> Revise el programa completo y confirme su disponibilidad. 
                  En caso de algún inconveniente, coordine los reemplazos necesarios.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceNotificationOverlay;
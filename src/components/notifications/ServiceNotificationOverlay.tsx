import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock, Users, Save, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, getDay } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface WeekendService {
  id: string;
  service_date: string;
  title: string;
  leader: string;
  service_type: string;
  location: string;
  special_activity: string | null;
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

const ServiceNotificationOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [services, setServices] = useState<WeekendService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const showServiceProgramOverlay = (metadata: any) => {
    if (metadata.services) {
      const formattedServices = metadata.services.map((service: any) => ({
        id: service.id || Date.now().toString(),
        service_date: metadata.service_date,
        title: `${service.time === '8:00 a.m.' ? 'Primer Servicio - 8:00 AM' : 'Segundo Servicio - 10:45 AM'}`,
        leader: service.director?.name || service.director,
        service_type: 'regular',
        location: 'Templo Principal',
        special_activity: metadata.special_event,
        worship_groups: {
          id: '1',
          name: service.group,
          color_theme: '#3B82F6'
        },
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
          ...(service.voices || []).map((voice: any, index: number) => ({
            id: 'voice-' + service.time + '-' + index,
            user_id: 'voice-' + index,
            instrument: index === 0 ? 'Soprano - Micrófono #1' : 
                       index === 1 ? 'Contralto - Micrófono #2' : 
                       index === 2 ? 'Tenor - Micrófono #3' : 
                       index === 3 ? 'Contralto - Micrófono #4' : 
                       `Voz ${index + 1} - Micrófono #${index + 1}`,
            is_leader: false,
            profiles: {
              id: 'voice-' + index,
              full_name: voice.name,
              photo_url: voice.photo
            }
          }))
        ],
        selected_songs: (service.songs || []).map((song: any) => ({
          id: song.id,
          title: song.title,
          artist: song.artist,
          song_order: song.song_order
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
    
    let weekStart, weekEnd;
    
    // Si ya pasaron las 2 PM del día actual y es después del miércoles, mostrar el próximo fin de semana
    if ((currentDay > 3) || (currentDay === 3 && currentHour >= 14)) {
      // Si estamos en jueves después de las 2 PM o después, mostrar el próximo fin de semana
      const daysToAdd = currentDay === 0 ? 5 : (12 - currentDay) % 7;
      weekStart = new Date(now);
      weekStart.setDate(now.getDate() + daysToAdd);
      weekStart.setHours(0, 0, 0, 0);
      
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 2);
      weekEnd.setHours(23, 59, 59, 999);
    } else {
      // Mostrar el fin de semana actual/próximo
      const daysUntilFriday = (5 - currentDay + 7) % 7;
      weekStart = new Date(now);
      weekStart.setDate(now.getDate() + daysUntilFriday);
      weekStart.setHours(0, 0, 0, 0);
      
      weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 2);
      weekEnd.setHours(23, 59, 59, 999);
    }
    
    return { start: weekStart, end: weekEnd };
  };

  const fetchWeekendServices = async () => {
    try {
      const { start, end } = getNextWeekend();
      
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
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
              selected_songs: selectedSongs
            };
          })
        );

        setServices(servicesWithMembers);
        
        // Show the overlay with animation
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 100);
      }
    } catch (error) {
      console.error('Error fetching weekend services:', error);
    } finally {
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
    if (serviceTitle.toLowerCase().includes('primera') || serviceTitle.toLowerCase().includes('8:00')) {
      return '8:00 AM';
    } else if (serviceTitle.toLowerCase().includes('segunda') || serviceTitle.toLowerCase().includes('10:45')) {
      return '10:45 AM';
    }
    return '';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getResponsibleVoices = (members: WeekendService['group_members']) => {
    return members.filter(member => 
      member.instrument.toLowerCase().includes('soprano') ||
      member.instrument.toLowerCase().includes('alto') ||
      member.instrument.toLowerCase().includes('tenor') ||
      member.instrument.toLowerCase().includes('bajo') ||
      member.instrument.toLowerCase().includes('voice')
    );
  };

  if (isLoading || !isVisible || services.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div 
        className={`w-full max-w-2xl transition-all duration-300 ease-out ${
          isAnimating 
            ? 'animate-in slide-in-from-bottom-4 fade-in duration-300' 
            : 'animate-out slide-out-to-top-4 fade-out duration-300'
        }`}
      >
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
                      {format(new Date(services[0].service_date), 'EEEE, dd \'de\' MMMM', { locale: es })}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeOverlay}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Services List */}
              <div className="space-y-6">
                {services.map((service) => {
                  const serviceTime = getServiceTime(service.title);
                  const director = service.leader;
                  const directorMember = service.group_members.find(m => m.is_leader);
                  const responsibleVoices = getResponsibleVoices(service.group_members);

                  return (
                    <div 
                      key={service.id}
                      className="bg-white/90 rounded-xl p-6 border border-blue-200 shadow-lg"
                    >
                      {/* Service Header */}
                      <div className="flex items-center gap-3 mb-6">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <span className="text-xl font-bold text-blue-900">{serviceTime}</span>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          {service.service_type}
                        </Badge>
                      </div>

                      {/* Service Title */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                      
                      {service.special_activity && (
                        <p className="text-blue-700 font-medium mb-4">
                          ⭐ {service.special_activity}
                        </p>
                      )}

                      {/* Group Badge */}
                      {service.worship_groups && (
                        <div className="flex items-center gap-2 mb-6">
                          <Users className="w-4 h-4 text-gray-500" />
                          <Badge 
                            className="text-sm px-3 py-1"
                            style={{ 
                              backgroundColor: service.worship_groups.color_theme + '20',
                              color: service.worship_groups.color_theme,
                              borderColor: service.worship_groups.color_theme + '40'
                            }}
                          >
                            {service.worship_groups.name}
                          </Badge>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Director Column */}
                        <div className="space-y-4">
                          {/* Director */}
                          <div className="bg-blue-50 rounded-lg p-4">
                            <div className="text-sm font-semibold text-blue-800 mb-3">Director/a de Alabanza</div>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-16 h-16 border-3 border-blue-300 shadow-lg">
                                <AvatarImage
                                  src={directorMember?.profiles?.photo_url}
                                  alt={director}
                                  className="object-cover"
                                />
                                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-lg font-bold">
                                  {getInitials(director)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-semibold text-gray-900">{director}</div>
                                <div className="text-sm text-blue-600">Líder del Servicio</div>
                              </div>
                            </div>
                          </div>

                          {/* Selected Songs */}
                          {service.selected_songs && service.selected_songs.length > 0 && (
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Music className="w-4 h-4 text-green-600" />
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
                        </div>

                        {/* Voices Column */}
                        <div>
                          {responsibleVoices.length > 0 && (
                            <div className="bg-blue-50 rounded-lg p-4 h-full">
                              <div className="text-sm font-semibold text-blue-800 mb-3">Responsables de Voces</div>
                              <div className="grid grid-cols-1 gap-3">
                                {responsibleVoices.slice(0, 6).map((member) => (
                                  <div key={member.id} className="flex items-center gap-3">
                                    <Avatar className="w-12 h-12 border-2 border-blue-200">
                                      <AvatarImage
                                        src={member.profiles?.photo_url}
                                        alt={member.profiles?.full_name}
                                        className="object-cover"
                                      />
                                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold">
                                        {getInitials(member.profiles?.full_name || '')}
                                      </AvatarFallback>
                                    </Avatar>
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
                              {responsibleVoices.length > 6 && (
                                <div className="text-xs text-blue-700 font-medium mt-2 text-center">
                                  +{responsibleVoices.length - 6} integrantes más
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Warning Message */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  ⚠️ <strong>Importante:</strong> Revise el programa completo y confirme su disponibilidad. 
                  En caso de algún inconveniente, coordine los reemplazos necesarios.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={saveToNotifications}
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar en Notificaciones
                </Button>
                <Button
                  onClick={closeOverlay}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cerrar
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
  );
};

export default ServiceNotificationOverlay;
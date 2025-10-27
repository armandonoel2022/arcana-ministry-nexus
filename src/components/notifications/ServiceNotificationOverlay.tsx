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
  director_profile?: {
    id: string;
    full_name: string;
    photo_url?: string;
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

interface ServiceNotificationOverlayProps {
  forceShow?: boolean;
  onClose?: () => void;
}

const ServiceNotificationOverlay = ({ forceShow = false, onClose }: ServiceNotificationOverlayProps = {}) => {
  const [isVisible, setIsVisible] = useState(forceShow);
  const [isAnimating, setIsAnimating] = useState(false);
  const [services, setServices] = useState<WeekendService[]>([]);
  const [isLoading, setIsLoading] = useState(!forceShow);
  const serviceCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Si forceShow es true (preview mode), siempre cargar los servicios
    if (forceShow) {
      setIsVisible(true);
      setIsAnimating(true);
      fetchWeekendServices();
      return;
    }

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
      if (
        payload.eventType === 'INSERT' &&
        payload.new.type === 'service_program' &&
        payload.new.notification_category === 'agenda' &&
        payload.new.metadata?.service_date
      ) {
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
            let directorProfile: any = null;

            // Get director profile by searching for the leader name in profiles
            if (service.leader) {
              const { data: profileData } = await supabase
                .from('profiles')
                .select('id, full_name, photo_url')
                .ilike('full_name', `%${service.leader}%`)
                .limit(1)
                .single();
              
              if (profileData) {
                directorProfile = profileData;
              }
            }

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
              director_profile: directorProfile,
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
      if (!forceShow) {
        localStorage.setItem('serviceNotificationDismissed', 'true');
        localStorage.setItem('serviceNotificationLastShown', new Date().toDateString());
      }
      if (onClose) {
        onClose();
      }
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
      member.instrument?.toLowerCase().includes('voz') ||
      member.instrument?.toLowerCase().includes('contralto')
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
          <div className="bg-white rounded-t-xl p-4 border-b border-border sticky top-4 z-10 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">
                    Programa de Servicios
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {format(new Date(services[0].service_date), 'EEEE, dd \'de\' MMMM', { locale: es })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={saveToNotifications}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Guardar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeOverlay}
                  className="text-destructive hover:text-destructive"
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
                const directorPhoto = service.director_profile?.photo_url;
                const responsibleVoices = getResponsibleVoices(service.group_members).slice(0, 5);
                
                // Separar canciones por tipo
                const worshipSongs = service.selected_songs?.filter(s => s.song_order >= 1 && s.song_order <= 4) || [];
                const offeringsSongs = service.selected_songs?.filter(s => s.song_order === 5) || [];
                const communionSongs = service.selected_songs?.filter(s => s.song_order === 6) || [];

                return (
                  <div 
                    key={service.id}
                    ref={el => serviceCardRefs.current[service.id] = el}
                    className="bg-card rounded-xl border-2 border-primary/20 shadow-lg overflow-hidden"
                  >
                    {/* Service Header */}
                    <div className="bg-primary text-primary-foreground px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">
                              {service.title}
                            </h3>
                            <p className="text-primary-foreground/80 text-sm flex items-center gap-2">
                              {service.worship_groups && (
                                <>
                                  <Users className="w-3 h-3" />
                                  {service.worship_groups.name}
                                  <span className="mx-1">•</span>
                                </>
                              )}
                              Servicio Dominical
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadServiceImage(service.id, service.title)}
                          className="text-primary-foreground hover:bg-primary-foreground/20"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Descargar
                        </Button>
                      </div>
                    </div>

                    {/* Service Content */}
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Director de Alabanza */}
                        <div className="bg-accent/50 rounded-lg p-4 border border-border">
                          <h4 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Director/a de Alabanza
                          </h4>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-16 h-16 border-2 border-primary/30">
                              <AvatarImage src={directorPhoto} />
                              <AvatarFallback className="bg-primary/20 text-primary font-bold">
                                {getInitials(director)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold text-foreground">{director}</p>
                              <Badge variant="outline" className="mt-1">
                                Líder del Servicio
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Responsables de Voces */}
                        <div className="bg-accent/50 rounded-lg p-4 border border-border">
                          <h4 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            Responsables de Voces
                          </h4>
                          {responsibleVoices.length > 0 ? (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                              {responsibleVoices.map((voice) => (
                                <div key={voice.id} className="flex items-center gap-3">
                                  <Avatar className="w-10 h-10 border-2 border-primary/30">
                                    <AvatarImage src={voice.profiles?.photo_url} />
                                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                                      {getInitials(voice.profiles?.full_name || 'NN')}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground text-sm truncate">
                                      {voice.profiles?.full_name || 'Sin nombre'}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {voice.instrument}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm italic">
                              No hay responsables de voces asignados
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Canciones Seleccionadas */}
                      <div className="space-y-4">
                        {/* Canciones de Adoración */}
                        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                          <h4 className="text-green-900 font-semibold mb-3 flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            Canciones Seleccionadas
                          </h4>
                          {worshipSongs.length > 0 ? (
                            <div className="space-y-2">
                              {worshipSongs.map((song, index) => (
                                <div 
                                  key={song.id} 
                                  className="flex items-start gap-3 bg-white rounded-lg p-3 border border-green-200"
                                >
                                  <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900">
                                      {song.title}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      {song.artist}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <p className="text-gray-500 text-sm italic text-center">
                                Sin canciones seleccionadas
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Canción de Ofrendas */}
                        {offeringsSongs.length > 0 && (
                          <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                            <h4 className="text-amber-900 font-semibold mb-3 flex items-center gap-2">
                              <Music className="w-4 h-4" />
                              Canción de Ofrendas
                            </h4>
                            {offeringsSongs.map((song) => (
                              <div 
                                key={song.id} 
                                className="flex items-start gap-3 bg-white rounded-lg p-3 border border-amber-200"
                              >
                                <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center text-lg shrink-0">
                                  💰
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">
                                    {song.title}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {song.artist}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Canción de Comunión */}
                        {communionSongs.length > 0 && (
                          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                            <h4 className="text-purple-900 font-semibold mb-3 flex items-center gap-2">
                              <Music className="w-4 h-4" />
                              Canción de Santa Comunión
                            </h4>
                            {communionSongs.map((song) => (
                              <div 
                                key={song.id} 
                                className="flex items-start gap-3 bg-white rounded-lg p-3 border border-purple-200"
                              >
                                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-lg shrink-0">
                                  ✝️
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">
                                    {song.title}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {song.artist}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Special Activity */}
                      {service.special_activity && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                          <p className="text-sm text-yellow-800">
                            <strong>Actividad Especial:</strong> {service.special_activity}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Warning Message */}
            <div className="p-6 pt-0">
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0">⚠️</span>
                  <div>
                    <p className="text-yellow-900 font-medium text-sm">
                      <strong>Importante:</strong> Revise el programa completo y confirme su disponibilidad. 
                      En caso de algún inconveniente, coordine los reemplazos necesarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="px-6 pb-6 flex items-center gap-3 justify-center flex-wrap">
              <Button
                variant="default"
                onClick={() => downloadServiceImage(services[0].id, 'Primer Servicio')}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar 1er Servicio
              </Button>
              {services[1] && (
                <Button
                  variant="default"
                  onClick={() => downloadServiceImage(services[1].id, 'Segundo Servicio')}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar 2do Servicio
                </Button>
              )}
              <Button
                variant="outline"
                onClick={closeOverlay}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceNotificationOverlay;

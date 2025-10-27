import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock, Users, Save, Music, Download, Bell, MapPin, CheckCircle, MessageCircle, Mic, BookOpen } from "lucide-react";
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
  onOpenChat?: (initialMessage?: string) => void;
  onNavigate?: (path: string) => void;
}

const ServiceNotificationOverlay = ({ 
  forceShow = false, 
  onClose, 
  onOpenChat,
  onNavigate
}: ServiceNotificationOverlayProps = {}) => {
  const [isVisible, setIsVisible] = useState(forceShow);
  const [isAnimating, setIsAnimating] = useState(false);
  const [services, setServices] = useState<WeekendService[]>([]);
  const [isLoading, setIsLoading] = useState(!forceShow);
  const [confirmedServices, setConfirmedServices] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'services' | 'preparations'>('services');
  const serviceCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (forceShow) {
      setIsVisible(true);
      setIsAnimating(true);
      fetchWeekendServices();
      return;
    }

    localStorage.removeItem('serviceNotificationDismissed');
    localStorage.removeItem('serviceNotificationLastShown');
    
    const hasInteracted = localStorage.getItem('serviceNotificationDismissed');
    const lastShownDate = localStorage.getItem('serviceNotificationLastShown');
    const today = new Date().toDateString();

    if (!hasInteracted || lastShownDate !== today) {
      fetchWeekendServices();
    } else {
      setIsLoading(false);
    }

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
    const currentDay = getDay(now);
    const currentHour = now.getHours();
    
    let daysUntilFriday = (5 - currentDay + 7) % 7;
    if (daysUntilFriday === 0 && currentHour >= 14) {
      daysUntilFriday = 7;
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
        const servicesWithMembers = await Promise.all(  
          data.map(async (service) => {  
            let members: any[] = [];
            let directorProfile: any = null;

            // Director profile will be derived from group_members after mapping


            if (service.assigned_group_id) {
              const { data: membersData, error: membersError } = await supabase
                .from('group_members')
                .select('id, user_id, instrument, is_leader')
                .eq('group_id', service.assigned_group_id)
                .eq('is_active', true);

              if (!membersError && membersData && membersData.length > 0) {
                const userIds = membersData.map(m => m.user_id);

                const { data: membersProfiles } = await supabase
                  .from('members')
                  .select('id, nombres, apellidos, photo_url')
                  .in('id', userIds);

                const profileMap = new Map(
                  (membersProfiles || []).map((p: any) => [p.id, {
                    id: p.id,
                    full_name: ((p.nombres || '') + ' ' + (p.apellidos || '')).trim(),
                    photo_url: p.photo_url
                  }])
                );

                members = membersData.map(member => ({
                  ...member,
                  profiles: profileMap.get(member.user_id) || {
                    id: member.user_id,
                    full_name: 'Desconocido',
                    photo_url: null
                  }
                }));

                const leader = members.find(m => m.is_leader);
                if (!directorProfile && leader?.profiles) {
                  directorProfile = leader.profiles;
                }

                // Fallback: buscar director por nombre en members si no hay is_leader marcado
                if (!directorProfile && service.leader) {
                  const parts = service.leader.trim().split(/\s+/);
                  const first = parts[0];
                  const last = parts.slice(1).join(' ');

                  if (first) {
                    if (last) {
                      const { data: candidate } = await supabase
                        .from('members')
                        .select('id, nombres, apellidos, photo_url')
                        .ilike('nombres', `%${first}%`)
                        .ilike('apellidos', `%${last}%`)
                        .limit(1)
                        .maybeSingle();
                      if (candidate) {
                        directorProfile = {
                          id: candidate.id,
                          full_name: `${candidate.nombres || ''} ${candidate.apellidos || ''}`.trim(),
                          photo_url: candidate.photo_url
                        };
                      }
                    }

                    if (!directorProfile) {
                      const { data: candidate2 } = await supabase
                        .from('members')
                        .select('id, nombres, apellidos, photo_url')
                        .ilike('nombres', `%${first}%`)
                        .limit(1)
                        .maybeSingle();
                      if (candidate2) {
                        directorProfile = {
                          id: candidate2.id,
                          full_name: `${candidate2.nombres || ''} ${candidate2.apellidos || ''}`.trim(),
                          photo_url: candidate2.photo_url
                        };
                      }
                    }
                  }
                }
              }
            }

            let selectedSongs: any[] = [];
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

            if (!songsError && songsData && songsData.length > 0) {
              selectedSongs = songsData.map((item: any) => ({
                id: item.songs.id,
                title: item.songs.title,
                artist: item.songs.artist,
                song_order: item.song_order
              }));
            } else {
              const { data: selectedView, error: viewError } = await supabase
                .from('service_selected_songs')
                .select('song_id, song_title, artist, selected_at')
                .eq('service_id', service.id)
                .order('selected_at', { ascending: true });
              if (!viewError && selectedView && selectedView.length > 0) {
                selectedSongs = selectedView.map((row: any, idx: number) => ({
                  id: row.song_id,
                  title: row.song_title,
                  artist: row.artist,
                  song_order: idx + 1
                }));
              }
            }

            return {   
              ...service,   
              group_members: members,  
              selected_songs: selectedSongs,  
              director_profile: directorProfile,
              worship_groups: Array.isArray(service.worship_groups) && service.worship_groups.length > 0   
                ? service.worship_groups[0]   
                : null  
            };  
          })  
        );

        setServices(servicesWithMembers as WeekendService[]);
        
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

  const handleConfirmAttendance = async (serviceId: string) => {
    try {
      setConfirmedServices(prev => new Set(prev).add(serviceId));
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('service_confirmations')
          .upsert({
            service_id: serviceId,
            user_id: user.id,
            confirmed: true,
            confirmed_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      toast.success('Asistencia confirmada ✅');
    } catch (error) {
      console.error('Error confirmando asistencia:', error);
      toast.error('Error al confirmar asistencia');
    }
  };

  const handleAskArcana = (service: WeekendService) => {
    const message = `Necesito ayuda para prepararme para el servicio "${service.title}" del ${format(new Date(service.service_date), 'EEEE, dd \'de\' MMMM', { locale: es })}. ¿Qué canciones debo practicar?`;
    onOpenChat?.(message);
    closeOverlay();
  };

  const handleVoiceReminder = (service: WeekendService) => {
    if ('speechSynthesis' in window) {
      const speech = new SpeechSynthesisUtterance();
      speech.text = `Recordatorio: Tienes el servicio ${service.title} el ${format(new Date(service.service_date), 'EEEE, dd \'de\' MMMM', { locale: es })} a las ${getServiceTime(service.title)}. No olvides prepararte.`;
      speech.lang = 'es-ES';
      speech.rate = 0.9;
      
      window.speechSynthesis.speak(speech);
      toast.success('Recordatorio de voz activado 🎙️');
    } else {
      toast.error('Tu navegador no soporta síntesis de voz');
    }
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
      member.instrument?.toLowerCase().includes('contralto') ||
      member.instrument?.toLowerCase().includes('vocals')
    );
  };

  const downloadServiceImage = async (serviceId: string, serviceTitle: string) => {
    try {
      const element = serviceCardRefs.current[serviceId];
      if (!element) {
        toast.error('No se pudo encontrar el servicio para descargar');
        return;
      }

      // Esperar a que todas las imágenes estén cargadas
      const images = element.getElementsByTagName('img');
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) {
          return Promise.resolve(undefined);
        }
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => {
            // Si la imagen falla, usar un placeholder
            console.warn('Image failed to load:', img.src);
            resolve();
          };
          // Timeout después de 3 segundos
          setTimeout(() => resolve(), 3000);
        });
      });

      await Promise.all(imagePromises);

      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `${serviceTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Imagen descargada exitosamente');
    } catch (error) {
      console.error('Error downloading service image:', error);
      toast.error('Error al descargar la imagen');
    }
  };

  // Nuevo diseño de ServiceCard inspirado en NotificationTesting
  const ServiceCard = ({ service }: { service: WeekendService }) => {
    const serviceTime = getServiceTime(service.title);
    const directorMember = service.group_members.find(m => m.is_leader);
    const responsibleVoices = getResponsibleVoices(service.group_members).slice(0, 6);

    const worshipSongs = service.selected_songs?.filter(s => s.song_order >= 1 && s.song_order <= 4) || [];
    const offeringsSongs = service.selected_songs?.filter(s => s.song_order === 5) || [];
    const communionSongs = service.selected_songs?.filter(s => s.song_order === 6) || [];

    return (
      <div 
        ref={el => serviceCardRefs.current[service.id] = el}
        className="bg-white/90 rounded-xl p-6 border border-blue-200 shadow-lg mx-auto"
        style={{ maxWidth: '600px' }}
      >
        {/* Service Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-8 bg-gradient-to-b from-blue-500 to-blue-600 rounded-full"></div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">{service.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-blue-700 font-medium">
                {service.worship_groups?.name || 'Grupo de Alabanza'}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">{service.special_activity || 'Servicio Dominical'}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Director and Songs */}
          <div className="space-y-4">
            {/* Director - Más grande y prominente */}
            <div className="bg-blue-50 rounded-lg p-5">
              <div className="text-sm font-semibold text-blue-800 mb-4">Director/a de Alabanza</div>
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full border-4 border-blue-300 shadow-xl overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 flex-shrink-0">
                  <img
                    src={directorMember?.profiles?.photo_url || service.director_profile?.photo_url}
                    alt={service.leader}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full hidden items-center justify-center text-white text-2xl font-bold">
                    {getInitials(service.leader)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-lg">{service.leader}</div>
                  <div className="text-sm text-blue-600">Líder del Servicio</div>
                </div>
              </div>

              {/* Canciones debajo del director */}
              {worshipSongs.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-green-600" />
                    <div className="text-sm font-semibold text-green-800">Canciones Seleccionadas</div>
                  </div>
                  <div className="space-y-2">
                    {worshipSongs.map((song, index) => (
                      <div key={song.id} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-gray-900">{song.title}</div>
                          {song.artist && (
                            <div className="text-xs text-gray-600">{song.artist}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-blue-200 space-y-2">
                  <p className="text-sm text-gray-600 mb-3">No hay canciones seleccionadas aún</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      closeOverlay();
                      if (onNavigate) {
                        onNavigate('/repertorio');
                      } else {
                        window.location.href = '/repertorio';
                      }
                    }}
                    className="w-full justify-start"
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    Ir a Repertorio general
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      closeOverlay();
                      if (onNavigate) {
                        onNavigate('/communication');
                      } else {
                        window.location.href = '/communication';
                      }
                    }}
                    className="w-full justify-start"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Seleccionar con ARCANA
                  </Button>
                </div>
              )}
            </div>

            {/* Offering Song */}
            {offeringsSongs.length > 0 && (
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
                    <div className="font-medium text-gray-900">{offeringsSongs[0].title}</div>
                    {offeringsSongs[0].artist && (
                      <div className="text-xs text-gray-600">{offeringsSongs[0].artist}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Communion Song */}
            {communionSongs.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-4 h-4 text-purple-600">🎵</div>
                  <div className="text-sm font-semibold text-purple-800">Canción de Comunión</div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-5 h-5 bg-purple-200 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold">
                    ✝️
                  </span>
                  <div>
                    <div className="font-medium text-gray-900">{communionSongs[0].title}</div>
                    {communionSongs[0].artist && (
                      <div className="text-xs text-gray-600">{communionSongs[0].artist}</div>
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
                  {responsibleVoices.map((member) => (
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
                          {getInitials(member.profiles?.full_name || 'NN')}
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

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200">
          <Button
            size="sm"
            variant="outline"
            onClick={() => downloadServiceImage(service.id, service.title)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Descargar
          </Button>
        </div>
      </div>
    );
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
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <Bell className="w-5 h-5 text-white" />
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
              
              {/* Tabs */}
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'services'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Servicios
                  </button>
                  <button
                    onClick={() => setActiveTab('preparations')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === 'preparations'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Preparación
                  </button>
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
          </div>

          {/* Content */}
          <div className="bg-white rounded-b-xl">
            {activeTab === 'services' ? (
              <div className="p-6 space-y-6">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            ) : (
              <div className="p-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Preparation Checklist */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        Lista de Preparación
                      </h3>
                      <div className="space-y-3">
                        {[
                          'Revisar partituras y letras',
                          'Practicar canciones asignadas',
                          'Confirmar tonos y arreglos',
                          'Coordinar con el equipo',
                          'Revisar equipo de sonido',
                          'Llegar 30 minutos antes'
                        ].map((item, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center">
                              <div className="w-3 h-3 bg-green-500 rounded-sm hidden"></div>
                            </div>
                            <span className="text-sm">{item}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        Acciones Rápidas
                      </h3>
                      <div className="space-y-3">
                        <Button
                          onClick={() => {
                            closeOverlay();
                            if (onNavigate) {
                              onNavigate('/communication');
                            } else {
                              window.location.href = '/communication';
                            }
                          }}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          🎵 Consultar canciones con ARCANA
                        </Button>
                        <Button
                          onClick={() => {
                            closeOverlay();
                            if (onNavigate) {
                              onNavigate('/repertorio');
                            } else {
                              window.location.href = '/repertorio';
                            }
                          }}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          📖 Ver repertorio completo
                        </Button>
                        <Button
                          onClick={() => {
                            closeOverlay();
                            if (onNavigate) {
                              onNavigate('/agenda');
                            } else {
                              window.location.href = '/agenda';
                            }
                          }}
                          className="w-full justify-start"
                          variant="outline"
                        >
                          📅 Ver agenda ministerial
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

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
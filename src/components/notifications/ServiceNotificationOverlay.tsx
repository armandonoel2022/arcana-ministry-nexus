import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock, Users, Save } from "lucide-react";
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
}

const ServiceNotificationOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [services, setServices] = useState<WeekendService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testData, setTestData] = useState<any>(null);

  useEffect(() => {
    // Check if user has already interacted with the notification
    const hasInteracted = localStorage.getItem('serviceNotificationDismissed');
    const lastShownDate = localStorage.getItem('serviceNotificationLastShown');
    const today = new Date().toDateString();

    if (!hasInteracted || lastShownDate !== today) {
      fetchWeekendServices();
    } else {
      setIsLoading(false);
    }

    // Listen for test notifications
    const channel = supabase
      .channel('service-test-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'system_notifications'
        },
        (payload) => {
          const notification = payload.new as any;
          if (notification.title?.includes('Programa de Servicios') && 
              (notification.metadata?.services || notification.type === 'service_program')) {
            showTestNotification(notification.metadata);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const showTestNotification = (metadata: any) => {
    setTestData(metadata);
    setIsTestMode(true);
    setIsVisible(true);
    setTimeout(() => setIsAnimating(true), 100);
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
        // For each service, get the group members with their profiles
        const servicesWithMembers = await Promise.all(
          data.map(async (service) => {
            if (service.assigned_group_id) {
              const { data: members, error: membersError } = await supabase
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

              if (!membersError && members) {
                return { ...service, group_members: members };
              }
            }
            return { ...service, group_members: [] };
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
      if (!isTestMode) {
        localStorage.setItem('serviceNotificationDismissed', 'true');
        localStorage.setItem('serviceNotificationLastShown', new Date().toDateString());
      }
      setIsTestMode(false);
      setTestData(null);
    }, 300);
  };

  const saveToNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const servicesList = services.map(service => 
        `${format(new Date(service.service_date), 'EEEE dd/MM', { locale: es })} - ${service.title} (${service.leader})`
      ).join('\n• ');

      await supabase
        .from('system_notifications')
        .insert({
          recipient_id: user.id,
          type: 'daily_verse',
          title: 'Programa de Servicios - Fin de Semana',
          message: `Servicios programados:\n• ${servicesList}`,
          notification_category: 'agenda',
          metadata: {
            services: services.map(s => ({
              id: s.id,
              date: s.service_date,
              title: s.title,
              leader: s.leader,
              group: s.worship_groups?.name
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

  if (isLoading || !isVisible || (!isTestMode && services.length === 0)) {
    return null;
  }

  // Use test data or real services
  const displayServices = isTestMode ? testData?.services || [] : services;

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
                      {isTestMode 
                        ? `${testData?.month_order} - ${format(new Date(testData?.service_date), 'dd \'de\' MMMM', { locale: es })}`
                        : format(new Date(services[0]?.service_date), 'EEEE, dd \'de\' MMMM', { locale: es })
                      }
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
              <div className="space-y-4">
                {displayServices.map((service: any, index: number) => {
                  // Handle both test data and real service data
                  const serviceTime = isTestMode ? service.time : getServiceTime(service.title);
                  const director = isTestMode ? service.director.name : service.leader;
                  const directorPhoto = isTestMode ? service.director.photo : 
                    service.group_members?.find((m: any) => m.is_leader)?.profiles?.photo_url;
                  const groupName = isTestMode ? service.group : service.worship_groups?.name;
                  const voices = isTestMode ? service.voices : getResponsibleVoices(service.group_members || []);
                  const serviceKey = isTestMode ? `test-${index}` : service.id;

                  return (
                    <div 
                      key={serviceKey}
                      className="bg-white/80 rounded-lg p-4 border border-blue-200 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        {/* Service Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-blue-900">{serviceTime}</span>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                              {isTestMode ? 'regular' : service.service_type}
                            </Badge>
                          </div>
                          
                          <h3 className="font-medium text-gray-900 mb-1">
                            {isTestMode ? `Servicio de las ${serviceTime}` : service.title}
                          </h3>
                          
                          {!isTestMode && service.special_activity && (
                            <p className="text-sm text-gray-600 mb-2">
                              {service.special_activity}
                            </p>
                          )}

                          {/* Group */}
                          {groupName && (
                            <div className="flex items-center gap-2 mb-3">
                              <Users className="w-4 h-4 text-gray-500" />
                              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                                {groupName}
                              </Badge>
                            </div>
                          )}

                          {/* Director and Voices */}
                          <div className="space-y-3">
                            {/* Director */}
                            <div>
                              <div className="text-xs font-medium text-gray-600 mb-1">Director/a de Alabanza:</div>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-12 h-12 border-2 border-blue-300">
                                  <AvatarImage
                                    src={directorPhoto}
                                    alt={director}
                                    className="object-cover"
                                  />
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm font-bold">
                                    {getInitials(director)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-gray-900 text-base">{director}</span>
                              </div>
                            </div>

                            {/* Responsible Voices */}
                            {voices && voices.length > 0 && (
                              <div>
                                <div className="text-xs font-medium text-gray-600 mb-2">Responsables de Voces:</div>
                                <div className="flex flex-wrap gap-2">
                                  {voices.slice(0, 5).map((voice: any, voiceIndex: number) => {
                                    const voiceName = isTestMode ? voice.name : voice.profiles?.full_name;
                                    const voicePhoto = isTestMode ? voice.photo : voice.profiles?.photo_url;
                                    const voiceKey = isTestMode ? `voice-${voiceIndex}` : voice.id;
                                    
                                    return (
                                      <div key={voiceKey} className="flex items-center gap-1 text-sm">
                                        <Avatar className="w-8 h-8 border border-gray-300">
                                          <AvatarImage
                                            src={voicePhoto}
                                            alt={voiceName}
                                            className="object-cover"
                                          />
                                          <AvatarFallback className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs font-medium">
                                            {getInitials(voiceName || '')}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-gray-700 font-medium">
                                          {voiceName?.split(' ')[0]}
                                        </span>
                                      </div>
                                    );
                                  })}
                                  {voices.length > 5 && (
                                    <span className="text-xs text-gray-500 ml-1">
                                      +{voices.length - 5} más
                                    </span>
                                  )}
                                </div>
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
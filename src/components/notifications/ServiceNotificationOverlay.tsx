import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { X, Calendar, Clock, Users, Save, Music, Download, Bell, MapPin, CheckCircle, MessageCircle, Mic, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, getDay, isWithinInterval, parseISO } from "date-fns";
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

// Pool de coristas rotativos con IDs correctos de la base de datos
const ROTATIVE_SINGERS = {
  male: [
    { id: 'a71697a2-bf8e-4967-8190-2e3e2d01f150', name: 'Guarionex Garcia', voice: 'Bajo', is_director: true },
    { id: '7a1645d8-75fe-498c-a2e9-f1057ff3521f', name: 'Fredderid Abrahan Valera Montoya', voice: 'Tenor', is_director: false },
    { id: 'f36d35a3-aa9c-4bd6-9b1a-ca1dd4326e3f', name: 'Felix Nicolas Peralta Hernandez', voice: 'Tenor', is_director: true },
    { id: 'd6602109-ad3e-4db6-ab4a-2984dadfc569', name: 'Armando Noel Charle', voice: 'Tenor', is_director: true },
    { id: '6a5bfaa9-fdf0-4b0e-aad3-79266444604f', name: 'Denny Alberto Santana', voice: 'Tenor', is_director: true }
  ],
  female: [
    { id: 'cd2d8fda-0029-4280-a9a1-c23ed5c4f9ad', name: 'Ashley Rossely Jimenez Gonzalez', voice: 'Soprano', is_director: false },
    { id: '8cebc294-ea61-40d0-9b04-08d7d474332c', name: 'Fior Daliza Paniagua', voice: 'Contralto', is_director: false }
  ]
};

// Configuración base de grupos con miembros fijos
const BASE_GROUP_CONFIG = {
  'Grupo de Aleida': {
    color_theme: '#3B82F6',
    base_members: [
      { id: '00a916a8-ab94-4cc0-81ae-668dd6071416', name: 'Aleida Geomar Batista Ventura', voice: 'Soprano', is_director: true },
      { id: 'c4089748-7168-4472-8e7c-bf44b4355906', name: 'Eliabi Joana Sierra Castillo', voice: 'Soprano', is_director: true },
      { id: '8cebc294-ea61-40d0-9b04-08d7d474332c', name: 'Fior Daliza Paniagua', voice: 'Contralto', is_director: false },
      { id: '619c1a4e-42db-4549-8890-16392cfa2a87', name: 'Ruth Esmailin Ramirez', voice: 'Contralto', is_director: false }
    ]
  },
  'Grupo de Keyla': {
    color_theme: '#8B5CF6',
    base_members: [
      { id: 'c24659e9-b473-4ecd-97e7-a90526d23502', name: 'Keyla Yanira Medrano Medrano', voice: 'Soprano', is_director: true },
      { id: '11328db1-559f-4dcf-9024-9aef18435700', name: 'Yindia Carolina Santana Castillo', voice: 'Soprano', is_director: false },
      { id: '4eed809d-9437-48d5-935e-cf8b4aa8024a', name: 'Arizoni Liriano Medina', voice: 'Bajo', is_director: false },
      { id: '82b62449-5046-455f-af7b-da8e5dbc6327', name: 'Aida Lorena Pacheco De Santana', voice: 'Contralto', is_director: false },
      { id: 'be61d066-5707-4763-8d8c-16d19597dc3a', name: 'Sugey A. Gonzalez Garo', voice: 'Contralto', is_director: false }
    ]
  },
  'Grupo de Massy': {
    color_theme: '#EC4899',
    base_members: [
      { id: 'cfca6d0e-d02e-479f-8fdf-8d1c3cd37d38', name: 'Damaris Castillo Jimenez', voice: 'Soprano', is_director: true },
      { id: '2a2fa0cd-d301-46ec-9965-2e4ea3692181', name: 'Rosely Montero', voice: 'Contralto', is_director: false },
      { id: 'b5719097-187d-4804-8b7f-e84cc1ec9ad5', name: 'Jisell Amada Mauricio Paniagua', voice: 'Soprano', is_director: false },
      { id: 'bdcc27cd-40ae-456e-a340-633ce7da08c0', name: 'Rodes Esther Santana Cuesta', voice: 'Contralto', is_director: false }
    ]
  }
};

// URLs de fotos
const PHOTO_URLS = {
  '00a916a8-ab94-4cc0-81ae-668dd6071416': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/00a916a8-ab94-4cc0-81ae-668dd6071416.JPG',
  'c4089748-7168-4472-8e7c-bf44b4355906': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c4089748-7168-4472-8e7c-bf44b4355906.JPG',
  '8cebc294-ea61-40d0-9b04-08d7d474332c': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/8cebc294-ea61-40d0-9b04-08d7d474332c.JPG',
  '619c1a4e-42db-4549-8890-16392cfa2a87': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/619c1a4e-42db-4549-8890-16392cfa2a87.JPG',
  'c24659e9-b473-4ecd-97e7-a90526d23502': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c24659e9-b473-4ecd-97e7-a90526d23502.JPG',
  '11328db1-559f-4dcf-9024-9aef18435700': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/11328db1-559f-4dcf-9024-9aef18435700.JPG',
  '4eed809d-9437-48d5-935e-cf8b4aa8024a': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/4eed809d-9437-48d5-935e-cf8b4aa8024a.png',
  '82b62449-5046-455f-af7b-da8e5dbc6327': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/82b62449-5046-455f-af7b-da8e5dbc6327.JPG',
  'be61d066-5707-4763-8d8c-16d19597dc3a': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/be61d066-5707-4763-8d8c-16d19597dc3a.JPG',
  '2a2fa0cd-d301-46ec-9965-2e4ea3692181': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/2a2fa0cd-d301-46ec-9965-2e4ea3692181.jpeg',
  'b5719097-187d-4804-8b7f-e84cc1ec9ad5': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/b5719097-187d-4804-8b7f-e84cc1ec9ad5.JPG',
  'bdcc27cd-40ae-456e-a340-633ce7da08c0': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/bdcc27cd-40ae-456e-a340-633ce7da08c0.JPG',
  '7a1645d8-75fe-498c-a2e9-f1057ff3521f': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/7a1645d8-75fe-498c-a2e9-f1057ff3521f.JPG',
  'a71697a2-bf8e-4967-8190-2e3e2d01f150': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/a71697a2-bf8e-4967-8190-2e3e2d01f150.JPG',
  'f36d35a3-aa9c-4bd6-9b1a-ca1dd4326e3f': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/f36d35a3-aa9c-4bd6-9b1a-ca1dd4326e3f.JPG',
  'd6602109-ad3e-4db6-ab4a-2984dadfc569': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/d6602109-ad3e-4db6-ab4a-2984dadfc569.JPG',
  '6a5bfaa9-fdf0-4b0e-aad3-79266444604f': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/6a5bfaa9-fdf0-4b0e-aad3-79266444604f.JPG',
  'cd2d8fda-0029-4280-a9a1-c23ed5c4f9ad': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/cd2d8fda-0029-4280-a9a1-c23ed5c4f9ad.JPG',
  'cfca6d0e-d02e-479f-8fdf-8d1c3cd37d38': 'https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/cfca6d0e-d02e-479f-8fdf-8d1c3cd37d38.JPG'
};

// Estado global para rotación entre servicios
let globalRotationState = {
  soprano: 'fior-daliza',
  lastServiceId: ''
};

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

  // Función para obtener la formación correcta según las reglas
  const getGroupFormation = (groupName: string, serviceTime: string, directorName: string, serviceId: string) => {
    const groupConfig = BASE_GROUP_CONFIG[groupName as keyof typeof BASE_GROUP_CONFIG];
    if (!groupConfig) return [];

    // REGLA: Grupo de Keyla tiene formación fija
    if (groupName === 'Grupo de Keyla') {
      return groupConfig.base_members.map((member, index) => ({
        ...member,
        mic: `Micrófono #${index + 1}`,
        photo_url: PHOTO_URLS[member.id as keyof typeof PHOTO_URLS]
      }));
    }

    // REGLA: Asignar corista varón según grupo y horario (SIEMPRE en micrófono #3)
    let maleSinger;
    if (groupName === 'Grupo de Massy') {
      maleSinger = serviceTime === '08:00' 
        ? ROTATIVE_SINGERS.male.find(s => s.name === 'Guarionex Garcia')
        : ROTATIVE_SINGERS.male.find(s => s.name === 'Fredderid Abrahan Valera Montoya');
    } else if (groupName === 'Grupo de Aleida') {
      maleSinger = serviceTime === '08:00'
        ? ROTATIVE_SINGERS.male.find(s => s.name === 'Armando Noel Charle')
        : ROTATIVE_SINGERS.male.find(s => s.name === 'Felix Nicolas Peralta Hernandez');
    }

    // REGLA: No duplicación - si el corista es el director, buscar alternativo
    if (maleSinger && maleSinger.name === directorName) {
      maleSinger = ROTATIVE_SINGERS.male.find(s => 
        s.name !== directorName && 
        !s.is_director
      ) || ROTATIVE_SINGERS.male.find(s => s.name !== directorName);
    }

    // REGLA: Rotación de sopranos (Ashley y Fior Daliza) - NO pueden estar juntas
    // Solo rotar si este es un servicio nuevo
    if (serviceId !== globalRotationState.lastServiceId) {
      globalRotationState.soprano = globalRotationState.soprano === 'ashley' ? 'fior-daliza' : 'ashley';
      globalRotationState.lastServiceId = serviceId;
    }

    const availableSoprano = globalRotationState.soprano === 'ashley' 
      ? ROTATIVE_SINGERS.female.find(s => s.id === 'cd2d8fda-0029-4280-a9a1-c23ed5c4f9ad')
      : ROTATIVE_SINGERS.female.find(s => s.id === '8cebc294-ea61-40d0-9b04-08d7d474332c');

    // Para Grupos Aleida y Massy, construir formación dinámica
    let finalFormation = [];
    let micNumber = 1;

    // REGLA: Para Grupo de Aleida
    if (groupName === 'Grupo de Aleida') {
      // Micrófono #1: Aleida (soprano fija)
      const aleida = groupConfig.base_members.find(m => m.name === 'Aleida Geomar Batista Ventura');
      if (aleida) {
        finalFormation.push({
          ...aleida,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[aleida.id as keyof typeof PHOTO_URLS]
        });
        micNumber++;
      }

      // Micrófono #2: Eliabi (soprano fija)
      const eliabi = groupConfig.base_members.find(m => m.name === 'Eliabi Joana Sierra Castillo');
      if (eliabi) {
        finalFormation.push({
          ...eliabi,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[eliabi.id as keyof typeof PHOTO_URLS]
        });
        micNumber++;
      }

      // Micrófono #3: SIEMPRE el corista varón
      if (maleSinger) {
        finalFormation.push({
          ...maleSinger,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[maleSinger.id as keyof typeof PHOTO_URLS]
        });
        micNumber++;
      }

      // Micrófono #4: Ruth Esmailin (contralto fija)
      const ruth = groupConfig.base_members.find(m => m.name === 'Ruth Esmailin Ramirez');
      if (ruth) {
        finalFormation.push({
          ...ruth,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[ruth.id as keyof typeof PHOTO_URLS]
        });
        micNumber++;
      }

      // Micrófono #5: Fior Daliza o Ashley (según rotación)
      if (availableSoprano) {
        finalFormation.push({
          ...availableSoprano,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[availableSoprano.id as keyof typeof PHOTO_URLS]
        });
      }
    }

    // REGLA: Para Grupo de Massy
    else if (groupName === 'Grupo de Massy') {
      // Micrófono #1: Damaris (soprano fija)
      const damaris = groupConfig.base_members.find(m => m.name === 'Damaris Castillo Jimenez');
      if (damaris) {
        finalFormation.push({
          ...damaris,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[damaris.id as keyof typeof PHOTO_URLS]
        });
        micNumber++;
      }

      // Micrófono #2: Jisell (soprano fija)
      const jisell = groupConfig.base_members.find(m => m.name === 'Jisell Amada Mauricio Paniagua');
      if (jisell) {
        finalFormation.push({
          ...jisell,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[jisell.id as keyof typeof PHOTO_URLS]
        });
        micNumber++;
      }

      // Micrófono #3: SIEMPRE el corista varón
      if (maleSinger) {
        finalFormation.push({
          ...maleSinger,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[maleSinger.id as keyof typeof PHOTO_URLS]
        });
        micNumber++;
      }

      // Micrófono #4: Rosely (contralto fija)
      const roselly = groupConfig.base_members.find(m => m.name === 'Rosely Montero');
      if (roselly) {
        finalFormation.push({
          ...roselly,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[roselly.id as keyof typeof PHOTO_URLS]
        });
        micNumber++;
      }

      // Micrófono #5: Rodes (contralto fija)
      const rodes = groupConfig.base_members.find(m => m.name === 'Rodes Esther Santana Cuesta');
      if (rodes) {
        finalFormation.push({
          ...rodes,
          mic: `Micrófono #${micNumber}`,
          photo_url: PHOTO_URLS[rodes.id as keyof typeof PHOTO_URLS]
        });
      }
    }

    return finalFormation;
  };

  // Resto del código se mantiene igual hasta la función fetchWeekendServices...
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
      const formattedServices = metadata.services.map((service: any) => {
        const groupName = service.group || 'Grupo de Alabanza';
        const serviceTime = service.time === '8:00 a.m.' ? '08:00' : '10:45';
        const formation = getGroupFormation(groupName, serviceTime, service.director?.name, service.id);
        
        return {
          id: service.id || Date.now().toString(),
          service_date: metadata.service_date,
          title: `${service.time === '8:00 a.m.' ? 'Primer Servicio - 8:00 AM' : 'Segundo Servicio - 10:45 AM'}`,
          leader: service.director?.name || service.director || 'Por asignar',
          service_type: 'regular',
          location: 'Templo Principal',
          special_activity: metadata.special_event || null,
          worship_groups: {
            id: '1',
            name: groupName,
            color_theme: BASE_GROUP_CONFIG[groupName as keyof typeof BASE_GROUP_CONFIG]?.color_theme || '#3B82F6'
          },
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
            ...formation.map((member, index) => ({
              id: `member-${service.time}-${index}`,
              user_id: member.id,
              instrument: `${member.voice} - ${member.mic}`,
              is_leader: member.is_director || false,
              profiles: {
                id: member.id,
                full_name: member.name,
                photo_url: member.photo_url
              }
            }))
          ],
          selected_songs: (service.songs || []).map((song: any) => ({
            id: song.id || `song-${Date.now()}-${Math.random()}`,
            title: song.title || 'Sin título',
            artist: song.artist || 'Artista desconocido',
            song_order: song.song_order || 0
          }))
        };
      });
      
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
    
    let targetSunday: Date;
    
    if (currentDay === 0) {
      if (currentHour < 12) {
        targetSunday = new Date(now);
        targetSunday.setHours(0, 0, 0, 0);
      } else {
        targetSunday = new Date(now);
        targetSunday.setDate(now.getDate() + 7);
        targetSunday.setHours(0, 0, 0, 0);
      }
    } else {
      const daysUntilSunday = (7 - currentDay) % 7 || 7;
      targetSunday = new Date(now);
      targetSunday.setDate(now.getDate() + daysUntilSunday);
      targetSunday.setHours(0, 0, 0, 0);
    }
    
    const friday = new Date(targetSunday);
    friday.setDate(targetSunday.getDate() - 2);
    friday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(targetSunday);
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
            let directorProfile: any = null;

            // Buscar director por nombre en la tabla members
            if (service.leader) {
              const { data: exactMatch } = await supabase
                .from('members')
                .select('id, nombres, apellidos, photo_url')
                .eq('is_active', true);

              if (exactMatch && exactMatch.length > 0) {
                const leaderName = service.leader.trim().toLowerCase();
                const matchedMember = exactMatch.find(m => {
                  const fullName = `${m.nombres || ''} ${m.apellidos || ''}`.trim().toLowerCase();
                  return fullName === leaderName || 
                         fullName.includes(leaderName) ||
                         leaderName.includes(fullName);
                });

                if (matchedMember) {
                  directorProfile = {
                    id: matchedMember.id,
                    full_name: `${matchedMember.nombres || ''} ${matchedMember.apellidos || ''}`.trim(),
                    photo_url: matchedMember.photo_url
                  };
                }
              }
            }

            // Obtener miembros del grupo con la formación corregida
            const groupName = service.worship_groups?.name || 'Grupo de Alabanza';
            const serviceTime = service.title.toLowerCase().includes('8:00') ? '08:00' : '10:45';
            const formation = getGroupFormation(groupName, serviceTime, service.leader, service.id);
            
            const members = formation.map((member, index) => ({
              id: `member-${service.id}-${index}`,
              user_id: member.id,
              instrument: `${member.voice} - ${member.mic}`,
              is_leader: member.is_director || false,
              profiles: {
                id: member.id,
                full_name: member.name,
                photo_url: member.photo_url
              }
            }));

            // Si no hay director encontrado, usar el primer miembro director como líder
            if (!directorProfile) {
              const directorMember = members.find(m => m.is_leader);
              if (directorMember) {
                directorProfile = directorMember.profiles;
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
                ? { 
                    ...service.worship_groups[0],
                    color_theme: BASE_GROUP_CONFIG[groupName as keyof typeof BASE_GROUP_CONFIG]?.color_theme || '#3B82F6'
                  }  
                : {
                    id: '1',
                    name: groupName,
                    color_theme: BASE_GROUP_CONFIG[groupName as keyof typeof BASE_GROUP_CONFIG]?.color_theme || '#3B82F6'
                  }  
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

  // Resto del código (closeOverlay, handleConfirmAttendance, etc.) se mantiene igual...
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

      const service = services.find(s => s.id === serviceId);
      if (!service) {
        toast.error('No se pudo encontrar la información del servicio');
        return;
      }

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '600px';
      container.style.backgroundColor = '#ffffff';
      container.style.padding = '0';
      
      const header = document.createElement('div');
      header.style.backgroundColor = '#ffffff';
      header.style.padding = '20px 24px';
      header.style.borderBottom = '1px solid #e5e7eb';
      header.style.marginBottom = '0';
      
      const title = document.createElement('h1');
      title.textContent = 'Programa de Servicios';
      title.style.fontSize = '20px';
      title.style.fontWeight = '600';
      title.style.marginBottom = '4px';
      title.style.color = '#111827';
      
      const dateTime = document.createElement('p');
      const serviceDate = format(new Date(service.service_date), "EEEE, dd 'de' MMMM", { locale: es });
      const serviceTime = getServiceTime(service.title);
      dateTime.textContent = `${serviceDate}`;
      dateTime.style.fontSize = '14px';
      dateTime.style.fontWeight = '400';
      dateTime.style.color = '#6b7280';
      dateTime.style.textTransform = 'capitalize';
      
      header.appendChild(title);
      header.appendChild(dateTime);
      
      const contentClone = element.cloneNode(true) as HTMLElement;
      contentClone.style.backgroundColor = '#ffffff';
      contentClone.style.width = '600px';
      contentClone.style.maxWidth = '600px';
      
      const actionButtons = contentClone.querySelectorAll('.service-action-buttons');
      actionButtons.forEach(btn => btn.remove());
      
      container.appendChild(header);
      container.appendChild(contentClone);
      document.body.appendChild(container);

      const images = container.getElementsByTagName('img');
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) {
          return Promise.resolve(undefined);
        }
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn('Image failed to load:', img.src);
            resolve();
          };
          setTimeout(() => resolve(), 3000);
        });
      });

      await Promise.all(imagePromises);

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      document.body.removeChild(container);

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

  // ServiceCard component
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
          <div 
            className="w-3 h-8 rounded-full"
            style={{ 
              background: `linear-gradient(to bottom, ${service.worship_groups?.color_theme || '#3B82F6'}99, ${service.worship_groups?.color_theme || '#3B82F6'})`
            }}
          ></div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">{service.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className="text-sm font-medium px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: service.worship_groups?.color_theme || '#3B82F6' }}
              >
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
            {/* Director */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm font-semibold text-blue-800 mb-3">Director/a de Alabanza</div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border-3 border-blue-300 shadow-lg overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600">
                  <img
                    src={service.director_profile?.photo_url || directorMember?.profiles?.photo_url}
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
                    {getInitials(service.leader)}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">{service.leader}</div>
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
        <div className="service-action-buttons flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200">
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
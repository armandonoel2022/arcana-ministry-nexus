import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Calendar,
  Clock,
  Users,
  Save,
  Music,
  Download,
  Bell,
  MapPin,
  CheckCircle,
  MessageCircle,
  Mic,
  BookOpen,
  User,
  MapPin as MapPinIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, startOfWeek, endOfWeek, getDay, isWithinInterval, parseISO } from "date-fns";
import { getInactiveMemberIds, clearInactiveMembersCache } from "@/services/memberStatusService";

// Helper function to parse service dates correctly without timezone offset issues
// service_date comes as "2026-02-09 12:00:00+00" from the database
// We need to extract just the date part and parse it correctly
const parseServiceDate = (dateString: string): Date => {
  if (!dateString) return new Date();
  
  // If it's an ISO string with time, use parseISO
  if (dateString.includes('T') || dateString.includes(' ')) {
    // Extract just the date part (YYYY-MM-DD) to avoid timezone issues
    const datePart = dateString.split('T')[0].split(' ')[0];
    // Parse as local date by creating date with year, month, day components
    const [year, month, day] = datePart.split('-').map(Number);
    return new Date(year, month - 1, day, 12, 0, 0); // Set to noon to avoid any edge cases
  }
  
  // If it's just a date string (YYYY-MM-DD), parse components directly
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};
import { es } from "date-fns/locale";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { createBroadcastNotification } from "@/services/notificationService";

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
  skipSaveNotification?: boolean; // Si es true, no guarda en BD (ya existe)
  onClose?: () => void;
  onOpenChat?: (initialMessage?: string) => void;
  onNavigate?: (path: string) => void;
}

// IDs de miembros especiales
const MEMBER_IDS = {
  // Directores que pueden hacer coros intercalados
  FELIX_NICOLAS: "3d75bc74-76bb-454a-b3e0-d6e4de45d577",
  ARMANDO_NOEL: "d6602109-ad3e-4db6-ab4a-2984dadfc569",
  GUARIONEX_GARCIA: "a71697a2-bf8e-4967-8190-2e3e2d01f150",
  FREDDERID_ABRAHAN: "7a1645d8-75fe-498c-a2e9-f1057ff3521f",
  DENNY_ALBERTO: "6a5bfaa9-fdf0-4b0e-aad3-79266444604f",
  ARIZONI_LIRIANO: "4eed809d-9437-48d5-935e-cf8b4aa8024a",

  // Solo disponibles a las 8:00 AM
  MARIA_SANTANA: "1d5866c9-cdc1-439e-976a-2d2e6a5aef80",

  // Miembros fijos
  ROSELY_MONTERO: "2a2fa0cd-d301-46ec-9965-2e4ea3692181",
  ALEIDA_BATISTA: "00a916a8-ab94-4cc0-81ae-668dd6071416",
  ELIABI_JOANA: "c4089748-7168-4472-8e7c-bf44b4355906",
  FIOR_DALIZA: "8cebc294-ea61-40d0-9b04-08d7d474332c",
  RUTH_ESMAILIN: "619c1a4e-42db-4549-8890-16392cfa2a87",
  KEYLA_YANIRA: "c24659e9-b473-4ecd-97e7-a90526d23502",
  YINDHIA_CAROLINA: "11328db1-559f-4dcf-9024-9aef18435700",
  AIDA_LORENA: "82b62449-5046-455f-af7b-da8e5dbc6327",
  SUGEY_GONZALEZ: "be61d066-5707-4763-8d8c-16d19597dc3a",
  DAMARIS_CASTILLO: "cfca6d0e-d02e-479f-8fdf-8d1c3cd37d38",
  JISELL_AMADA: "b5719097-187d-4804-8b7f-e84cc1ec9ad5",
  RODES_ESTHER: "bdcc27cd-40ae-456e-a340-633ce7da08c0",
};

// Información completa de todos los miembros
const ALL_MEMBERS = {
  [MEMBER_IDS.ALEIDA_BATISTA]: {
    name: "Aleida Geomar Batista Ventura",
    voice: "Soprano",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/00a916a8-ab94-4cc0-81ae-668dd6071416.JPG",
  },
  [MEMBER_IDS.ELIABI_JOANA]: {
    name: "Eliabi Joana Sierra Castillo",
    voice: "Soprano",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c4089748-7168-4472-8e7c-bf44b4355906.JPG",
  },
  [MEMBER_IDS.FELIX_NICOLAS]: {
    name: "Félix Nicolás Peralta Hernández",
    voice: "Tenor",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/f36d35a3-aa9c-4bd6-9b1a-ca1dd4326e3f.JPG",
  },
  [MEMBER_IDS.ARMANDO_NOEL]: {
    name: "Armando Noel Charle",
    voice: "Tenor",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/d6602109-ad3e-4db6-ab4a-2984dadfc569.JPG",
  },
  [MEMBER_IDS.FIOR_DALIZA]: {
    name: "Fior Daliza Paniagua",
    voice: "Contralto",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/8cebc294-ea61-40d0-9b04-08d7d474332c.JPG",
  },
  [MEMBER_IDS.RUTH_ESMAILIN]: {
    name: "Ruth Esmailin Ramirez",
    voice: "Contralto",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/619c1a4e-42db-4549-8890-16392cfa2a87.JPG",
  },
  [MEMBER_IDS.KEYLA_YANIRA]: {
    name: "Keyla Yanira Medrano Medrano",
    voice: "Soprano",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/c24659e9-b473-4ecd-97e7-a90526d23502.JPG",
  },
  [MEMBER_IDS.YINDHIA_CAROLINA]: {
    name: "Yindhia Carolina Santana Castillo",
    voice: "Soprano",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/11328db1-559f-4dcf-9024-9aef18435700.JPG",
  },
  [MEMBER_IDS.ARIZONI_LIRIANO]: {
    name: "Arizoni Liriano Medina",
    voice: "Bajo",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/4eed809d-9437-48d5-935e-cf8b4aa8024a.png",
  },
  [MEMBER_IDS.DENNY_ALBERTO]: {
    name: "Denny Alberto Santana",
    voice: "Bajo",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/6a5bfaa9-fdf0-4b0e-aad3-79266444604f.JPG",
  },
  [MEMBER_IDS.AIDA_LORENA]: {
    name: "Aida Lorena Pacheco De Santana",
    voice: "Contralto",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/82b62449-5046-455f-af7b-da8e5dbc6327.JPG",
  },
  [MEMBER_IDS.SUGEY_GONZALEZ]: {
    name: "Sugey A. González Garó",
    voice: "Contralto",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/be61d066-5707-4763-8d8c-16d19597dc3a.JPG",
  },
  [MEMBER_IDS.DAMARIS_CASTILLO]: {
    name: "Damaris Castillo Jimenez",
    voice: "Soprano",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/cfca6d0e-d02e-479f-8fdf-8d1c3cd37d38.JPG",
  },
  [MEMBER_IDS.JISELL_AMADA]: {
    name: "Jisell Amada Mauricio Paniagua",
    voice: "Soprano",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/b5719097-187d-4804-8b7f-e84cc1ec9ad5.JPG",
  },
  [MEMBER_IDS.GUARIONEX_GARCIA]: {
    name: "Guarionex Garcia",
    voice: "Tenor",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/a71697a2-bf8e-4967-8190-2e3e2d01f150.JPG",
  },
  [MEMBER_IDS.FREDDERID_ABRAHAN]: {
    name: "Fredderid Abrahan Valera Montoya",
    voice: "Tenor",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/7a1645d8-75fe-498c-a2e9-f1057ff3521f.JPG",
  },
  [MEMBER_IDS.MARIA_SANTANA]: {
    name: "Maria del A. Santana",
    voice: "Contralto",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/1d5866c9-cdc1-439e-976a-2d2e6a5aef80.jpeg",
  },
  [MEMBER_IDS.ROSELY_MONTERO]: {
    name: "Rosely Montero",
    voice: "Contralto",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/2a2fa0cd-d301-46ec-9965-2e4ea3692181.jpeg",
  },
  [MEMBER_IDS.RODES_ESTHER]: {
    name: "Rodes Esther Santana Cuesta",
    voice: "Contralto",
    photo_url:
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/bdcc27cd-40ae-456e-a340-633ce7da08c0.JPG",
  },
};

// Configuración de grupos con lógica dinámica
const GROUP_CONFIG = {
  "Grupo de Aleida": {
    color_theme: "#3B82F6",
  },
  "Grupo de Keyla": {
    color_theme: "#8B5CF6",
  },
  "Grupo de Massy": {
    color_theme: "#EC4899",
  },
};

// Helper function to get service time from title - moved outside component for use in createServiceAgendaNotification
// IMPORTANTE: El título tiene prioridad sobre el service_type para determinar la hora
const getServiceTime = (serviceTitle: string, serviceType?: string): string => {
  const titleLower = serviceTitle.toLowerCase();
  
  // Primero verificar el título - tiene prioridad
  if (
    titleLower.includes("primera") ||
    titleLower.includes("8:00") ||
    titleLower.includes("08:00") ||
    titleLower.includes("primer")
  ) {
    return "8:00 AM";
  } else if (
    titleLower.includes("segunda") ||
    titleLower.includes("10:45") ||
    titleLower.includes("segundo")
  ) {
    return "10:45 AM";
  } else if (
    titleLower.includes("9:00") ||
    titleLower.includes("09:00")
  ) {
    return "9:00 AM";
  } else if (
    titleLower.includes("7:00") ||
    titleLower.includes("07:00") ||
    titleLower.includes("oración")
  ) {
    return "7:00 PM";
  }
  
  // Si el título no da pistas, usar el tipo de servicio como fallback
  // Solo para servicios de cuarentena entre semana (miércoles/sábado)
  if (serviceType === 'cuarentena' && !titleLower.includes("a.m.")) {
    return "7:00 PM";
  }
  
  return serviceTitle;
};

// Función para crear notificación en el centro de notificaciones
const createServiceAgendaNotification = async (services: WeekendService[]) => {
  try {
    console.log("🎯 Creando notificación de agenda para", services.length, "servicios");

    const serviceDate = format(parseServiceDate(services[0].service_date), "EEEE, dd 'de' MMMM", { locale: es });
    const title = `Agenda de Servicios - ${serviceDate}`;

    // Crear mensaje RESUMIDO para push notifications
    // Usamos las horas correctas: primer servicio 08:00, segundo 10:45
    let message = "";
    services.forEach((service, index) => {
      const serviceTime = index === 0 ? "08:00 AM" : "10:45 AM";
      const director = service.leader || "Por asignar";
      const groupName = service.worship_groups?.name || "Grupo de Alabanza";
      
      message += `⏰ ${serviceTime}: ${director} (${groupName})`;
      if (index < services.length - 1) message += "\n";
    });

    // Crear metadata LIMPIA para el centro de notificaciones
    // Sin IDs innecesarios, con horas correctas
    const metadata = {
      service_date: services[0].service_date,
      total_services: services.length,
      // Info para push notifications del sistema (Android/iOS)
      push_config: {
        icon: "/arcana-notification-icon.png",
        badge: "/arcana-notification-icon.png",
        tag: "arcana-service-agenda",
        click_action: "/agenda-ministerial",
      },
      // Servicios con info consolidada
      services_info: services.map((service, index) => ({
        // Sin ID - no es útil para el usuario
        time: index === 0 ? "08:00 AM" : "10:45 AM", // Horas correctas
        director: service.leader || "Por asignar",
        group_name: service.worship_groups?.name || "Grupo de Alabanza",
        group_color: service.worship_groups?.color_theme || "#3B82F6",
        special_activity: service.special_activity,
        songs: service.selected_songs?.map((song) => ({
          title: song.title,
          artist: song.artist,
        })) || [],
      })),
    };

    // Usar el servicio unificado de notificaciones
    const result = await createBroadcastNotification({
      type: "service_overlay",
      title: title,
      message: message,
      category: "agenda",
      priority: 2,
      metadata: metadata,
      showOverlay: false,
      sendNativePush: false,
    });

    if (!result.success) {
      console.error("❌ Error creando notificación de agenda:", result.error);
      console.log("⚠️ El overlay se muestra aunque la persistencia falló");
      return null;
    } else {
      console.log("✅ Notificación de agenda creada exitosamente:", result.notificationId);
      toast.success("Agenda registrada en notificaciones");
      return { id: result.notificationId };
    }
  } catch (error) {
    console.error("❌ Error en createServiceAgendaNotification:", error);
    console.log("⚠️ El overlay se muestra aunque la persistencia falló");
    return null;
  }
};

// Crear una notificación RESUMIDA para el PRÓXIMO servicio (lo que se muestra en el centro de notificaciones)
const createNextServiceNotification = async (services: WeekendService[]) => {
  try {
    if (!services || services.length === 0) return null;

    // Elegir el próximo servicio por fecha
    const nextService = [...services].sort(
      (a, b) => parseServiceDate(a.service_date).getTime() - parseServiceDate(b.service_date).getTime(),
    )[0];

    const serviceDate = format(parseServiceDate(nextService.service_date), "EEEE, dd 'de' MMMM", { locale: es });
    const leader = nextService.leader || "Por asignar";
    const groupName = nextService.worship_groups?.name || "Grupo de Alabanza";

    const title = `Próximo servicio: ${serviceDate}`;
    const message = `Dirige: ${leader}\nCoros: ${groupName}`;

    const metadata = {
      service_date: nextService.service_date,
      leader,
      group_name: groupName,
      service_id: nextService.id,
      services_info: services.map((s) => ({
        id: s.id,
        service_date: s.service_date,
        director: s.leader,
        group_name: s.worship_groups?.name,
      })),
    };

    const result = await createBroadcastNotification({
      type: "service_overlay",
      title,
      message,
      category: "agenda",
      priority: 2,
      metadata,
      showOverlay: false,
      sendNativePush: false,
    });

    if (!result.success) {
      console.error("❌ Error creando notificación de próximo servicio:", result.error);
      return null;
    }

    console.log("✅ Notificación de próximo servicio creada:", result.notificationId);
    return { id: result.notificationId };
  } catch (error) {
    console.error("❌ Error en createNextServiceNotification:", error);
    return null;
  }
};

// Función para cargar miembros inactivos (siempre usa el servicio con caché propio)
const loadInactiveMemberIds = async (): Promise<Set<string>> => {
  const inactiveIds = await getInactiveMemberIds();
  console.log("📋 Miembros inactivos cargados:", inactiveIds.size, [...inactiveIds]);
  return inactiveIds;
};

// Función COMPLEJA para determinar miembros del grupo basado en todas las reglas
const getGroupMembersRaw = (
  groupName: string,
  serviceTime: string,
  director: string,
  previousService?: { director: string; time: string },
  nextService?: { director: string; time: string },
) => {
  const is8AM = serviceTime.includes("8:00") || serviceTime.includes("8 AM") || serviceTime.includes("primer");
  const is1045AM = serviceTime.includes("10:45") || serviceTime.includes("segundo");

  // Normalizar nombre del director para comparaciones
  const normalizeDirectorName = (name: string) => {
    return name.toLowerCase().trim();
  };

  const directorLower = normalizeDirectorName(director);
  const prevDirectorLower = previousService ? normalizeDirectorName(previousService.director) : "";
  const nextDirectorLower = nextService ? normalizeDirectorName(nextService.director) : "";

  // Detectar quién es el director actual
  const isFelix =
    directorLower.includes("félix") ||
    directorLower.includes("felix") ||
    directorLower.includes("nicolás") ||
    directorLower.includes("nicolas");
  const isArmando = directorLower.includes("armando") || directorLower.includes("noel");
  const isGuarionex = directorLower.includes("guarionex") || directorLower.includes("garcia");
  const isDenny = directorLower.includes("denny") || directorLower.includes("alberto");

  // Detectar quién dirigió en servicio anterior/siguiente
  const felixInPrevOrNext =
    prevDirectorLower.includes("félix") ||
    prevDirectorLower.includes("felix") ||
    nextDirectorLower.includes("félix") ||
    nextDirectorLower.includes("felix");
  const armandoInPrevOrNext = prevDirectorLower.includes("armando") || nextDirectorLower.includes("armando");
  const guarionexInPrevOrNext = prevDirectorLower.includes("guarionex") || nextDirectorLower.includes("guarionex");
  const dennyInPrevOrNext = prevDirectorLower.includes("denny") || nextDirectorLower.includes("denny");

  if (groupName === "Grupo de Aleida") {
    // GRUPO DE ALEIDA: Felix Nicolas o Armando Noel intercalan
    // Si uno es director, no hace coros. Y tampoco hace coros si dirigió antes/después
    let mic3Member = MEMBER_IDS.ARMANDO_NOEL; // Default Armando

    if (isFelix || felixInPrevOrNext) {
      // Si Felix es director o dirigió antes/después, Armando hace coros
      mic3Member = MEMBER_IDS.ARMANDO_NOEL;
    } else if (isArmando || armandoInPrevOrNext) {
      // Si Armando es director o dirigió antes/después, Felix hace coros
      mic3Member = MEMBER_IDS.FELIX_NICOLAS;
    } else {
      // Si ninguno es director, alternar basado en hora
      mic3Member = is8AM ? MEMBER_IDS.FELIX_NICOLAS : MEMBER_IDS.ARMANDO_NOEL;
    }

    return [
      {
        id: MEMBER_IDS.ALEIDA_BATISTA,
        name: ALL_MEMBERS[MEMBER_IDS.ALEIDA_BATISTA].name,
        voice: ALL_MEMBERS[MEMBER_IDS.ALEIDA_BATISTA].voice,
        role: "Corista",
        mic: "Micrófono #2",
        photo_url: ALL_MEMBERS[MEMBER_IDS.ALEIDA_BATISTA].photo_url,
      },
      {
        id: MEMBER_IDS.ELIABI_JOANA,
        name: ALL_MEMBERS[MEMBER_IDS.ELIABI_JOANA].name,
        voice: ALL_MEMBERS[MEMBER_IDS.ELIABI_JOANA].voice,
        role: "Directora de Alabanza",
        mic: "Micrófono #1",
        photo_url: ALL_MEMBERS[MEMBER_IDS.ELIABI_JOANA].photo_url,
      },
      {
        id: mic3Member,
        name: ALL_MEMBERS[mic3Member].name,
        voice: ALL_MEMBERS[mic3Member].voice,
        role: "Director de Alabanza",
        mic: "Micrófono #3",
        photo_url: ALL_MEMBERS[mic3Member].photo_url,
      },
      {
        id: MEMBER_IDS.FIOR_DALIZA,
        name: ALL_MEMBERS[MEMBER_IDS.FIOR_DALIZA].name,
        voice: ALL_MEMBERS[MEMBER_IDS.FIOR_DALIZA].voice,
        role: "Corista",
        mic: "Micrófono #4",
        photo_url: ALL_MEMBERS[MEMBER_IDS.FIOR_DALIZA].photo_url,
      },
      {
        id: MEMBER_IDS.RUTH_ESMAILIN,
        name: ALL_MEMBERS[MEMBER_IDS.RUTH_ESMAILIN].name,
        voice: ALL_MEMBERS[MEMBER_IDS.RUTH_ESMAILIN].voice,
        role: "Corista",
        mic: "Micrófono #5",
        photo_url: ALL_MEMBERS[MEMBER_IDS.RUTH_ESMAILIN].photo_url,
      },
    ];
  }

  if (groupName === "Grupo de Keyla") {
    // GRUPO DE KEYLA: Arizoni o Denny Alberto intercalan
    let mic3Member = MEMBER_IDS.ARIZONI_LIRIANO; // Default Arizoni

    if (isDenny || dennyInPrevOrNext) {
      // Si Denny es director o dirigió antes/después, Arizoni hace coros
      mic3Member = MEMBER_IDS.ARIZONI_LIRIANO;
    } else {
      // Si Denny no está dirigiendo, alternar
      mic3Member = is8AM ? MEMBER_IDS.DENNY_ALBERTO : MEMBER_IDS.ARIZONI_LIRIANO;
    }

    return [
      {
        id: MEMBER_IDS.KEYLA_YANIRA,
        name: ALL_MEMBERS[MEMBER_IDS.KEYLA_YANIRA].name,
        voice: ALL_MEMBERS[MEMBER_IDS.KEYLA_YANIRA].voice,
        role: "Directora de Alabanza",
        mic: "Micrófono #2",
        photo_url: ALL_MEMBERS[MEMBER_IDS.KEYLA_YANIRA].photo_url,
      },
      {
        id: MEMBER_IDS.YINDHIA_CAROLINA,
        name: ALL_MEMBERS[MEMBER_IDS.YINDHIA_CAROLINA].name,
        voice: ALL_MEMBERS[MEMBER_IDS.YINDHIA_CAROLINA].voice,
        role: "Corista",
        mic: "Micrófono #1",
        photo_url: ALL_MEMBERS[MEMBER_IDS.YINDHIA_CAROLINA].photo_url,
      },
      {
        id: mic3Member,
        name: ALL_MEMBERS[mic3Member].name,
        voice: ALL_MEMBERS[mic3Member].voice,
        role: isDenny && mic3Member === MEMBER_IDS.DENNY_ALBERTO ? "Director de Alabanza" : "Corista",
        mic: "Micrófono #3",
        photo_url: ALL_MEMBERS[mic3Member].photo_url,
      },
      {
        id: MEMBER_IDS.AIDA_LORENA,
        name: ALL_MEMBERS[MEMBER_IDS.AIDA_LORENA].name,
        voice: ALL_MEMBERS[MEMBER_IDS.AIDA_LORENA].voice,
        role: "Corista",
        mic: "Micrófono #4",
        photo_url: ALL_MEMBERS[MEMBER_IDS.AIDA_LORENA].photo_url,
      },
      {
        id: MEMBER_IDS.SUGEY_GONZALEZ,
        name: ALL_MEMBERS[MEMBER_IDS.SUGEY_GONZALEZ].name,
        voice: ALL_MEMBERS[MEMBER_IDS.SUGEY_GONZALEZ].voice,
        role: "Corista",
        mic: "Micrófono #5",
        photo_url: ALL_MEMBERS[MEMBER_IDS.SUGEY_GONZALEZ].photo_url,
      },
    ];
  }

  if (groupName === "Grupo de Massy") {
    // GRUPO DE MASSY: Lógica compleja para 8:00 AM vs 10:45 AM
    let mic3Member = MEMBER_IDS.FREDDERID_ABRAHAN;
    let mic4Member = MEMBER_IDS.ROSELY_MONTERO;

    // Detectar si Maria Del A. Pérez Santana dirige en el otro servicio del día
    // Si ella dirige a las 10:45, no puede estar en las 8:00 (va con Guarionex)
    const mariaDirectsOtherService = 
      (prevDirectorLower.includes("maria") && prevDirectorLower.includes("santana")) ||
      (nextDirectorLower.includes("maria") && nextDirectorLower.includes("santana")) ||
      prevDirectorLower.includes("pérez santana") ||
      nextDirectorLower.includes("pérez santana");

    if (is8AM) {
      if (mariaDirectsOtherService) {
        // Si Maria dirige en el otro servicio (10:45), ella y Guarionex van juntos allá
        // En las 8:00 AM deben estar Abrahan Valera y Rosely Montero
        mic3Member = MEMBER_IDS.FREDDERID_ABRAHAN; // Abrahan Valera
        mic4Member = MEMBER_IDS.ROSELY_MONTERO;
      } else {
        // Comportamiento normal: Maria y Guarionex van a las 8:00 AM
        mic4Member = MEMBER_IDS.MARIA_SANTANA;

        if (isGuarionex || guarionexInPrevOrNext) {
          // Si Guarionex es director o dirigió antes/después, Fredderid hace coros
          mic3Member = MEMBER_IDS.FREDDERID_ABRAHAN;
        } else {
          // Si Guarionex no es director, él hace coros a las 8 AM
          mic3Member = MEMBER_IDS.GUARIONEX_GARCIA;
        }
      }
    } else if (is1045AM) {
      if (mariaDirectsOtherService || 
          directorLower.includes("maria") || 
          directorLower.includes("pérez santana")) {
        // Si Maria dirige este servicio, ella y Guarionex vienen aquí
        // Maria como directora no va en los coros
        mic3Member = MEMBER_IDS.GUARIONEX_GARCIA;
        mic4Member = MEMBER_IDS.ROSELY_MONTERO;
      } else {
        // Comportamiento normal: Rosely y Fredderid a las 10:45 AM
        mic4Member = MEMBER_IDS.ROSELY_MONTERO;
        mic3Member = MEMBER_IDS.FREDDERID_ABRAHAN;
      }
    }

    return [
      {
        id: MEMBER_IDS.DAMARIS_CASTILLO,
        name: ALL_MEMBERS[MEMBER_IDS.DAMARIS_CASTILLO].name,
        voice: ALL_MEMBERS[MEMBER_IDS.DAMARIS_CASTILLO].voice,
        role: "Directora de Alabanza",
        mic: "Micrófono #2",
        photo_url: ALL_MEMBERS[MEMBER_IDS.DAMARIS_CASTILLO].photo_url,
      },
      {
        id: MEMBER_IDS.JISELL_AMADA,
        name: ALL_MEMBERS[MEMBER_IDS.JISELL_AMADA].name,
        voice: ALL_MEMBERS[MEMBER_IDS.JISELL_AMADA].voice,
        role: "Corista",
        mic: "Micrófono #1",
        photo_url: ALL_MEMBERS[MEMBER_IDS.JISELL_AMADA].photo_url,
      },
      {
        id: mic3Member,
        name: ALL_MEMBERS[mic3Member].name,
        voice: ALL_MEMBERS[mic3Member].voice,
        role: "Corista",
        mic: "Micrófono #3",
        photo_url: ALL_MEMBERS[mic3Member].photo_url,
      },
      {
        id: mic4Member,
        name: ALL_MEMBERS[mic4Member].name,
        voice: ALL_MEMBERS[mic4Member].voice,
        role: "Corista",
        mic: "Micrófono #4",
        photo_url: ALL_MEMBERS[mic4Member].photo_url,
      },
      {
        id: MEMBER_IDS.RODES_ESTHER,
        name: ALL_MEMBERS[MEMBER_IDS.RODES_ESTHER].name,
        voice: ALL_MEMBERS[MEMBER_IDS.RODES_ESTHER].voice,
        role: "Corista",
        mic: "Micrófono #5",
        photo_url: ALL_MEMBERS[MEMBER_IDS.RODES_ESTHER].photo_url,
      },
    ];
  }

  // Fallback para grupos desconocidos
  return [];
};

// Función para obtener TODOS los miembros de todos los grupos (para servicios especiales)
const getAllGroupMembersRaw = (
  inactiveMemberIds?: Set<string>,
): { id: string; name: string; voice: string; role: string; mic: string; photo_url: string; group: string }[] => {
  const allMembers: { id: string; name: string; voice: string; role: string; mic: string; photo_url: string; group: string }[] = [];
  
  // Grupo de Aleida
  const aleidaMembers = [
    MEMBER_IDS.ALEIDA_BATISTA, MEMBER_IDS.ELIABI_JOANA, 
    MEMBER_IDS.FELIX_NICOLAS, MEMBER_IDS.ARMANDO_NOEL,
    MEMBER_IDS.FIOR_DALIZA, MEMBER_IDS.RUTH_ESMAILIN,
  ];
  aleidaMembers.forEach(id => {
    if (!inactiveMemberIds?.has(id)) {
      allMembers.push({
        id,
        name: ALL_MEMBERS[id]?.name || "",
        voice: ALL_MEMBERS[id]?.voice || "",
        role: "Corista",
        mic: "",
        photo_url: ALL_MEMBERS[id]?.photo_url || "",
        group: "Grupo de Aleida",
      });
    }
  });

  // Grupo de Keyla
  const keylaMembers = [
    MEMBER_IDS.KEYLA_YANIRA, MEMBER_IDS.YINDHIA_CAROLINA,
    MEMBER_IDS.ARIZONI_LIRIANO, MEMBER_IDS.DENNY_ALBERTO,
    MEMBER_IDS.AIDA_LORENA, MEMBER_IDS.SUGEY_GONZALEZ,
  ];
  keylaMembers.forEach(id => {
    if (!inactiveMemberIds?.has(id)) {
      allMembers.push({
        id,
        name: ALL_MEMBERS[id]?.name || "",
        voice: ALL_MEMBERS[id]?.voice || "",
        role: "Corista",
        mic: "",
        photo_url: ALL_MEMBERS[id]?.photo_url || "",
        group: "Grupo de Keyla",
      });
    }
  });

  // Grupo de Massy
  const massyMembers = [
    MEMBER_IDS.DAMARIS_CASTILLO, MEMBER_IDS.JISELL_AMADA,
    MEMBER_IDS.FREDDERID_ABRAHAN, MEMBER_IDS.GUARIONEX_GARCIA,
    MEMBER_IDS.ROSELY_MONTERO, MEMBER_IDS.RODES_ESTHER,
    MEMBER_IDS.MARIA_SANTANA,
  ];
  massyMembers.forEach(id => {
    if (!inactiveMemberIds?.has(id)) {
      allMembers.push({
        id,
        name: ALL_MEMBERS[id]?.name || "",
        voice: ALL_MEMBERS[id]?.voice || "",
        role: "Corista",
        mic: "",
        photo_url: ALL_MEMBERS[id]?.photo_url || "",
        group: "Grupo de Massy",
      });
    }
  });

  return allMembers;
};

// Función wrapper que filtra miembros inactivos
const getGroupMembers = (
  groupName: string,
  serviceTime: string,
  director: string,
  previousService?: { director: string; time: string },
  nextService?: { director: string; time: string },
  inactiveMemberIds?: Set<string>,
) => {
  const members = getGroupMembersRaw(groupName, serviceTime, director, previousService, nextService);
  
  // Si no hay IDs inactivos cargados, retornar todos los miembros
  if (!inactiveMemberIds || inactiveMemberIds.size === 0) {
    return members;
  }
  
  // Filtrar miembros que están en licencia
  const activeMembers = members.filter(member => {
    const isInactive = inactiveMemberIds.has(member.id);
    if (isInactive) {
      console.log(`🚫 Miembro en licencia excluido del overlay: ${member.name}`);
    }
    return !isInactive;
  });
  
  return activeMembers;
};

// Función MEJORADA para separar nombres y apellidos usando datos reales
const splitName = (fullName: string) => {
  if (!fullName) return { firstName: "", lastName: "" };

  // Buscar en ALL_MEMBERS
  const memberEntry = Object.entries(ALL_MEMBERS).find(([_, member]) => member.name === fullName);

  if (memberEntry) {
    const [_, member] = memberEntry;
    const fullName = member.name;
    const parts = fullName.split(" ");

    // Casos especiales conocidos
    if (fullName.includes("Aleida Geomar")) {
      return { firstName: "Aleida Geomar", lastName: "Batista Ventura" };
    }
    if (fullName.includes("Yindhia Carolina") || fullName.includes("Yindia Carolina")) {
      return { firstName: "Yindhia Carolina", lastName: "Santana Castillo" };
    }
    if (fullName.includes("Félix Nicolás")) {
      return { firstName: "Félix Nicolás", lastName: "Peralta Hernández" };
    }
    if (fullName.includes("Eliabi Joana")) {
      return { firstName: "Eliabi Joana", lastName: "Sierra Castillo" };
    }
    if (fullName.includes("Keyla Yanira")) {
      return { firstName: "Keyla Yanira", lastName: "Medrano Medrano" };
    }
    if (fullName.includes("Arizoni")) {
      return { firstName: "Arizoni", lastName: "Liriano Medina" };
    }
    if (fullName.includes("Aida Lorena")) {
      return { firstName: "Aida Lorena", lastName: "Pacheco De Santana" };
    }
    if (fullName.includes("Sugey A.")) {
      return { firstName: "Sugey A.", lastName: "González Garó" };
    }
    if (fullName.includes("Damaris")) {
      return { firstName: "Damaris", lastName: "Castillo Jimenez" };
    }
    if (fullName.includes("Jisell Amada")) {
      return { firstName: "Jisell Amada", lastName: "Mauricio Paniagua" };
    }
    if (fullName.includes("Fredderid Abrahan")) {
      return { firstName: "Fredderid Abrahan", lastName: "Valera Montoya" };
    }
    if (fullName.includes("Rodes Esther")) {
      return { firstName: "Rodes Esther", lastName: "Santana Cuesta" };
    }
    if (fullName.includes("Armando") && fullName.includes("Noel")) {
      return { firstName: "Armando", lastName: "Noel Charle" };
    }
    if (fullName.includes("Guarionex")) {
      return { firstName: "Guarionex", lastName: "Garcia" };
    }
    if (fullName.includes("Maria del A.") || fullName.includes("María del A.")) {
      return { firstName: "Maria del A.", lastName: "Santana" };
    }
    if (fullName.includes("Rosely")) {
      return { firstName: "Rosely", lastName: "Montero" };
    }
    if (fullName.includes("Denny")) {
      return { firstName: "Denny Alberto", lastName: "Santana" };
    }
    if (fullName.includes("Fior")) {
      return { firstName: "Fior Daliza", lastName: "Paniagua" };
    }
    if (fullName.includes("Ruth")) {
      return { firstName: "Ruth Esmailin", lastName: "Ramirez" };
    }

    // Lógica general para otros nombres
    if (parts.length === 2) {
      return { firstName: parts[0], lastName: parts[1] };
    }
    if (parts.length === 3) {
      return { firstName: parts[0], lastName: `${parts[1]} ${parts[2]}` };
    }
    if (parts.length >= 4) {
      return {
        firstName: `${parts[0]} ${parts[1]}`,
        lastName: parts.slice(2).join(" "),
      };
    }
  }

  // Fallback: usar la lógica original
  const parts = fullName.split(" ");
  if (parts.length <= 2) {
    return {
      firstName: parts[0] || "",
      lastName: parts[1] || "",
    };
  }

  const firstName = parts.slice(0, -1).join(" ");
  const lastName = parts[parts.length - 1];

  return { firstName, lastName };
};

// Función para obtener nombre completo formateado correctamente
const getFormattedName = (fullName: string) => {
  const { firstName, lastName } = splitName(fullName);

  if (!lastName) return firstName;
  if (!firstName) return lastName;

  return `${firstName} ${lastName}`;
};

// Función mejorada para separar títulos de canciones largos
const splitSongTitle = (title: string) => {
  if (!title) return { firstLine: "", secondLine: "" };

  const words = title.split(" ");

  if (words.length <= 3) {
    return {
      firstLine: title,
      secondLine: "",
    };
  }

  const splitIndex = Math.min(4, Math.ceil(words.length / 2));
  const firstLine = words.slice(0, splitIndex).join(" ");
  const secondLine = words.slice(splitIndex).join(" ");

  return { firstLine, secondLine };
};

const ServiceNotificationOverlay = ({
  forceShow = false,
  skipSaveNotification = false,
  onClose,
  onOpenChat,
  onNavigate,
}: ServiceNotificationOverlayProps = {}) => {
  const [isVisible, setIsVisible] = useState(forceShow);
  const [isAnimating, setIsAnimating] = useState(false);
  const [services, setServices] = useState<WeekendService[]>([]);
  const [isLoading, setIsLoading] = useState(!forceShow);
  const [confirmedServices, setConfirmedServices] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"services" | "preparations">("services");
  const serviceCardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [notificationCreated, setNotificationCreated] = useState(skipSaveNotification); // Si skip, ya está "creada"

  useEffect(() => {
    console.log("🎯 ServiceNotificationOverlay mounted with forceShow:", forceShow);

    // Si forceShow es true, cargar servicios inmediatamente
    if (forceShow) {
      console.log("⚡ ForceShow activado - cargando servicios del fin de semana");
      setIsLoading(true);
      setIsVisible(true);

      // Cargar servicios
      fetchWeekendServices()
        .then(() => {
          setIsLoading(false);
          // Pequeño delay para la animación
          setTimeout(() => {
            setIsAnimating(true);
            console.log("✅ Overlay activado y animado");
          }, 100);
        })
        .catch((error) => {
          console.error("❌ Error cargando servicios:", error);
          setIsLoading(false);
        });
    }
  }, [forceShow]);

  // Cuando los servicios se cargan y el overlay está activo, crear la notificación automáticamente (RESUMEN del próximo servicio)
  useEffect(() => {
    if (services.length > 0 && !notificationCreated) {
      console.log("📱 Servicios cargados, creando notificación del próximo servicio...");
      createNextServiceNotification(services);
      setNotificationCreated(true);
    }
  }, [services, notificationCreated]);

  const showServiceProgramOverlay = async (metadata: ServiceProgramNotification) => {
    if (metadata.services && Array.isArray(metadata.services)) {
      // Limpiar y recargar miembros inactivos para tener datos frescos
      clearInactiveMembersCache();
      const inactiveMemberIds = await loadInactiveMemberIds();
      
      // Primero extraer info de directores para poder pasarla como previous/next
      const servicesWithDirectorInfo = metadata.services.map((service: any) => ({
        director: service.director?.name || service.director || "Por asignar",
        time: getServiceTime(service.time || service.title),
      }));

      const formattedServices = metadata.services.map((service: any, index: number) => {
        const groupName = service.group || "Grupo de Aleida";
        const groupConfig = GROUP_CONFIG[groupName as keyof typeof GROUP_CONFIG] || GROUP_CONFIG["Grupo de Aleida"];
        const serviceTime = getServiceTime(service.time || service.title);
        const directorName = service.director?.name || service.director || "Por asignar";

        // Obtener previous y next service para evitar que el director aparezca en coros
        const previousService = index > 0 ? servicesWithDirectorInfo[index - 1] : undefined;
        const nextService = index < servicesWithDirectorInfo.length - 1 ? servicesWithDirectorInfo[index + 1] : undefined;

        // USAR LA NUEVA FUNCIÓN PARA OBTENER MIEMBROS CON CONTEXTO (filtrando inactivos)
        const members = getGroupMembers(groupName, serviceTime, directorName, previousService, nextService, inactiveMemberIds);

        return {
          id: service.id || Date.now().toString(),
          service_date: metadata.service_date,
          title: `${service.time === "8:00 a.m." ? "Primer Servicio - 8:00 AM" : "Segundo Servicio - 10:45 AM"}`,
          leader: service.director?.name || service.director || "Por asignar",
          service_type: "regular",
          location: "Templo Principal",
          special_activity: metadata.special_event || null,
          worship_groups: {
            id: "1",
            name: groupName,
            color_theme: groupConfig.color_theme,
          },
          group_members: [
            ...(service.director
              ? [
                  {
                    id: "director-" + service.time,
                    user_id: "director",
                    instrument: "Director",
                    is_leader: true,
                    profiles: {
                      id: "director",
                      full_name: service.director?.name || service.director,
                      photo_url: service.director?.photo,
                    },
                  },
                ]
              : []),
            ...members.map((member, index) => ({
              id: `member-${service.time}-${index}`,
              user_id: member.id,
              instrument: `${member.voice} • ${member.role} • ${member.mic}`,
              is_leader: false,
              profiles: {
                id: member.id,
                full_name: member.name,
                photo_url: member.photo_url,
              },
            })),
          ],
          selected_songs: (service.songs || []).map((song: any) => ({
            id: song.id || `song-${Date.now()}-${Math.random()}`,
            title: song.title || "Sin título",
            artist: song.artist || "Artista desconocido",
            song_order: song.song_order || 0,
          })),
        };
      });

      setServices(formattedServices);
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 100);

      localStorage.removeItem("serviceNotificationDismissed");
      localStorage.removeItem("serviceNotificationLastShown");
    }
  };

  // Obtener rango de servicios próximos (incluye miércoles, sábados para cuarentena)
  const getUpcomingServicesRange = () => {
    const now = new Date();
    const currentDay = getDay(now); // 0=Domingo, 1=Lunes, ..., 3=Miércoles, 6=Sábado
    const currentHour = now.getHours();

    // Buscar desde ahora (no desde medianoche, para excluir servicios ya pasados del día)
    const start = new Date(now);

    // Si es domingo después de mediodía, empezar desde mañana a las 00:00
    if (currentDay === 0 && currentHour >= 12) {
      start.setDate(start.getDate() + 1);
      start.setHours(0, 0, 0, 0);
    }

    // Durante cuarentena (enero-febrero), buscar servicios de los próximos 7 días completos
    // para incluir miércoles, sábados y domingos
    const end = new Date(now);
    end.setDate(end.getDate() + 7); // Siempre buscar 7 días adelante
    end.setHours(23, 59, 59, 999);

    console.log(`📅 Buscando servicios desde ${start.toISOString()} hasta ${end.toISOString()}`);

    return { start, end };
  };

  const fetchWeekendServices = async () => {
    try {
      const { start, end } = getUpcomingServicesRange();

      // Limpiar y recargar miembros inactivos para tener datos frescos
      clearInactiveMembersCache();
      const inactiveMemberIds = await loadInactiveMemberIds();
      console.log("📋 Miembros inactivos para filtrar:", [...inactiveMemberIds]);

      const { data, error } = await supabase
        .from("services")
        .select(
          `
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
        `,
        )
        .gte("service_date", start.toISOString())
        .lte("service_date", end.toISOString())
        .order("service_date", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        // Primero extraer info de directores para context de previous/next
        const servicesDirectorInfo = data.map((service) => ({
          director: service.leader || "Por asignar",
          time: getServiceTime(service.title),
        }));

        const servicesWithMembers = await Promise.all(
          data.map(async (service, serviceIndex) => {
            let members: any[] = [];
            let directorProfile: any = null;

            // Buscar director por nombre en la tabla members
            if (service.leader) {
              const { data: exactMatch } = await supabase
                .from("members")
                .select("id, nombres, apellidos, photo_url")
                .eq("is_active", true);

              if (exactMatch && exactMatch.length > 0) {
                const leaderName = service.leader.trim().toLowerCase();
                const matchedMember = exactMatch.find((m) => {
                  const fullName = `${m.nombres || ""} ${m.apellidos || ""}`.trim().toLowerCase();
                  return fullName === leaderName || fullName.includes(leaderName) || leaderName.includes(fullName);
                });

                if (matchedMember) {
                  directorProfile = {
                    id: matchedMember.id,
                    full_name: getFormattedName(
                      `${matchedMember.nombres || ""} ${matchedMember.apellidos || ""}`.trim(),
                    ),
                    photo_url: matchedMember.photo_url,
                  };
                } else {
                  const parts = service.leader.trim().split(/\s+/);
                  const firstWord = parts[0].toLowerCase();

                  const partialMatch = exactMatch.find((m) => {
                    const nombres = (m.nombres || "").toLowerCase();
                    const apellidos = (m.apellidos || "").toLowerCase();
                    return nombres.includes(firstWord) || apellidos.includes(firstWord);
                  });

                  if (partialMatch) {
                    directorProfile = {
                      id: partialMatch.id,
                      full_name: getFormattedName(
                        `${partialMatch.nombres || ""} ${partialMatch.apellidos || ""}`.trim(),
                      ),
                      photo_url: partialMatch.photo_url,
                    };
                  }
                }
              }
            }

            // Detectar si es un servicio especial donde participan TODOS los grupos
            const isSpecialAllGroups = 
              service.service_type === 'especial' || 
              (service.leader && service.leader.toUpperCase() === 'TODOS');

            // Obtener miembros del grupo usando la nueva función
            let groupName = "Grupo de Aleida";
            if (service.worship_groups) {
              if (Array.isArray(service.worship_groups) && service.worship_groups.length > 0) {
                groupName = (service.worship_groups[0]?.name as string) || groupName;
              } else if (typeof service.worship_groups === "object" && "name" in service.worship_groups) {
                groupName = (service.worship_groups.name as string) || groupName;
              }
            }

            const serviceTime = getServiceTime(service.title);
            const directorName = service.leader || "Por asignar";

            // Obtener previous y next service para evitar que el director aparezca en coros
            const previousService = serviceIndex > 0 ? servicesDirectorInfo[serviceIndex - 1] : undefined;
            const nextService = serviceIndex < servicesDirectorInfo.length - 1 ? servicesDirectorInfo[serviceIndex + 1] : undefined;

            if (isSpecialAllGroups) {
              // Para servicios especiales: obtener TODOS los miembros de todos los grupos
              const allMembers = getAllGroupMembersRaw(inactiveMemberIds);
              members = allMembers;
              console.log(`🌟 Servicio especial detectado: ${service.special_activity || service.title} - ${allMembers.length} miembros de todos los grupos`);
            } else {
              // USAR LA NUEVA FUNCIÓN PARA OBTENER MIEMBROS CON CONTEXTO (filtrando inactivos)
              members = getGroupMembers(groupName, serviceTime, directorName, previousService, nextService, inactiveMemberIds);
            }

            console.log(
              `Miembros finales para ${groupName} (director: ${directorName}, prev: ${previousService?.director}, next: ${nextService?.director}):`,
              members.map((m) => m.name),
            );

            // Si no hay director encontrado, usar el primer miembro como líder
            if (!directorProfile && members.length > 0) {
              directorProfile = {
                id: members[0].id,
                full_name: getFormattedName(members[0].name),
                photo_url: members[0].photo_url,
              };
            }

            let selectedSongs: any[] = [];
            const { data: songsData, error: songsError } = await supabase
              .from("service_songs")
              .select(
                `
                id,
                song_order,
                songs (
                  id,
                  title,
                  artist
                )
              `,
              )
              .eq("service_id", service.id)
              .order("song_order");

            if (!songsError && songsData && songsData.length > 0) {
              selectedSongs = songsData.map((item: any) => ({
                id: item.songs.id,
                title: item.songs.title,
                artist: item.songs.artist,
                song_order: item.song_order,
              }));
            } else {
              const { data: selectedView, error: viewError } = await supabase
                .from("service_selected_songs")
                .select("song_id, song_title, artist, selected_at")
                .eq("service_id", service.id)
                .order("selected_at", { ascending: true });
              if (!viewError && selectedView && selectedView.length > 0) {
                selectedSongs = selectedView.map((row: any, idx: number) => ({
                  id: row.song_id,
                  title: row.song_title,
                  artist: row.artist,
                  song_order: idx + 1,
                }));
              }
            }

            const groupConfig = GROUP_CONFIG[groupName as keyof typeof GROUP_CONFIG] || GROUP_CONFIG["Grupo de Aleida"];

            // Para servicios especiales, incluir info del grupo en el instrument
            const membersList = isSpecialAllGroups
              ? members.map((member: any, index: number) => ({
                  id: `member-${service.id}-${index}`,
                  user_id: member.id,
                  instrument: `${member.voice} • ${member.group}`,
                  is_leader: false,
                  profiles: {
                    id: member.id,
                    full_name: getFormattedName(member.name),
                    photo_url: member.photo_url,
                  },
                }))
              : members.map((member: any, index: number) => ({
                  id: `member-${service.id}-${index}`,
                  user_id: member.id,
                  instrument: `${member.voice} - ${member.mic}`,
                  is_leader: false,
                  profiles: {
                    id: member.id,
                    full_name: getFormattedName(member.name),
                    photo_url: member.photo_url,
                  },
                }));

            return {
              ...service,
              leader: isSpecialAllGroups ? "TODOS" : (directorProfile?.full_name || service.leader),
              group_members: membersList,
              selected_songs: selectedSongs,
              director_profile: isSpecialAllGroups ? null : directorProfile,
              worship_groups: isSpecialAllGroups
                ? {
                    id: "all",
                    name: "Todos los Grupos",
                    color_theme: "#E11D48", // Rose/red for special events
                  }
                : Array.isArray(service.worship_groups) && service.worship_groups.length > 0
                  ? {
                      ...service.worship_groups[0],
                      color_theme: groupConfig.color_theme,
                    }
                  : {
                      id: "1",
                      name: groupName,
                      color_theme: groupConfig.color_theme,
                    },
            };
          }),
        );

        setServices(servicesWithMembers as WeekendService[]);
        setIsLoading(false); // CRITICAL: Allow overlay to render
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 100);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error fetching weekend services:", error);
      setIsLoading(false);
    }
  };

  const closeOverlay = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      if (!forceShow) {
        localStorage.setItem("serviceNotificationDismissed", "true");
        localStorage.setItem("serviceNotificationLastShown", new Date().toDateString());
      }
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  const handleConfirmAttendance = async (serviceId: string) => {
    try {
      setConfirmedServices((prev) => new Set(prev).add(serviceId));

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from("service_confirmations").upsert({
          service_id: serviceId,
          user_id: user.id,
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        });

        if (error) throw error;
      }

      toast.success("Asistencia confirmada ✅");
    } catch (error) {
      console.error("Error confirmando asistencia:", error);
      toast.error("Error al confirmar asistencia");
    }
  };

  const handleAskArcana = (service: WeekendService) => {
    const message = `Necesito ayuda para prepararme para el servicio "${service.title}" del ${format(parseServiceDate(service.service_date), "EEEE, dd 'de' MMMM", { locale: es })}. ¿Qué canciones debo practicar?`;
    onOpenChat?.(message);
    closeOverlay();
  };

  const saveToNotifications = async () => {
    try {
      if (services.length === 0) {
        toast.error("No hay servicios para guardar");
        return;
      }

      // Usar la función para crear notificación
      const notification = await createServiceAgendaNotification(services);

      if (notification) {
        toast.success("Programa guardado en notificaciones");
      }

      closeOverlay();
    } catch (error) {
      console.error("Error saving notification:", error);
      toast.error("Error al guardar la notificación");
    }
  };

  // getServiceTime is now defined at module level (line ~239)

  const getInitials = (name: string) => {
    if (!name) return "NN";
    const { firstName, lastName } = splitName(name);
    const firstInitial = firstName.charAt(0) || "";
    const lastInitial = lastName.charAt(0) || "";
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const getResponsibleVoices = (members: WeekendService["group_members"]) => {
    return members.filter(
      (member) =>
        member.instrument?.toLowerCase().includes("soprano") ||
        member.instrument?.toLowerCase().includes("alto") ||
        member.instrument?.toLowerCase().includes("tenor") ||
        member.instrument?.toLowerCase().includes("bajo") ||
        member.instrument?.toLowerCase().includes("voice") ||
        member.instrument?.toLowerCase().includes("voz") ||
        member.instrument?.toLowerCase().includes("contralto") ||
        member.instrument?.toLowerCase().includes("vocals"),
    );
  };

  const downloadServiceImage = async (serviceId: string, serviceTitle: string) => {
    try {
      const service = services.find((s) => s.id === serviceId);
      if (!service) {
        toast.error("No se pudo encontrar la información del servicio");
        return;
      }

      const isQuarantine = service.service_type === 'cuarentena';
      const isSpecialEvent = service.service_type === 'especial' || service.leader === 'TODOS';

      // Crear un contenedor específico para la descarga
      const container = document.createElement("div");
      container.style.width = "600px";
      container.style.padding = "32px";
      container.style.fontFamily = "system-ui, -apple-system, sans-serif";
      container.style.lineHeight = "1.5";

      // Estilos según tipo de servicio
      if (isSpecialEvent) {
        container.style.background = "linear-gradient(135deg, #881337 0%, #9f1239 50%, #be123c 100%)";
        container.style.color = "#f5f5f5";
      } else if (isQuarantine) {
        container.style.background = "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)";
        container.style.color = "#f5f5f5";
      } else {
        container.style.backgroundColor = "#ffffff";
        container.style.color = "#1f2937";
      }

      // Header con mejor espaciado
      const header = document.createElement("div");
      header.style.marginBottom = "32px";
      header.style.textAlign = "center";

      // Banner especial
      if (isSpecialEvent) {
        const specialBanner = document.createElement("div");
        specialBanner.style.background = "linear-gradient(135deg, #E11D48 0%, #BE123C 100%)";
        specialBanner.style.color = "white";
        specialBanner.style.padding = "12px 24px";
        specialBanner.style.borderRadius = "12px";
        specialBanner.style.marginBottom = "24px";
        specialBanner.style.fontWeight = "bold";
        specialBanner.style.fontSize = "18px";
        specialBanner.style.textAlign = "center";
        specialBanner.style.boxShadow = "0 4px 15px rgba(225, 29, 72, 0.3)";
        specialBanner.textContent = "🌟 SERVICIO ESPECIAL";
        header.appendChild(specialBanner);
      } else if (isQuarantine) {
        const quarantineBanner = document.createElement("div");
        quarantineBanner.style.background = "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
        quarantineBanner.style.color = "#1a1a2e";
        quarantineBanner.style.padding = "12px 24px";
        quarantineBanner.style.borderRadius = "12px";
        quarantineBanner.style.marginBottom = "24px";
        quarantineBanner.style.fontWeight = "bold";
        quarantineBanner.style.fontSize = "18px";
        quarantineBanner.style.textAlign = "center";
        quarantineBanner.style.boxShadow = "0 4px 15px rgba(245, 158, 11, 0.3)";
        quarantineBanner.textContent = "⚠️ SERVICIO DE CUARENTENA";
        header.appendChild(quarantineBanner);
      }

      const title = document.createElement("h1");
      title.textContent = isSpecialEvent 
        ? (service.special_activity || "Servicio Especial")
        : isQuarantine ? "Culto de Oración" : "Programa de Servicios";
      title.style.fontSize = "28px";
      title.style.fontWeight = "bold";
      title.style.marginBottom = "8px";
      title.style.letterSpacing = "-0.025em";
      title.style.color = (isSpecialEvent || isQuarantine) ? "#fcd34d" : "#111827";
      if (isSpecialEvent) title.style.color = "#fecdd3";

      const dateTime = document.createElement("p");
      const serviceDate = format(parseServiceDate(service.service_date), "EEEE, dd 'de' MMMM", { locale: es });
      dateTime.textContent = serviceDate;
      dateTime.style.fontSize = "18px";
      dateTime.style.textTransform = "capitalize";
      dateTime.style.fontWeight = "500";
      dateTime.style.color = isSpecialEvent ? "#fda4af" : isQuarantine ? "#fbbf24" : "#6b7280";

      header.appendChild(title);
      header.appendChild(dateTime);

      // Línea separadora
      const separator = document.createElement("hr");
      separator.style.border = "none";
      separator.style.borderTop = isSpecialEvent 
        ? "2px solid rgba(253, 164, 175, 0.3)" 
        : isQuarantine ? "2px solid rgba(251, 191, 36, 0.3)" : "2px solid #e5e7eb";
      separator.style.margin = "24px 0";
      separator.style.width = "100%";

      header.appendChild(separator);

      // Service Info
      const serviceInfo = document.createElement("div");
      serviceInfo.style.marginBottom = "32px";
      serviceInfo.style.textAlign = "center";

      const time = document.createElement("h2");
      time.textContent = getServiceTime(service.title, service.service_type);
      time.style.fontSize = "24px";
      time.style.fontWeight = "bold";
      time.style.marginBottom = "12px";
      time.style.color = isSpecialEvent ? "#fecdd3" : isQuarantine ? "#fcd34d" : "#1f2937";

      const groupInfo = document.createElement("div");
      groupInfo.style.display = "flex";
      groupInfo.style.alignItems = "center";
      groupInfo.style.justifyContent = "center";
      groupInfo.style.gap = "12px";
      groupInfo.style.marginBottom = "8px";
      groupInfo.style.flexWrap = "wrap";

      const groupNameEl = document.createElement("span");
      groupNameEl.textContent = isSpecialEvent ? "Todos los Grupos" : (service.worship_groups?.name || "Grupo de Alabanza");
      groupNameEl.style.backgroundColor = isSpecialEvent ? "#E11D48" : isQuarantine ? "#f59e0b" : (service.worship_groups?.color_theme || "#3B82F6");
      groupNameEl.style.color = isSpecialEvent ? "white" : isQuarantine ? "#1a1a2e" : "white";
      groupNameEl.style.padding = "6px 16px";
      groupNameEl.style.borderRadius = "9999px";
      groupNameEl.style.fontSize = "16px";
      groupNameEl.style.fontWeight = "600";
      groupNameEl.style.letterSpacing = "-0.025em";

      const activity = document.createElement("span");
      activity.textContent = service.special_activity
        ? (isSpecialEvent ? service.special_activity : `Sección especial: ${service.special_activity}`)
        : isQuarantine ? "Culto de Oración" : "Sección especial: Ninguna";
      activity.style.fontSize = "16px";
      activity.style.fontWeight = "500";
      activity.style.color = isSpecialEvent ? "#fda4af" : isQuarantine ? "#fbbf24" : "#6b7280";

      groupInfo.appendChild(groupNameEl);
      groupInfo.appendChild(activity);

      serviceInfo.appendChild(time);
      serviceInfo.appendChild(groupInfo);

      // Director Section (only for non-special events)
      const directorSection = document.createElement("div");
      if (!isSpecialEvent) {
        directorSection.style.marginBottom = "32px";
        directorSection.style.textAlign = "center";

        const directorTitle = document.createElement("h3");
        directorTitle.textContent = "Director/a de Alabanza";
        directorTitle.style.fontSize = "20px";
        directorTitle.style.fontWeight = "bold";
        directorTitle.style.marginBottom = "20px";
        directorTitle.style.textDecoration = "underline";
        directorTitle.style.color = isQuarantine ? "#fbbf24" : "#1e40af";

        const directorContent = document.createElement("div");
        directorContent.style.display = "flex";
        directorContent.style.flexDirection = "column";
        directorContent.style.alignItems = "center";
        directorContent.style.gap = "16px";

        const directorAvatar = document.createElement("div");
        directorAvatar.style.width = "80px";
        directorAvatar.style.height = "80px";
        directorAvatar.style.borderRadius = "50%";
        directorAvatar.style.border = isQuarantine ? "4px solid #fbbf24" : "4px solid #93c5fd";
        directorAvatar.style.overflow = "hidden";
        directorAvatar.style.background = isQuarantine 
          ? "linear-gradient(to right, #f59e0b, #d97706)" 
          : "linear-gradient(to right, #3b82f6, #2563eb)";
        directorAvatar.style.display = "flex";
        directorAvatar.style.alignItems = "center";
        directorAvatar.style.justifyContent = "center";
        directorAvatar.style.color = "white";
        directorAvatar.style.fontWeight = "bold";
        directorAvatar.style.fontSize = "24px";

        const directorImg = document.createElement("img");
        directorImg.src = service.director_profile?.photo_url || "";
        directorImg.style.width = "100%";
        directorImg.style.height = "100%";
        directorImg.style.objectFit = "cover";
        directorImg.onerror = () => {
          directorImg.style.display = "none";
          const initials = document.createElement("div");
          initials.textContent = getInitials(service.leader);
          initials.style.display = "flex";
          initials.style.alignItems = "center";
          initials.style.justifyContent = "center";
          initials.style.width = "100%";
          initials.style.height = "100%";
          directorAvatar.appendChild(initials);
        };

        directorAvatar.appendChild(directorImg);

        const directorInfoEl = document.createElement("div");
        directorInfoEl.style.textAlign = "center";

        const directorName = document.createElement("div");
        directorName.textContent = service.leader;
        directorName.style.fontWeight = "bold";
        directorName.style.fontSize = "20px";
        directorName.style.marginBottom = "4px";
        directorName.style.color = isQuarantine ? "#f5f5f5" : "#1f2937";

        const directorRole = document.createElement("div");
        directorRole.textContent = "Líder del Servicio";
        directorRole.style.fontSize = "16px";
        directorRole.style.fontWeight = "600";
        directorRole.style.color = isQuarantine ? "#fbbf24" : "#3b82f6";

        directorInfoEl.appendChild(directorName);
        directorInfoEl.appendChild(directorRole);

        directorContent.appendChild(directorAvatar);
        directorContent.appendChild(directorInfoEl);

        directorSection.appendChild(directorTitle);
        directorSection.appendChild(directorContent);
      } else {
        // For special events: "Participan todos los integrantes" info
        directorSection.style.marginBottom = "32px";
        directorSection.style.textAlign = "center";
        directorSection.style.padding = "16px";
        directorSection.style.borderRadius = "12px";
        directorSection.style.background = "rgba(225,29,72,0.2)";
        directorSection.style.border = "1px solid rgba(225,29,72,0.3)";

        const infoText = document.createElement("div");
        infoText.textContent = "👥 Participan todos los integrantes del ministerio";
        infoText.style.fontSize = "16px";
        infoText.style.fontWeight = "600";
        infoText.style.color = "#fecdd3";
      
        const subText = document.createElement("div");
        subText.textContent = "Todos los grupos de alabanza participan en este servicio especial";
        subText.style.fontSize = "14px";
        subText.style.color = "rgba(255,255,255,0.7)";
        subText.style.marginTop = "8px";

        directorSection.appendChild(infoText);
        directorSection.appendChild(subText);
      }

      // Songs Section
      const songsSection = document.createElement("div");
      songsSection.style.marginBottom = "32px";

      const worshipSongs = service.selected_songs?.filter((s) => s.song_order >= 1 && s.song_order <= 4) || [];
      const offeringsSongs = service.selected_songs?.filter((s) => s.song_order === 5) || [];
      const communionSongs = service.selected_songs?.filter((s) => s.song_order === 6) || [];
      const hasAnySongs = worshipSongs.length > 0 || offeringsSongs.length > 0 || communionSongs.length > 0;
      
      const isDark = isSpecialEvent || isQuarantine;
      
      if (hasAnySongs) {
        const songsTitle = document.createElement("h3");
        songsTitle.textContent = "Canciones Seleccionadas";
        songsTitle.style.fontSize = "20px";
        songsTitle.style.fontWeight = "bold";
        songsTitle.style.marginBottom = "20px";
        songsTitle.style.textAlign = "center";
        songsTitle.style.textDecoration = "underline";
        songsTitle.style.color = isSpecialEvent ? "#fda4af" : isQuarantine ? "#fbbf24" : "#15803d";
        songsSection.appendChild(songsTitle);
      } else {
        const noSongsMessage = document.createElement("div");
        noSongsMessage.style.textAlign = "center";
        noSongsMessage.style.padding = "16px";
        noSongsMessage.style.borderRadius = "12px";
        noSongsMessage.style.marginBottom = "16px";
        noSongsMessage.style.backgroundColor = isDark ? "rgba(255,255,255,0.1)" : "#f3f4f6";
        
        const noSongsText = document.createElement("p");
        noSongsText.textContent = "No hay canciones seleccionadas aún";
        noSongsText.style.fontSize = "16px";
        noSongsText.style.fontStyle = "italic";
        noSongsText.style.margin = "0";
        noSongsText.style.color = isDark ? "rgba(255,255,255,0.6)" : "#6b7280";
        
        noSongsMessage.appendChild(noSongsText);
        songsSection.appendChild(noSongsMessage);
      }

      if (worshipSongs.length > 0) {
        const songsList = document.createElement("div");
        songsList.style.display = "flex";
        songsList.style.flexDirection = "column";
        songsList.style.gap = "16px";

        worshipSongs.forEach((song, index) => {
          const { firstLine, secondLine } = splitSongTitle(song.title);
          const { firstName: artistFirstName, lastName: artistLastName } = splitName(song.artist || "");

          const songItem = document.createElement("div");
          songItem.style.display = "flex";
          songItem.style.alignItems = "flex-start";
          songItem.style.gap = "16px";
          songItem.style.padding = "12px";
          songItem.style.borderRadius = "12px";
          songItem.style.backgroundColor = isSpecialEvent ? "rgba(253,164,175,0.1)" : isQuarantine ? "rgba(251, 191, 36, 0.1)" : "#f0fdf4";
          songItem.style.border = isSpecialEvent ? "1px solid rgba(253,164,175,0.3)" : isQuarantine ? "1px solid rgba(251, 191, 36, 0.3)" : "1px solid #dcfce7";

          const number = document.createElement("div");
          number.textContent = (index + 1).toString();
          number.style.width = "32px";
          number.style.height = "32px";
          number.style.backgroundColor = isSpecialEvent ? "#E11D48" : isQuarantine ? "#f59e0b" : "#22c55e";
          number.style.color = "white";
          number.style.borderRadius = "50%";
          number.style.display = "flex";
          number.style.alignItems = "center";
          number.style.justifyContent = "center";
          number.style.fontSize = "16px";
          number.style.fontWeight = "bold";
          number.style.flexShrink = "0";
          number.style.marginTop = "2px";

          const songContent = document.createElement("div");
          songContent.style.flex = "1";

          const songFirstLine = document.createElement("div");
          songFirstLine.textContent = firstLine;
          songFirstLine.style.fontWeight = "bold";
          songFirstLine.style.fontSize = "18px";
          songFirstLine.style.marginBottom = "4px";
          songFirstLine.style.color = isDark ? "#fcd34d" : "#1f2937";
          if (isSpecialEvent) songFirstLine.style.color = "#fecdd3";

          songContent.appendChild(songFirstLine);

          if (secondLine) {
            const songSecondLine = document.createElement("div");
            songSecondLine.textContent = secondLine;
            songSecondLine.style.fontSize = "18px";
            songSecondLine.style.marginBottom = "8px";
            songSecondLine.style.color = isDark ? "#f5f5f5" : "#1f2937";
            songContent.appendChild(songSecondLine);
          }

          if (song.artist) {
            const artistContainer = document.createElement("div");
            artistContainer.style.marginTop = "4px";

            const artistFirst = document.createElement("div");
            artistFirst.textContent = artistFirstName;
            artistFirst.style.fontSize = "16px";
            artistFirst.style.fontWeight = "500";
            artistFirst.style.color = isSpecialEvent ? "#fda4af" : isQuarantine ? "#fbbf24" : "#6b7280";

            artistContainer.appendChild(artistFirst);

            if (artistLastName) {
              const artistLast = document.createElement("div");
              artistLast.textContent = artistLastName;
              artistLast.style.fontSize = "14px";
              artistLast.style.color = isSpecialEvent ? "#fb7185" : isQuarantine ? "#d4a026" : "#9ca3af";
              artistContainer.appendChild(artistLast);
            }

            songContent.appendChild(artistContainer);
          }

          songItem.appendChild(number);
          songItem.appendChild(songContent);
          songsList.appendChild(songItem);
        });

        songsSection.appendChild(songsList);
      }

      // Offering Song
      if (offeringsSongs.length > 0) {
        const offeringSection = document.createElement("div");
        offeringSection.style.marginTop = "16px";
        offeringSection.style.padding = "12px";
        offeringSection.style.borderRadius = "12px";
        offeringSection.style.backgroundColor = isSpecialEvent ? "rgba(253,164,175,0.15)" : isQuarantine ? "rgba(245, 158, 11, 0.15)" : "#fefce8";
        offeringSection.style.border = isSpecialEvent ? "1px solid rgba(253,164,175,0.4)" : isQuarantine ? "1px solid rgba(245, 158, 11, 0.4)" : "1px solid #fde047";

        const offeringTitle = document.createElement("div");
        offeringTitle.textContent = "Canción de Ofrendas";
        offeringTitle.style.fontSize = "16px";
        offeringTitle.style.fontWeight = "bold";
        offeringTitle.style.marginBottom = "8px";
        offeringTitle.style.color = isSpecialEvent ? "#fda4af" : isQuarantine ? "#fcd34d" : "#92400e";

        const { firstLine, secondLine } = splitSongTitle(offeringsSongs[0].title);

        const offeringContent = document.createElement("div");
        offeringContent.style.paddingLeft = "8px";

        const offeringFirstLine = document.createElement("div");
        offeringFirstLine.textContent = firstLine;
        offeringFirstLine.style.fontWeight = "bold";
        offeringFirstLine.style.fontSize = "16px";
        offeringFirstLine.style.color = isDark ? "#f5f5f5" : "#1f2937";

        offeringContent.appendChild(offeringFirstLine);

        if (secondLine) {
          const offeringSecondLine = document.createElement("div");
          offeringSecondLine.textContent = secondLine;
          offeringSecondLine.style.fontSize = "16px";
          offeringSecondLine.style.color = isDark ? "#e5e5e5" : "#1f2937";
          offeringContent.appendChild(offeringSecondLine);
        }

        offeringSection.appendChild(offeringTitle);
        offeringSection.appendChild(offeringContent);
        songsSection.appendChild(offeringSection);
      }

      // Communion Song
      if (communionSongs.length > 0) {
        const communionSection = document.createElement("div");
        communionSection.style.marginTop = "16px";
        communionSection.style.padding = "12px";
        communionSection.style.borderRadius = "12px";
        communionSection.style.backgroundColor = isSpecialEvent ? "rgba(192,132,252,0.15)" : isQuarantine ? "rgba(168, 85, 247, 0.15)" : "#fae8ff";
        communionSection.style.border = isSpecialEvent ? "1px solid rgba(192,132,252,0.4)" : isQuarantine ? "1px solid rgba(168, 85, 247, 0.4)" : "1px solid #e9d5ff";

        const communionTitle = document.createElement("div");
        communionTitle.textContent = "Canción de Comunión";
        communionTitle.style.fontSize = "16px";
        communionTitle.style.fontWeight = "bold";
        communionTitle.style.marginBottom = "8px";
        communionTitle.style.color = isSpecialEvent ? "#c084fc" : isQuarantine ? "#c084fc" : "#6b21a8";

        const { firstLine: cFirstLine, secondLine: cSecondLine } = splitSongTitle(communionSongs[0].title);

        const communionContent = document.createElement("div");
        communionContent.style.paddingLeft = "8px";

        const communionFirstLine = document.createElement("div");
        communionFirstLine.textContent = cFirstLine;
        communionFirstLine.style.fontWeight = "bold";
        communionFirstLine.style.fontSize = "16px";
        communionFirstLine.style.color = isDark ? "#f5f5f5" : "#1f2937";

        communionContent.appendChild(communionFirstLine);

        if (cSecondLine) {
          const communionSecondLine = document.createElement("div");
          communionSecondLine.textContent = cSecondLine;
          communionSecondLine.style.fontSize = "16px";
          communionSecondLine.style.color = isDark ? "#e5e5e5" : "#1f2937";
          communionContent.appendChild(communionSecondLine);
        }

        communionSection.appendChild(communionTitle);
        communionSection.appendChild(communionContent);
        songsSection.appendChild(communionSection);
      }

      // Voices Section
      const voicesSection = document.createElement("div");

      if (isSpecialEvent) {
        // SPECIAL EVENT: Show all members grouped by group
        const voicesTitle = document.createElement("h3");
        voicesTitle.textContent = "Integrantes del Ministerio";
        voicesTitle.style.fontSize = "20px";
        voicesTitle.style.fontWeight = "bold";
        voicesTitle.style.marginBottom = "20px";
        voicesTitle.style.textAlign = "center";
        voicesTitle.style.textDecoration = "underline";
        voicesTitle.style.color = "#fecdd3";
        voicesSection.appendChild(voicesTitle);

        const groupColorMap: Record<string, string> = {
          "Grupo de Aleida": "#3B82F6",
          "Grupo de Keyla": "#8B5CF6",
          "Grupo de Massy": "#EC4899",
        };

        const allVoices = getResponsibleVoices(service.group_members);

        ["Grupo de Aleida", "Grupo de Keyla", "Grupo de Massy"].forEach(groupKey => {
          const groupMembers = allVoices.filter(m => m.instrument?.includes(groupKey));
          if (groupMembers.length === 0) return;

          // Group container
          const groupContainer = document.createElement("div");
          groupContainer.style.marginBottom = "20px";
          groupContainer.style.padding = "16px";
          groupContainer.style.borderRadius = "12px";
          groupContainer.style.background = "rgba(255,255,255,0.05)";
          groupContainer.style.border = "1px solid rgba(255,255,255,0.1)";

          // Group label
          const groupLabel = document.createElement("span");
          groupLabel.textContent = groupKey;
          groupLabel.style.display = "inline-block";
          groupLabel.style.padding = "4px 12px";
          groupLabel.style.borderRadius = "9999px";
          groupLabel.style.fontSize = "14px";
          groupLabel.style.fontWeight = "600";
          groupLabel.style.color = "white";
          groupLabel.style.backgroundColor = groupColorMap[groupKey] || "#3B82F6";
          groupLabel.style.marginBottom = "12px";
          groupContainer.appendChild(groupLabel);

          // Members grid (2 columns)
          const membersGrid = document.createElement("div");
          membersGrid.style.display = "grid";
          membersGrid.style.gridTemplateColumns = "1fr 1fr";
          membersGrid.style.gap = "12px";

          groupMembers.forEach(member => {
            const { firstName, lastName } = splitName(member.profiles?.full_name || "");

            const memberItem = document.createElement("div");
            memberItem.style.display = "flex";
            memberItem.style.alignItems = "center";
            memberItem.style.gap = "10px";
            memberItem.style.minWidth = "0";

            // Avatar
            const avatar = document.createElement("div");
            avatar.style.width = "40px";
            avatar.style.height = "40px";
            avatar.style.borderRadius = "50%";
            avatar.style.border = "2px solid rgba(225,29,72,0.5)";
            avatar.style.overflow = "hidden";
            avatar.style.background = "linear-gradient(to right, #E11D48, #BE123C)";
            avatar.style.display = "flex";
            avatar.style.alignItems = "center";
            avatar.style.justifyContent = "center";
            avatar.style.color = "white";
            avatar.style.fontWeight = "bold";
            avatar.style.fontSize = "13px";
            avatar.style.flexShrink = "0";

            const img = document.createElement("img");
            img.src = member.profiles?.photo_url || "";
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.objectFit = "cover";
            img.onerror = () => {
              img.style.display = "none";
              const init = document.createElement("div");
              init.textContent = getInitials(member.profiles?.full_name || "NN");
              init.style.display = "flex";
              init.style.alignItems = "center";
              init.style.justifyContent = "center";
              init.style.width = "100%";
              init.style.height = "100%";
              avatar.appendChild(init);
            };
            avatar.appendChild(img);

            // Info
            const info = document.createElement("div");
            info.style.minWidth = "0";
            info.style.flex = "1";

            const nameEl = document.createElement("div");
            nameEl.textContent = firstName;
            nameEl.style.fontWeight = "600";
            nameEl.style.fontSize = "13px";
            nameEl.style.color = "white";
            nameEl.style.wordBreak = "break-word";
            nameEl.style.lineHeight = "1.2";
            info.appendChild(nameEl);

            if (lastName) {
              const lastNameEl = document.createElement("div");
              lastNameEl.textContent = lastName;
              lastNameEl.style.fontSize = "11px";
              lastNameEl.style.color = "rgba(255,255,255,0.6)";
              lastNameEl.style.wordBreak = "break-word";
              lastNameEl.style.lineHeight = "1.2";
              info.appendChild(lastNameEl);
            }

            const voiceType = document.createElement("div");
            voiceType.textContent = member.instrument?.split(' • ')[0] || "";
            voiceType.style.fontSize = "11px";
            voiceType.style.color = "#fda4af";
            info.appendChild(voiceType);

            memberItem.appendChild(avatar);
            memberItem.appendChild(info);
            membersGrid.appendChild(memberItem);
          });

          groupContainer.appendChild(membersGrid);
          voicesSection.appendChild(groupContainer);
        });
      } else {
        // Regular service: show responsible voices
        const voicesTitle = document.createElement("h3");
        voicesTitle.textContent = "Responsables de Voces";
        voicesTitle.style.fontSize = "20px";
        voicesTitle.style.fontWeight = "bold";
        voicesTitle.style.marginBottom = "20px";
        voicesTitle.style.textAlign = "center";
        voicesTitle.style.textDecoration = "underline";
        voicesTitle.style.color = isQuarantine ? "#fbbf24" : "#1e40af";

        voicesSection.appendChild(voicesTitle);

        const responsibleVoices = getResponsibleVoices(service.group_members).slice(0, 6);

        if (responsibleVoices.length > 0) {
          const voicesList = document.createElement("div");
          voicesList.style.display = "flex";
          voicesList.style.flexDirection = "column";
          voicesList.style.gap = "16px";

          responsibleVoices.forEach((member) => {
            const { firstName, lastName } = splitName(member.profiles?.full_name || "");

            const voiceItem = document.createElement("div");
            voiceItem.style.display = "flex";
            voiceItem.style.alignItems = "center";
            voiceItem.style.gap = "16px";
            voiceItem.style.padding = "12px";
            voiceItem.style.borderRadius = "12px";
            voiceItem.style.backgroundColor = isQuarantine ? "rgba(251, 191, 36, 0.1)" : "#dbeafe";
            voiceItem.style.border = isQuarantine ? "1px solid rgba(251, 191, 36, 0.3)" : "1px solid #93c5fd";

            const voiceAvatar = document.createElement("div");
            voiceAvatar.style.width = "60px";
            voiceAvatar.style.height = "60px";
            voiceAvatar.style.borderRadius = "50%";
            voiceAvatar.style.border = isQuarantine ? "3px solid #fbbf24" : "3px solid #93c5fd";
            voiceAvatar.style.overflow = "hidden";
            voiceAvatar.style.background = isQuarantine 
              ? "linear-gradient(to right, #f59e0b, #d97706)" 
              : "linear-gradient(to right, #3b82f6, #2563eb)";
            voiceAvatar.style.display = "flex";
            voiceAvatar.style.alignItems = "center";
            voiceAvatar.style.justifyContent = "center";
            voiceAvatar.style.color = "white";
            voiceAvatar.style.fontWeight = "bold";
            voiceAvatar.style.fontSize = "18px";
            voiceAvatar.style.flexShrink = "0";

            const voiceImg = document.createElement("img");
            voiceImg.src = member.profiles?.photo_url || "";
            voiceImg.style.width = "100%";
            voiceImg.style.height = "100%";
            voiceImg.style.objectFit = "cover";
            voiceImg.onerror = () => {
              voiceImg.style.display = "none";
              const initials = document.createElement("div");
              initials.textContent = getInitials(member.profiles?.full_name || "NN");
              initials.style.display = "flex";
              initials.style.alignItems = "center";
              initials.style.justifyContent = "center";
              initials.style.width = "100%";
              initials.style.height = "100%";
              voiceAvatar.appendChild(initials);
            };

            voiceAvatar.appendChild(voiceImg);

            const voiceInfo = document.createElement("div");
            voiceInfo.style.flex = "1";
            voiceInfo.style.minWidth = "0";

            const voiceName = document.createElement("div");
            voiceName.textContent = firstName;
            voiceName.style.fontWeight = "bold";
            voiceName.style.fontSize = "18px";
            voiceName.style.marginBottom = "2px";
            voiceName.style.color = isQuarantine ? "#f5f5f5" : "#1f2937";

            voiceInfo.appendChild(voiceName);

            if (lastName) {
              const voiceLastName = document.createElement("div");
              voiceLastName.textContent = lastName;
              voiceLastName.style.fontSize = "16px";
              voiceLastName.style.marginBottom = "4px";
              voiceLastName.style.color = isQuarantine ? "#d4d4d4" : "#6b7280";
              voiceInfo.appendChild(voiceLastName);
            }

            const voiceInstrument = document.createElement("div");
            voiceInstrument.textContent = member.instrument;
            voiceInstrument.style.fontSize = "16px";
            voiceInstrument.style.fontWeight = "600";
            voiceInstrument.style.color = isQuarantine ? "#fbbf24" : "#3b82f6";

            voiceInfo.appendChild(voiceInstrument);

            voiceItem.appendChild(voiceAvatar);
            voiceItem.appendChild(voiceInfo);
            voicesList.appendChild(voiceItem);
          });

          voicesSection.appendChild(voicesList);
        }
      }

      // Footer for special events
      if (isSpecialEvent) {
        const footer = document.createElement("div");
        footer.style.marginTop = "24px";
        footer.style.textAlign = "center";
        footer.style.padding = "12px";
        footer.style.borderTop = "1px solid rgba(253,164,175,0.2)";
        
        const footerText = document.createElement("p");
        footerText.textContent = "Ministerio de Alabanza Arca de Noé • " + format(new Date(), 'yyyy');
        footerText.style.fontSize = "12px";
        footerText.style.color = "rgba(255,255,255,0.4)";
        footer.appendChild(footerText);
        
        voicesSection.appendChild(footer);
      }

      // Assemble container
      container.appendChild(header);
      container.appendChild(serviceInfo);
      container.appendChild(directorSection);
      container.appendChild(songsSection);
      container.appendChild(voicesSection);

      // Add to document for rendering
      const wrapper = document.createElement("div");
      wrapper.style.position = "fixed";
      wrapper.style.left = "-9999px";
      wrapper.style.top = "0";
      wrapper.appendChild(container);
      document.body.appendChild(wrapper);

      // Wait for images to load
      const images = container.getElementsByTagName("img");
      const imagePromises = Array.from(images).map((img) => {
        if (img.complete) {
          return Promise.resolve(undefined);
        }
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => {
            console.warn("Image failed to load:", img.src);
            resolve();
          };
          setTimeout(() => resolve(), 3000);
        });
      });

      await Promise.all(imagePromises);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Capture as image
      const canvas = await html2canvas(container, {
        backgroundColor: isQuarantine ? "#1a1a2e" : "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Clean up
      document.body.removeChild(wrapper);

      // Download with appropriate filename
      const filename = isQuarantine 
        ? `cuarentena_${format(parseServiceDate(service.service_date), "yyyy-MM-dd")}.png`
        : `${serviceTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${new Date().getTime()}.png`;
      
      // Convert to blob for better download compatibility
      canvas.toBlob((blob) => {
        if (!blob) {
          toast.error("Error al generar la imagen");
          return;
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        
        // Cleanup after a short delay
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        
        toast.success("Imagen descargada exitosamente");
      }, "image/png", 1.0);
    } catch (error) {
      console.error("Error downloading service image:", error);
      toast.error("Error al descargar la imagen");
    }
  };

  // Nuevo diseño de ServiceCard mejorado
  const ServiceCard = ({ service }: { service: WeekendService }) => {
    const serviceTime = getServiceTime(service.title, service.service_type);
    const directorMember = service.group_members.find((m) => m.is_leader);
    const responsibleVoices = getResponsibleVoices(service.group_members);
    const isQuarantine = service.service_type === 'cuarentena';
    const isSpecialEvent = service.service_type === 'especial' || service.leader === 'TODOS';

    const worshipSongs = service.selected_songs?.filter((s) => s.song_order >= 1 && s.song_order <= 4) || [];
    const offeringsSongs = service.selected_songs?.filter((s) => s.song_order === 5) || [];
    const communionSongs = service.selected_songs?.filter((s) => s.song_order === 6) || [];

    return (
      <div
        ref={(el) => (serviceCardRefs.current[service.id] = el)}
        className={`rounded-xl p-6 shadow-lg mx-auto ${
          isSpecialEvent
            ? 'bg-gradient-to-br from-rose-900 to-rose-800 border-2 border-rose-400/40'
            : isQuarantine 
              ? 'bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-amber-500/30' 
              : 'bg-white/90 border border-blue-200'
        }`}
        style={{ maxWidth: "600px" }}
      >
        {/* Special Event Badge */}
        {isSpecialEvent && (
          <div className="flex flex-col items-center justify-center gap-2 mb-4 -mt-2">
            <span 
              className="px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, #E11D48 0%, #BE123C 100%)",
                color: "white",
              }}
            >
              🌟 SERVICIO ESPECIAL
            </span>
            <span className="text-rose-200 text-sm font-semibold text-center">
              {service.special_activity || "Evento Especial"}
            </span>
            <span className="text-rose-300/80 text-xs">{serviceTime}</span>
          </div>
        )}

        {/* Quarantine Badge */}
        {isQuarantine && !isSpecialEvent && (
          <div className="flex items-center justify-center gap-2 mb-4 -mt-2">
            <span 
              className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                color: "#1a1a2e",
              }}
            >
              ⚠️ CUARENTENA
            </span>
            <span className="text-amber-400 text-xs">{serviceTime}</span>
          </div>
        )}

        {/* Service Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-3 h-8 rounded-full"
            style={{
              background: isSpecialEvent
                ? "linear-gradient(to bottom, #E11D4899, #E11D48)"
                : isQuarantine 
                  ? "linear-gradient(to bottom, #f59e0b99, #f59e0b)"
                  : `linear-gradient(to bottom, ${service.worship_groups?.color_theme || "#3B82F6"}99, ${service.worship_groups?.color_theme || "#3B82F6"})`,
            }}
          ></div>
          <div>
            <h3 className={`text-xl font-bold ${isSpecialEvent ? 'text-white' : isQuarantine ? 'text-white' : 'text-blue-900'}`}>
              {isSpecialEvent ? (service.special_activity || service.title) : service.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className="text-sm font-medium px-2 py-1 rounded-full text-white"
                style={{ 
                  backgroundColor: isSpecialEvent 
                    ? '#E11D48'
                    : isQuarantine 
                      ? '#f59e0b' 
                      : (service.worship_groups?.color_theme || "#3B82F6") 
                }}
              >
                {isSpecialEvent ? "Todos los Grupos" : (service.worship_groups?.name || "Grupo de Alabanza")}
              </span>
              {!isSpecialEvent && (
                <>
                  <span className={`text-sm ${isQuarantine ? 'text-gray-400' : 'text-gray-500'}`}>•</span>
                  <span className={`text-sm ${isQuarantine ? 'text-gray-300' : 'text-gray-600'}`}>
                    {service.special_activity
                      ? `Sección especial: ${service.special_activity}`
                      : "Sección especial: Ninguna"}
                  </span>
                </>
              )}
              {isSpecialEvent && (
                <>
                  <span className="text-sm text-rose-300/60">•</span>
                  <span className="text-sm text-rose-200">{service.location || "Templo Principal"}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* SPECIAL EVENT: Show all members grouped by their group */}
        {isSpecialEvent ? (
          <div className="space-y-4">
            {/* Special event info banner */}
            <div 
              className="rounded-lg p-4 text-center"
              style={{
                background: "linear-gradient(135deg, rgba(225,29,72,0.2) 0%, rgba(190,18,60,0.1) 100%)",
                border: "1px solid rgba(225,29,72,0.3)",
              }}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-5 w-5 text-rose-300" />
                <span className="text-rose-200 font-semibold text-sm">Participan todos los integrantes</span>
              </div>
              <p className="text-white/70 text-xs">
                Todos los grupos de alabanza participan en este servicio especial
              </p>
            </div>

            {/* Members grouped by group */}
            {["Grupo de Aleida", "Grupo de Keyla", "Grupo de Massy"].map(groupKey => {
              const groupMembers = responsibleVoices.filter(m => 
                m.instrument?.includes(groupKey)
              );
              if (groupMembers.length === 0) return null;
              
              const groupColorMap: Record<string, string> = {
                "Grupo de Aleida": "#3B82F6",
                "Grupo de Keyla": "#8B5CF6", 
                "Grupo de Massy": "#EC4899",
              };
              
              return (
                <div key={groupKey} className="rounded-lg p-4" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span 
                      className="px-2 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: groupColorMap[groupKey] || "#3B82F6" }}
                    >
                      {groupKey}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {groupMembers.map((member) => {
                      const { firstName, lastName } = splitName(member.profiles?.full_name || "");
                      return (
                        <div key={member.id} className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-full border-2 border-rose-400/50 overflow-hidden bg-gradient-to-r from-rose-500 to-rose-600 flex-shrink-0">
                            <img
                              src={member.profiles?.photo_url}
                              alt={member.profiles?.full_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = "flex";
                              }}
                            />
                            <div className="w-full h-full hidden items-center justify-center text-white text-xs font-bold">
                              {getInitials(member.profiles?.full_name || "NN")}
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-medium text-white truncate">{firstName}</div>
                            {lastName && <div className="text-[10px] text-gray-400 truncate">{lastName}</div>}
                            <div className="text-[10px] text-rose-300">{member.instrument?.split(' • ')[0]}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Action Buttons for special event */}
            <div className="service-action-buttons flex flex-wrap gap-2 mt-6 pt-4 border-t border-rose-400/20">
              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadServiceImage(service.id, service.title)}
                className="flex items-center gap-2 border-rose-400 text-rose-300 hover:bg-rose-400/20"
              >
                <Download className="w-4 h-4" />
                Descargar
              </Button>
            </div>
          </div>
        ) : (
          <>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Director and Songs */}
          <div className="space-y-4">
            {/* Director */}
            <div className={`rounded-lg p-4 ${isQuarantine ? 'bg-amber-900/30' : 'bg-blue-50'}`}>
              <div className={`text-sm font-semibold mb-3 ${isQuarantine ? 'text-amber-300' : 'text-blue-800'}`}>
                Director/a de Alabanza
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-16 h-16 rounded-full border-3 shadow-lg overflow-hidden ${
                  isQuarantine 
                    ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600' 
                    : 'border-blue-300 bg-gradient-to-r from-blue-500 to-blue-600'
                }`}>
                  <img
                    src={service.director_profile?.photo_url || directorMember?.profiles?.photo_url}
                    alt={service.leader}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                  <div className="w-full h-full hidden items-center justify-center text-white text-lg font-bold">
                    {getInitials(service.leader)}
                  </div>
                </div>
                <div>
                  <div className={`font-semibold ${isQuarantine ? 'text-white' : 'text-gray-900'}`}>
                    {service.leader}
                  </div>
                  <div className={`text-sm ${isQuarantine ? 'text-amber-400' : 'text-blue-600'}`}>
                    Líder del Servicio
                  </div>
                </div>
              </div>

              {/* Canciones debajo del director */}
              {worshipSongs.length > 0 ? (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Music className="w-4 h-4 text-green-600" />
                    <div className="text-sm font-semibold text-green-800">Canciones Seleccionadas</div>
                  </div>
                  <div className="space-y-3">
                    {worshipSongs.map((song, index) => {
                      const { firstLine, secondLine } = splitSongTitle(song.title);
                      const { firstName: artistFirstName, lastName: artistLastName } = splitName(song.artist || "");

                      return (
                        <div key={song.id} className="flex items-start gap-2 text-sm">
                          <span className="w-5 h-5 bg-green-200 text-green-800 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                            {index + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900">{firstLine}</div>
                            {secondLine && <div className="text-gray-900">{secondLine}</div>}
                            {song.artist && (
                              <div className="text-xs text-gray-600 mt-1">
                                {artistFirstName}
                                {artistLastName && <div className="text-gray-500">{artistLastName}</div>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
                        onNavigate("/repertorio");
                      } else {
                        window.location.href = "/repertorio";
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
                        onNavigate("/communication");
                      } else {
                        window.location.href = "/communication";
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
                <div className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                    $
                  </span>
                  <div className="min-w-0 flex-1">
                    {(() => {
                      const { firstLine, secondLine } = splitSongTitle(offeringsSongs[0].title);
                      const { firstName: artistFirstName, lastName: artistLastName } = splitName(
                        offeringsSongs[0].artist || "",
                      );

                      return (
                        <>
                          <div className="font-medium text-gray-900">{firstLine}</div>
                          {secondLine && <div className="text-gray-900">{secondLine}</div>}
                          {offeringsSongs[0].artist && (
                            <div className="text-xs text-gray-600 mt-1">
                              {artistFirstName}
                              {artistLastName && <div className="text-gray-500">{artistLastName}</div>}
                            </div>
                          )}
                        </>
                      );
                    })()}
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
                <div className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 bg-purple-200 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                    ✝️
                  </span>
                  <div className="min-w-0 flex-1">
                    {(() => {
                      const { firstLine, secondLine } = splitSongTitle(communionSongs[0].title);
                      const { firstName: artistFirstName, lastName: artistLastName } = splitName(
                        communionSongs[0].artist || "",
                      );

                      return (
                        <>
                          <div className="font-medium text-gray-900">{firstLine}</div>
                          {secondLine && <div className="text-gray-900">{secondLine}</div>}
                          {communionSongs[0].artist && (
                            <div className="text-xs text-gray-600 mt-1">
                              {artistFirstName}
                              {artistLastName && <div className="text-gray-500">{artistLastName}</div>}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Voices */}
          <div>
            {responsibleVoices.length > 0 && (
              <div className={`rounded-lg p-4 h-full ${isQuarantine ? 'bg-amber-900/30' : 'bg-blue-50'}`}>
                <div className={`text-sm font-semibold mb-3 ${isQuarantine ? 'text-amber-300' : 'text-blue-800'}`}>
                  Responsables de Voces
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {responsibleVoices.map((member) => {
                    const { firstName, lastName } = splitName(member.profiles?.full_name || "");
                    return (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full border-2 overflow-hidden ${
                          isQuarantine 
                            ? 'border-amber-400 bg-gradient-to-r from-amber-500 to-amber-600' 
                            : 'border-blue-200 bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}>
                          <img
                            src={member.profiles?.photo_url}
                            alt={member.profiles?.full_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = "none";
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <div className="w-full h-full hidden items-center justify-center text-white text-sm font-bold">
                            {getInitials(member.profiles?.full_name || "NN")}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className={`text-sm font-medium ${isQuarantine ? 'text-white' : 'text-gray-900'}`}>
                            {firstName}
                          </div>
                          {lastName && (
                            <div className={`text-xs ${isQuarantine ? 'text-gray-400' : 'text-gray-600'}`}>
                              {lastName}
                            </div>
                          )}
                          <div className={`text-xs ${isQuarantine ? 'text-amber-400' : 'text-blue-600'}`}>
                            {member.instrument}
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
          </>
        )}
      </div>
    );
  };

  if (isLoading) {
    return null;
  }

  if (!isVisible || services.length === 0) {
    return null;
  }

  // Detectar si algún servicio es de cuarentena o especial
  const hasQuarantineService = services.some(s => s.service_type === 'cuarentena');
  const hasSpecialEvent = services.some(s => s.service_type === 'especial' || s.leader === 'TODOS');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
      <div className="min-h-screen flex items-start justify-center py-8">
        <div
          className={`w-full max-w-4xl transition-all duration-300 ease-out ${
            isAnimating
              ? "animate-in slide-in-from-bottom-4 fade-in duration-300"
              : "animate-out slide-out-to-top-4 fade-out duration-300"
          }`}
        >
          {/* Special Event Banner */}
          {hasSpecialEvent && !hasQuarantineService && (
            <div 
              className="mb-2 rounded-t-xl p-3 flex items-center justify-center gap-2 text-white"
              style={{
                background: "linear-gradient(135deg, #E11D48 0%, #BE123C 100%)",
              }}
            >
              <span className="text-lg">🌟</span>
              <span className="font-semibold text-sm">SERVICIO ESPECIAL</span>
            </div>
          )}

          {/* Quarantine Banner */}
          {hasQuarantineService && !hasSpecialEvent && (
            <div 
              className="mb-2 rounded-t-xl p-3 flex items-center justify-center gap-2 text-white"
              style={{
                background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
              }}
            >
              <span className="text-lg">⚠️</span>
              <span className="font-semibold text-sm">PERÍODO DE CUARENTENA</span>
              <span className="text-xs opacity-90 ml-2">(12 Enero - 21 Febrero 2026)</span>
            </div>
          )}

          {/* Fixed Header */}
          <div 
            className={`p-4 border-b border-border sticky top-4 z-10 shadow-md ${
              (hasQuarantineService || hasSpecialEvent) ? 'rounded-none' : 'rounded-t-xl'
            }`}
            style={{
              background: hasSpecialEvent
                ? "linear-gradient(135deg, #881337 0%, #9f1239 100%)"
                : hasQuarantineService 
                  ? "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" 
                  : "white"
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{
                    background: hasSpecialEvent
                      ? "linear-gradient(135deg, #E11D48 0%, #BE123C 100%)"
                      : hasQuarantineService 
                        ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                        : "linear-gradient(to right, #a855f7, #ec4899)"
                  }}
                >
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${(hasQuarantineService || hasSpecialEvent) ? 'text-white' : 'text-foreground'}`}>
                    {hasSpecialEvent ? 'Servicio Especial' : hasQuarantineService ? 'Servicio de Cuarentena' : 'Programa de Servicios'}
                  </h2>
                  <p className={`text-sm ${hasSpecialEvent ? 'text-rose-200' : hasQuarantineService ? 'text-amber-200' : 'text-muted-foreground'}`}>
                    {format(parseServiceDate(services[0].service_date), "EEEE, dd 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-4">
                <div className={`flex rounded-lg p-1 ${hasQuarantineService ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <button
                    onClick={() => setActiveTab("services")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "services"
                        ? hasQuarantineService 
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white text-gray-900 shadow-sm"
                        : hasQuarantineService
                          ? "text-white/70 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Servicios
                  </button>
                  <button
                    onClick={() => setActiveTab("preparations")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "preparations"
                        ? hasQuarantineService 
                          ? "bg-amber-500 text-white shadow-sm"
                          : "bg-white text-gray-900 shadow-sm"
                        : hasQuarantineService
                          ? "text-white/70 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
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
                    className={`flex items-center gap-2 ${
                      hasQuarantineService ? 'border-amber-400 text-amber-400 hover:bg-amber-400/20' : ''
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    Guardar en Notificaciones
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeOverlay}
                    className={hasQuarantineService ? 'text-white hover:text-red-300' : 'text-destructive hover:text-destructive'}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-b-xl">
            {activeTab === "services" ? (
              <div className="p-6 space-y-6">
                {services
                  .sort((a, b) => {
                    const timeA = getServiceTime(a.title);
                    const timeB = getServiceTime(b.title);
                    // 8:00 AM debería aparecer antes que 10:45 AM
                    if (timeA === "8:00 AM" && timeB === "10:45 AM") return -1;
                    if (timeA === "10:45 AM" && timeB === "8:00 AM") return 1;
                    return 0;
                  })
                  .map((service) => (
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
                          "Revisar partituras y letras",
                          "Practicar canciones asignadas",
                          "Confirmar tonos y arreglos",
                          "Coordinar con el equipo",
                          "Revisar equipo de sonido",
                          "Llegar 30 minutos antes",
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
                              onNavigate("/communication");
                            } else {
                              window.location.href = "/communication";
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
                              onNavigate("/repertorio");
                            } else {
                              window.location.href = "/repertorio";
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
                              onNavigate("/agenda");
                            } else {
                              window.location.href = "/agenda";
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
                      <strong>Importante:</strong> Revise el programa completo y confirme su disponibilidad. En caso de
                      algún inconveniente, coordine los reemplazos necesarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 pb-6 flex items-center gap-3 justify-center flex-wrap">
              <Button
                variant="default"
                onClick={() => downloadServiceImage(services[0].id, "Primer Servicio")}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar 1er Servicio
              </Button>
              {services[1] && (
                <Button
                  variant="default"
                  onClick={() => downloadServiceImage(services[1].id, "Segundo Servicio")}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar 2do Servicio
                </Button>
              )}
              <Button variant="outline" onClick={closeOverlay} className="flex items-center gap-2">
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

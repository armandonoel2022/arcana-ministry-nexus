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
import { es } from "date-fns/locale";
import { toast } from "sonner";
import html2canvas from "html2canvas";

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
      "https://hfjtzmnphyizntcjzgar.supabase.co/storage/v1/object/public/member-photos/3d75bc74-76bb-454a-b3e0-d6e4de45d577.JPG",
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

// Función para crear notificación en el centro de notificaciones
const createServiceAgendaNotification = async (services: WeekendService[]) => {
  try {
    console.log("🎯 Creando notificación de agenda para", services.length, "servicios");

    const title = `Agenda de Presentaciones - ${format(new Date(services[0].service_date), "EEEE, dd 'de' MMMM", { locale: es })}`;

    // Crear mensaje estructurado
    let message = "📅 PROGRAMA DE SERVICIOS DEL FIN DE SEMANA\n\n";

    services.forEach((service, index) => {
      const serviceTime = getServiceTime(service.title);
      const groupName = service.worship_groups?.name || "Grupo de Alabanza";
      const director = service.leader || "Por asignar";

      message += `🎵 SERVICIO ${index + 1} - ${serviceTime}\n`;
      message += `   Dirige: ${director}\n`;
      message += `   Grupo: ${groupName}\n`;
      message += `   Hora: ${serviceTime}\n`;

      if (service.selected_songs && service.selected_songs.length > 0) {
        message += `   Canciones: ${service.selected_songs.map((s) => s.title).join(", ")}\n`;
      }

      message += "\n";
    });

    // Crear metadata detallada
    const metadata = {
      service_date: services[0].service_date,
      total_services: services.length,
      services_info: services.map((service) => ({
        id: service.id,
        time: getServiceTime(service.title),
        director: service.leader,
        group_name: service.worship_groups?.name || "Grupo de Alabanza",
        group_color: service.worship_groups?.color_theme || "#3B82F6",
        service_type: service.service_type || "regular",
        location: service.location || "Templo Principal",
        special_activity: service.special_activity,
        songs:
          service.selected_songs?.map((song) => ({
            id: song.id,
            title: song.title,
            artist: song.artist,
            order: song.song_order,
          })) || [],
        members:
          service.group_members?.map((member) => ({
            id: member.user_id,
            name: member.profiles?.full_name,
            role: member.instrument,
            is_leader: member.is_leader,
          })) || [],
      })),
    };

    // Insertar la notificación en system_notifications
    const { data, error } = await supabase
      .from("system_notifications")
      .insert({
        type: "service_overlay",
        title: title,
        message: message,
        recipient_id: null, // Para todos los usuarios
        notification_category: "agenda",
        priority: 2, // Prioridad media
        metadata: metadata,
        is_read: false,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creando notificación de agenda:", error);
      toast.error("No se pudo crear el registro de la agenda");
      return null;
    } else {
      console.log("✅ Notificación de agenda creada exitosamente:", data.id);
      toast.success("Agenda registrada en notificaciones");
      return data;
    }
  } catch (error) {
    console.error("❌ Error en createServiceAgendaNotification:", error);
    toast.error("Error al crear registro de agenda");
    return null;
  }
};

// Función COMPLEJA para determinar miembros del grupo basado en todas las reglas
const getGroupMembers = (
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

    if (is8AM) {
      // A las 8:00 AM: Maria del A. Santana (mic #4) y Guarionex Garcia (mic #3)
      mic4Member = MEMBER_IDS.MARIA_SANTANA;

      if (isGuarionex || guarionexInPrevOrNext) {
        // Si Guarionex es director o dirigió antes/después, Fredderid hace coros
        mic3Member = MEMBER_IDS.FREDDERID_ABRAHAN;
      } else {
        // Si Guarionex no es director, él hace coros a las 8 AM
        mic3Member = MEMBER_IDS.GUARIONEX_GARCIA;
      }
    } else if (is1045AM) {
      // A las 10:45 AM: Rosely Montero (mic #4) y Fredderid Abrahan (mic #3)
      mic4Member = MEMBER_IDS.ROSELY_MONTERO;
      mic3Member = MEMBER_IDS.FREDDERID_ABRAHAN;
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
      return { firstName: "Fior", lastName: "Daliza Paniagua" };
    }
    if (fullName.includes("Ruth")) {
      return { firstName: "Ruth", lastName: "Esmailin Ramirez" };
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
  const [notificationCreated, setNotificationCreated] = useState(false);

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

  // Cuando los servicios se cargan, crear la notificación automáticamente
  useEffect(() => {
    if (services.length > 0 && !notificationCreated && forceShow) {
      console.log("📱 Servicios cargados, creando notificación de agenda...");
      createServiceAgendaNotification(services);
      setNotificationCreated(true);
    }
  }, [services, notificationCreated, forceShow]);

  const showServiceProgramOverlay = (metadata: ServiceProgramNotification) => {
    if (metadata.services && Array.isArray(metadata.services)) {
      const formattedServices = metadata.services.map((service: any) => {
        const groupName = service.group || "Grupo de Aleida";
        const groupConfig = GROUP_CONFIG[groupName as keyof typeof GROUP_CONFIG] || GROUP_CONFIG["Grupo de Aleida"];
        const serviceTime = getServiceTime(service.time || service.title);
        const directorName = service.director?.name || service.director || "Por asignar";

        // USAR LA NUEVA FUNCIÓN PARA OBTENER MIEMBROS
        const members = getGroupMembers(groupName, serviceTime, directorName);

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
        const servicesWithMembers = await Promise.all(
          data.map(async (service) => {
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

            // USAR LA NUEVA FUNCIÓN PARA OBTENER MIEMBROS
            members = getGroupMembers(groupName, serviceTime, directorName);

            console.log(
              `Miembros finales para ${groupName}:`,
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

            return {
              ...service,
              leader: directorProfile?.full_name || service.leader,
              group_members: members.map((member, index) => ({
                id: `member-${service.id}-${index}`,
                user_id: member.id,
                instrument: `${member.voice} - ${member.mic}`,
                is_leader: false,
                profiles: {
                  id: member.id,
                  full_name: getFormattedName(member.name),
                  photo_url: member.photo_url,
                },
              })),
              selected_songs: selectedSongs,
              director_profile: directorProfile,
              worship_groups:
                Array.isArray(service.worship_groups) && service.worship_groups.length > 0
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
    const message = `Necesito ayuda para prepararme para el servicio "${service.title}" del ${format(new Date(service.service_date), "EEEE, dd 'de' MMMM", { locale: es })}. ¿Qué canciones debo practicar?`;
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

  const getServiceTime = (serviceTitle: string) => {
    if (
      serviceTitle.toLowerCase().includes("primera") ||
      serviceTitle.toLowerCase().includes("8:00") ||
      serviceTitle.toLowerCase().includes("primer")
    ) {
      return "8:00 AM";
    } else if (
      serviceTitle.toLowerCase().includes("segunda") ||
      serviceTitle.toLowerCase().includes("10:45") ||
      serviceTitle.toLowerCase().includes("segundo")
    ) {
      return "10:45 AM";
    }
    return serviceTitle;
  };

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

      // Crear un contenedor específico para la descarga
      const container = document.createElement("div");
      container.style.width = "600px";
      container.style.backgroundColor = "#ffffff";
      container.style.padding = "32px";
      container.style.fontFamily = "system-ui, -apple-system, sans-serif";
      container.style.color = "#1f2937";
      container.style.lineHeight = "1.5";

      // Header con mejor espaciado
      const header = document.createElement("div");
      header.style.marginBottom = "32px";
      header.style.textAlign = "center";

      const title = document.createElement("h1");
      title.textContent = "Programa de Servicios";
      title.style.fontSize = "28px";
      title.style.fontWeight = "bold";
      title.style.color = "#111827";
      title.style.marginBottom = "8px";
      title.style.letterSpacing = "-0.025em";

      const dateTime = document.createElement("p");
      const serviceDate = format(new Date(service.service_date), "EEEE, dd 'de' MMMM", { locale: es });
      dateTime.textContent = serviceDate;
      dateTime.style.fontSize = "18px";
      dateTime.style.color = "#6b7280";
      dateTime.style.textTransform = "capitalize";
      dateTime.style.fontWeight = "500";

      header.appendChild(title);
      header.appendChild(dateTime);

      // Línea separadora
      const separator = document.createElement("hr");
      separator.style.border = "none";
      separator.style.borderTop = "2px solid #e5e7eb";
      separator.style.margin = "24px 0";
      separator.style.width = "100%";

      header.appendChild(separator);

      // Service Info con mejor estructura
      const serviceInfo = document.createElement("div");
      serviceInfo.style.marginBottom = "32px";
      serviceInfo.style.textAlign = "center";

      const time = document.createElement("h2");
      time.textContent = getServiceTime(service.title);
      time.style.fontSize = "24px";
      time.style.fontWeight = "bold";
      time.style.color = "#1f2937";
      time.style.marginBottom = "12px";

      const groupInfo = document.createElement("div");
      groupInfo.style.display = "flex";
      groupInfo.style.alignItems = "center";
      groupInfo.style.justifyContent = "center";
      groupInfo.style.gap = "12px";
      groupInfo.style.marginBottom = "8px";
      groupInfo.style.flexWrap = "wrap";

      const groupName = document.createElement("span");
      groupName.textContent = service.worship_groups?.name || "Grupo de Alabanza";
      groupName.style.backgroundColor = service.worship_groups?.color_theme || "#3B82F6";
      groupName.style.color = "white";
      groupName.style.padding = "6px 16px";
      groupName.style.borderRadius = "9999px";
      groupName.style.fontSize = "16px";
      groupName.style.fontWeight = "600";
      groupName.style.letterSpacing = "-0.025em";

      const activity = document.createElement("span");
      activity.textContent = service.special_activity
        ? `Sección especial: ${service.special_activity}`
        : "Sección especial: Ninguna";
      activity.style.color = "#6b7280";
      activity.style.fontSize = "16px";
      activity.style.fontWeight = "500";

      groupInfo.appendChild(groupName);
      groupInfo.appendChild(activity);

      serviceInfo.appendChild(time);
      serviceInfo.appendChild(groupInfo);

      // Director Section con mejor espaciado
      const directorSection = document.createElement("div");
      directorSection.style.marginBottom = "32px";
      directorSection.style.textAlign = "center";

      const directorTitle = document.createElement("h3");
      directorTitle.textContent = "Director/a de Alabanza";
      directorTitle.style.fontSize = "20px";
      directorTitle.style.fontWeight = "bold";
      directorTitle.style.color = "#1e40af";
      directorTitle.style.marginBottom = "20px";
      directorTitle.style.textDecoration = "underline";

      const directorContent = document.createElement("div");
      directorContent.style.display = "flex";
      directorContent.style.flexDirection = "column";
      directorContent.style.alignItems = "center";
      directorContent.style.gap = "16px";

      // Director Avatar
      const directorAvatar = document.createElement("div");
      directorAvatar.style.width = "80px";
      directorAvatar.style.height = "80px";
      directorAvatar.style.borderRadius = "50%";
      directorAvatar.style.border = "4px solid #93c5fd";
      directorAvatar.style.overflow = "hidden";
      directorAvatar.style.background = "linear-gradient(to right, #3b82f6, #2563eb)";
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

      // Director Info
      const directorInfo = document.createElement("div");
      directorInfo.style.textAlign = "center";

      const directorName = document.createElement("div");
      directorName.textContent = service.leader;
      directorName.style.fontWeight = "bold";
      directorName.style.color = "#1f2937";
      directorName.style.fontSize = "20px";
      directorName.style.marginBottom = "4px";

      const directorRole = document.createElement("div");
      directorRole.textContent = "Líder del Servicio";
      directorRole.style.color = "#3b82f6";
      directorRole.style.fontSize = "16px";
      directorRole.style.fontWeight = "600";

      directorInfo.appendChild(directorName);
      directorInfo.appendChild(directorRole);

      directorContent.appendChild(directorAvatar);
      directorContent.appendChild(directorInfo);

      directorSection.appendChild(directorTitle);
      directorSection.appendChild(directorContent);

      // Songs Section con mejor estructura
      const songsSection = document.createElement("div");
      songsSection.style.marginBottom = "32px";

      const songsTitle = document.createElement("h3");
      songsTitle.textContent = "Canciones Seleccionadas";
      songsTitle.style.fontSize = "20px";
      songsTitle.style.fontWeight = "bold";
      songsTitle.style.color = "#15803d";
      songsTitle.style.marginBottom = "20px";
      songsTitle.style.textAlign = "center";
      songsTitle.style.textDecoration = "underline";

      songsSection.appendChild(songsTitle);

      const worshipSongs = service.selected_songs?.filter((s) => s.song_order >= 1 && s.song_order <= 4) || [];
      const offeringsSongs = service.selected_songs?.filter((s) => s.song_order === 5) || [];
      const communionSongs = service.selected_songs?.filter((s) => s.song_order === 6) || [];

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
          songItem.style.backgroundColor = "#f0fdf4";
          songItem.style.borderRadius = "12px";
          songItem.style.border = "1px solid #dcfce7";

          const number = document.createElement("div");
          number.textContent = (index + 1).toString();
          number.style.width = "32px";
          number.style.height = "32px";
          number.style.backgroundColor = "#22c55e";
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
          songFirstLine.style.color = "#1f2937";
          songFirstLine.style.fontSize = "18px";
          songFirstLine.style.marginBottom = "4px";

          songContent.appendChild(songFirstLine);

          if (secondLine) {
            const songSecondLine = document.createElement("div");
            songSecondLine.textContent = secondLine;
            songSecondLine.style.color = "#1f2937";
            songSecondLine.style.fontSize = "18px";
            songSecondLine.style.marginBottom = "8px";
            songContent.appendChild(songSecondLine);
          }

          if (song.artist) {
            const artistContainer = document.createElement("div");
            artistContainer.style.marginTop = "4px";

            const artistFirst = document.createElement("div");
            artistFirst.textContent = artistFirstName;
            artistFirst.style.color = "#6b7280";
            artistFirst.style.fontSize = "16px";
            artistFirst.style.fontWeight = "500";

            artistContainer.appendChild(artistFirst);

            if (artistLastName) {
              const artistLast = document.createElement("div");
              artistLast.textContent = artistLastName;
              artistLast.style.color = "#9ca3af";
              artistLast.style.fontSize = "14px";
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
        offeringSection.style.backgroundColor = "#fefce8";
        offeringSection.style.borderRadius = "12px";
        offeringSection.style.border = "1px solid #fde047";

        const offeringTitle = document.createElement("div");
        offeringTitle.textContent = "Canción de Ofrendas";
        offeringTitle.style.fontSize = "16px";
        offeringTitle.style.fontWeight = "bold";
        offeringTitle.style.color = "#92400e";
        offeringTitle.style.marginBottom = "8px";

        const { firstLine, secondLine } = splitSongTitle(offeringsSongs[0].title);
        const { firstName: artistFirstName, lastName: artistLastName } = splitName(offeringsSongs[0].artist || "");

        const offeringContent = document.createElement("div");
        offeringContent.style.paddingLeft = "8px";

        const offeringFirstLine = document.createElement("div");
        offeringFirstLine.textContent = firstLine;
        offeringFirstLine.style.fontWeight = "bold";
        offeringFirstLine.style.color = "#1f2937";
        offeringFirstLine.style.fontSize = "16px";

        offeringContent.appendChild(offeringFirstLine);

        if (secondLine) {
          const offeringSecondLine = document.createElement("div");
          offeringSecondLine.textContent = secondLine;
          offeringSecondLine.style.color = "#1f2937";
          offeringSecondLine.style.fontSize = "16px";
          offeringContent.appendChild(offeringSecondLine);
        }

        if (offeringsSongs[0].artist) {
          const artistDiv = document.createElement("div");
          artistDiv.textContent = artistFirstName;
          artistDiv.style.color = "#6b7280";
          artistDiv.style.fontSize = "14px";
          artistDiv.style.marginTop = "4px";
          offeringContent.appendChild(artistDiv);

          if (artistLastName) {
            const artistLast = document.createElement("div");
            artistLast.textContent = artistLastName;
            artistLast.style.color = "#9ca3af";
            artistLast.style.fontSize = "12px";
            offeringContent.appendChild(artistLast);
          }
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
        communionSection.style.backgroundColor = "#fae8ff";
        communionSection.style.borderRadius = "12px";
        communionSection.style.border = "1px solid #e9d5ff";

        const communionTitle = document.createElement("div");
        communionTitle.textContent = "Canción de Comunión";
        communionTitle.style.fontSize = "16px";
        communionTitle.style.fontWeight = "bold";
        communionTitle.style.color = "#6b21a8";
        communionTitle.style.marginBottom = "8px";

        const { firstLine, secondLine } = splitSongTitle(communionSongs[0].title);
        const { firstName: artistFirstName, lastName: artistLastName } = splitName(communionSongs[0].artist || "");

        const communionContent = document.createElement("div");
        communionContent.style.paddingLeft = "8px";

        const communionFirstLine = document.createElement("div");
        communionFirstLine.textContent = firstLine;
        communionFirstLine.style.fontWeight = "bold";
        communionFirstLine.style.color = "#1f2937";
        communionFirstLine.style.fontSize = "16px";

        communionContent.appendChild(communionFirstLine);

        if (secondLine) {
          const communionSecondLine = document.createElement("div");
          communionSecondLine.textContent = secondLine;
          communionSecondLine.style.color = "#1f2937";
          communionSecondLine.style.fontSize = "16px";
          communionContent.appendChild(communionSecondLine);
        }

        if (communionSongs[0].artist) {
          const artistDiv = document.createElement("div");
          artistDiv.textContent = artistFirstName;
          artistDiv.style.color = "#6b7280";
          artistDiv.style.fontSize = "14px";
          artistDiv.style.marginTop = "4px";
          communionContent.appendChild(artistDiv);

          if (artistLastName) {
            const artistLast = document.createElement("div");
            artistLast.textContent = artistLastName;
            artistLast.style.color = "#9ca3af";
            artistLast.style.fontSize = "12px";
            communionContent.appendChild(artistLast);
          }
        }

        communionSection.appendChild(communionTitle);
        communionSection.appendChild(communionContent);
        songsSection.appendChild(communionSection);
      }

      // Voices Section con mejor estructura
      const voicesSection = document.createElement("div");

      const voicesTitle = document.createElement("h3");
      voicesTitle.textContent = "Responsables de Voces";
      voicesTitle.style.fontSize = "20px";
      voicesTitle.style.fontWeight = "bold";
      voicesTitle.style.color = "#1e40af";
      voicesTitle.style.marginBottom = "20px";
      voicesTitle.style.textAlign = "center";
      voicesTitle.style.textDecoration = "underline";

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
          voiceItem.style.backgroundColor = "#dbeafe";
          voiceItem.style.borderRadius = "12px";
          voiceItem.style.border = "1px solid #93c5fd";

          // Voice Avatar
          const voiceAvatar = document.createElement("div");
          voiceAvatar.style.width = "60px";
          voiceAvatar.style.height = "60px";
          voiceAvatar.style.borderRadius = "50%";
          voiceAvatar.style.border = "3px solid #93c5fd";
          voiceAvatar.style.overflow = "hidden";
          voiceAvatar.style.background = "linear-gradient(to right, #3b82f6, #2563eb)";
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

          // Voice Info
          const voiceInfo = document.createElement("div");
          voiceInfo.style.flex = "1";
          voiceInfo.style.minWidth = "0";

          const voiceName = document.createElement("div");
          voiceName.textContent = firstName;
          voiceName.style.fontWeight = "bold";
          voiceName.style.color = "#1f2937";
          voiceName.style.fontSize = "18px";
          voiceName.style.marginBottom = "2px";

          voiceInfo.appendChild(voiceName);

          if (lastName) {
            const voiceLastName = document.createElement("div");
            voiceLastName.textContent = lastName;
            voiceLastName.style.color = "#6b7280";
            voiceLastName.style.fontSize = "16px";
            voiceLastName.style.marginBottom = "4px";
            voiceInfo.appendChild(voiceLastName);
          }

          const voiceInstrument = document.createElement("div");
          voiceInstrument.textContent = member.instrument;
          voiceInstrument.style.color = "#3b82f6";
          voiceInstrument.style.fontSize = "16px";
          voiceInstrument.style.fontWeight = "600";

          voiceInfo.appendChild(voiceInstrument);

          voiceItem.appendChild(voiceAvatar);
          voiceItem.appendChild(voiceInfo);
          voicesList.appendChild(voiceItem);
        });

        voicesSection.appendChild(voicesList);
      }

      // Assemble container con mejor espaciado
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
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      // Clean up
      document.body.removeChild(wrapper);

      // Download
      const link = document.createElement("a");
      link.download = `${serviceTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();

      toast.success("Imagen descargada exitosamente");
    } catch (error) {
      console.error("Error downloading service image:", error);
      toast.error("Error al descargar la imagen");
    }
  };

  // Nuevo diseño de ServiceCard mejorado
  const ServiceCard = ({ service }: { service: WeekendService }) => {
    const serviceTime = getServiceTime(service.title);
    const directorMember = service.group_members.find((m) => m.is_leader);
    const responsibleVoices = getResponsibleVoices(service.group_members).slice(0, 6);

    const worshipSongs = service.selected_songs?.filter((s) => s.song_order >= 1 && s.song_order <= 4) || [];
    const offeringsSongs = service.selected_songs?.filter((s) => s.song_order === 5) || [];
    const communionSongs = service.selected_songs?.filter((s) => s.song_order === 6) || [];

    return (
      <div
        ref={(el) => (serviceCardRefs.current[service.id] = el)}
        className="bg-white/90 rounded-xl p-6 border border-blue-200 shadow-lg mx-auto"
        style={{ maxWidth: "600px" }}
      >
        {/* Service Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-3 h-8 rounded-full"
            style={{
              background: `linear-gradient(to bottom, ${service.worship_groups?.color_theme || "#3B82F6"}99, ${service.worship_groups?.color_theme || "#3B82F6"})`,
            }}
          ></div>
          <div>
            <h3 className="text-xl font-bold text-blue-900">{service.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-sm font-medium px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: service.worship_groups?.color_theme || "#3B82F6" }}
              >
                {service.worship_groups?.name || "Grupo de Alabanza"}
              </span>
              <span className="text-sm text-gray-500">•</span>
              <span className="text-sm text-gray-600">
                {service.special_activity
                  ? `Sección especial: ${service.special_activity}`
                  : "Sección especial: Ninguna"}
              </span>
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
              <div className="bg-blue-50 rounded-lg p-4 h-full">
                <div className="text-sm font-semibold text-blue-800 mb-3">Responsables de Voces</div>
                <div className="grid grid-cols-1 gap-3">
                  {responsibleVoices.map((member) => {
                    const { firstName, lastName } = splitName(member.profiles?.full_name || "");
                    return (
                      <div key={member.id} className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-200 overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600">
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
                          <div className="text-sm font-medium text-gray-900">{firstName}</div>
                          {lastName && <div className="text-xs text-gray-600">{lastName}</div>}
                          <div className="text-xs text-blue-600">{member.instrument}</div>
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
              ? "animate-in slide-in-from-bottom-4 fade-in duration-300"
              : "animate-out slide-out-to-top-4 fade-out duration-300"
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
                  <h2 className="text-xl font-bold text-foreground">Programa de Servicios</h2>
                  <p className="text-muted-foreground text-sm">
                    {format(new Date(services[0].service_date), "EEEE, dd 'de' MMMM", { locale: es })}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("services")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "services"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Servicios
                  </button>
                  <button
                    onClick={() => setActiveTab("preparations")}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      activeTab === "preparations"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Preparación
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={saveToNotifications} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Guardar en Notificaciones
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

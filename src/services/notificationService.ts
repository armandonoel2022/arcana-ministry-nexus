/**
 * Servicio Unificado de Notificaciones ARCANA
 *
 * Este servicio centraliza todas las notificaciones de la app:
 * - Guardado en system_notifications (persistencia)
 * - Disparo de overlays visuales
 * - Envío de push notifications nativas
 */

import { supabase } from "@/integrations/supabase/client";

// Tipos de notificación definidos en el sistema (deben coincidir con enum en DB)
export type NotificationType =
  | "service_overlay"
  | "daily_verse"
  | "daily_advice"
  | "birthday"
  | "birthday_daily"
  | "birthday_monthly"
  | "death_announcement"
  | "meeting_announcement"
  | "special_service"
  | "prayer_request"
  | "blood_donation"
  | "extraordinary_rehearsal"
  | "ministry_instructions"
  | "director_replacement_request"
  | "director_replacement_response"
  | "director_change"
  | "song_selection"
  | "agenda_notification"
  | "service_program"
  | "special_event"
  | "general"
  | "system";

// Categorías de notificación
export type NotificationCategory =
  | "overlay"
  | "birthday"
  | "agenda"
  | "repertory"
  | "director"
  | "scheduled"
  | "general";

// Prioridades
export type NotificationPriority = 1 | 2 | 3; // 1=baja, 2=media, 3=alta

export interface CreateNotificationParams {
  type: NotificationType;
  title: string;
  message: string;
  recipientId?: string | null; // null = broadcast a todos
  metadata?: Record<string, any>;
  category?: NotificationCategory;
  priority?: NotificationPriority;
  showOverlay?: boolean;
  sendNativePush?: boolean;
  scheduledFor?: Date | null;
}

export interface NotificationResult {
  success: boolean;
  notificationId?: string;
  error?: string;
}

// Mapeo de tipos a categorías
const typeToCategory: Record<NotificationType, NotificationCategory> = {
  service_overlay: "overlay",
  daily_verse: "overlay",
  daily_advice: "overlay",
  birthday: "overlay",
  birthday_daily: "birthday",
  birthday_monthly: "birthday",
  death_announcement: "overlay",
  meeting_announcement: "overlay",
  special_service: "overlay",
  prayer_request: "overlay",
  blood_donation: "overlay",
  extraordinary_rehearsal: "overlay",
  ministry_instructions: "overlay",
  director_replacement_request: "director",
  director_replacement_response: "director",
  director_change: "director",
  song_selection: "repertory",
  agenda_notification: "agenda",
  service_program: "overlay",
  special_event: "overlay",
  general: "general",
  system: "general",
};

// Tipos que deben mostrar overlay automáticamente
const overlayTypes: NotificationType[] = [
  "service_overlay",
  "daily_verse",
  "daily_advice",
  "birthday",
  "death_announcement",
  "meeting_announcement",
  "special_service",
  "prayer_request",
  "blood_donation",
  "extraordinary_rehearsal",
  "ministry_instructions",
  "service_program",
  "special_event",
];

/**
 * Crear una notificación unificada
 */
export async function createNotification(params: CreateNotificationParams): Promise<NotificationResult> {
  const {
    type,
    title,
    message,
    recipientId = null,
    metadata = {},
    category = typeToCategory[type] || "general",
    priority = 2,
    showOverlay = overlayTypes.includes(type),
    sendNativePush = false, // MODIFICADO: false por defecto para Lovable
    scheduledFor = null,
  } = params;

  try {
    console.log("📬 [NotificationService] Creando notificación:", { type, title, recipientId, showOverlay });

    // Obtener usuario actual para sender_id
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const senderId = user?.id || null; // null si no hay usuario (sistema)

    // 1. Guardar en system_notifications (CORREGIDO: agregado sender_id y created_at)
    const notificationData = {
      type,
      title,
      message,
      recipient_id: recipientId,
      sender_id: senderId, // AGREGADO: campo requerido
      notification_category: category,
      priority,
      metadata: {
        ...metadata,
        created_via: "notification_service",
        show_overlay: showOverlay,
      },
      scheduled_for: scheduledFor?.toISOString() || null,
      is_read: false,
      created_at: new Date().toISOString(), // AGREGADO: campo requerido
    };

    const { data: notification, error: insertError } = await supabase
      .from("system_notifications")
      .insert(notificationData)
      .select("id")
      .single();

    if (insertError) {
      console.error("📬 [NotificationService] Error insertando:", insertError);
      return {
        success: false,
        error: `Error guardando notificación: ${insertError.message}`,
      };
    }

    console.log("📬 [NotificationService] Notificación guardada con ID:", notification?.id);

    // 2. Disparar overlay si es necesario y no está programado
    if (showOverlay && !scheduledFor) {
      setTimeout(() => {
        try {
          dispatchOverlayEvent({
            id: notification?.id || `notification-${Date.now()}`,
            type,
            title,
            message,
            metadata,
          });
        } catch (overlayError) {
          console.error("📬 [NotificationService] Error disparando overlay:", overlayError);
        }
      }, 100);
    }

    // 3. Enviar push nativa si está habilitado y no está programado
    if (sendNativePush && !scheduledFor) {
      await sendNativePushNotification({
        userId: recipientId,
        title,
        message,
        type,
        metadata,
      }).catch((error) => {
        console.error("📬 [NotificationService] Error en push (ignorado):", error);
      });
    }

    return {
      success: true,
      notificationId: notification?.id,
    };
  } catch (error) {
    console.error("📬 [NotificationService] Error:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Crear notificaciones broadcast (para todos los usuarios)
 */
export async function createBroadcastNotification(
  params: Omit<CreateNotificationParams, "recipientId">,
): Promise<NotificationResult> {
  console.log("📬 [NotificationService] Creando broadcast notification");

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const senderId = user?.id || null; // null si no hay usuario (sistema)

    // Para broadcast en Lovable, creamos solo una notificación sin recipient_id
    const notificationData = {
      type: params.type,
      title: params.title,
      message: params.message,
      recipient_id: null, // null = para todos
      sender_id: senderId,
      notification_category: params.category || typeToCategory[params.type] || "general",
      priority: params.priority || 2,
      metadata: {
        ...params.metadata,
        created_via: "notification_service",
        show_overlay: params.showOverlay ?? overlayTypes.includes(params.type),
        is_broadcast: true,
      },
      scheduled_for: params.scheduledFor?.toISOString() || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    console.log("📬 [NotificationService] Insertando notificación broadcast:", notificationData);

    const { data: notification, error } = await supabase
      .from("system_notifications")
      .insert(notificationData)
      .select("id")
      .single();

    if (error) {
      console.error("Error insertando broadcast:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    // Disparar overlay si es necesario
    if (params.showOverlay && !params.scheduledFor) {
      setTimeout(() => {
        try {
          dispatchOverlayEvent({
            id: notification?.id || `broadcast-${Date.now()}`,
            type: params.type,
            title: params.title,
            message: params.message,
            metadata: params.metadata,
          });
        } catch (overlayError) {
          console.error("Error disparando overlay broadcast:", overlayError);
        }
      }, 100);
    }

    return {
      success: true,
      notificationId: notification?.id,
    };
  } catch (error: any) {
    console.error("Error en broadcast:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Crear notificaciones para múltiples usuarios
 */
export async function createBulkNotifications(
  params: Omit<CreateNotificationParams, "recipientId">,
  recipientIds: string[],
): Promise<{ success: boolean; sentCount: number; errors: string[] }> {
  const errors: string[] = [];
  let sentCount = 0;

  for (const recipientId of recipientIds) {
    const result = await createNotification({
      ...params,
      recipientId,
      // Solo mostrar overlay para el primer usuario (evitar duplicados)
      showOverlay: sentCount === 0 ? params.showOverlay : false,
    });

    if (result.success) {
      sentCount++;
    } else {
      errors.push(result.error || "Error desconocido");
    }
  }

  return {
    success: errors.length === 0,
    sentCount,
    errors,
  };
}

/**
 * Disparar evento de overlay
 */
export function dispatchOverlayEvent(data: {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}): void {
  console.log("📬 [NotificationService] Disparando overlay:", data.type);

  // Verificar si window existe (seguridad para SSR)
  if (typeof window === "undefined") {
    console.log("⚠️  No se puede disparar overlay (sin window)");
    return;
  }

  try {
    // Disparar evento genérico showOverlay
    window.dispatchEvent(
      new CustomEvent("showOverlay", {
        detail: {
          id: data.id,
          type: data.type,
          title: data.title,
          message: data.message,
          metadata: data.metadata || {},
        },
      }),
    );

    // Disparar eventos específicos según el tipo
    switch (data.type) {
      case "service_overlay":
        window.dispatchEvent(new CustomEvent("showServiceOverlay"));
        break;
      case "daily_verse":
        window.dispatchEvent(
          new CustomEvent("showVerseOverlay", {
            detail: {
              verseText: data.metadata?.verse_text || data.message,
              verseReference: data.metadata?.verse_reference || "",
            },
          }),
        );
        break;
      case "daily_advice":
        window.dispatchEvent(
          new CustomEvent("showAdviceOverlay", {
            detail: {
              title: data.metadata?.advice_title || data.title,
              message: data.metadata?.advice_message || data.message,
            },
          }),
        );
        break;
      case "blood_donation":
        window.dispatchEvent(
          new CustomEvent("showBloodDonationOverlay", {
            detail: data.metadata,
          }),
        );
        break;
      case "extraordinary_rehearsal":
        window.dispatchEvent(
          new CustomEvent("showRehearsalOverlay", {
            detail: data.metadata,
          }),
        );
        break;
      case "ministry_instructions":
        window.dispatchEvent(
          new CustomEvent("showInstructionsOverlay", {
            detail: {
              title: data.title,
              instructions: data.message,
              ...data.metadata,
            },
          }),
        );
        break;
      case "death_announcement":
      case "meeting_announcement":
      case "special_service":
      case "prayer_request":
        window.dispatchEvent(
          new CustomEvent("showAnnouncementOverlay", {
            detail: {
              type: data.type,
              title: data.title,
              message: data.message,
              ...data.metadata,
            },
          }),
        );
        break;
    }
  } catch (error) {
    console.error("Error disparando overlay:", error);
  }
}

/**
 * Enviar notificación push nativa - VERSIÓN SIMULADA para Lovable
 */
async function sendNativePushNotification(params: {
  userId: string | null;
  title: string;
  message: string;
  type: NotificationType;
  metadata?: Record<string, any>;
}): Promise<void> {
  // EN LOVABLE NO USAMOS PUSH REALES - solo simulación
  console.log("📬 [NotificationService] Push nativo simulado para:", params.userId || "broadcast");
  return Promise.resolve();
}

/**
 * Marcar notificación como leída
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("system_notifications").update({ is_read: true }).eq("id", notificationId);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Obtener notificaciones del usuario actual
 */
export async function getUserNotifications(options?: {
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}): Promise<any[]> {
  const { limit = 50, unreadOnly = false, type } = options || {};

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from("system_notifications")
    .select("*")
    .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("is_read", false);
  }

  if (type) {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }

  return data || [];
}

// Funciones de conveniencia para tipos específicos

/**
 * Crear notificación de cumpleaños
 */
export function createBirthdayNotification(params: {
  memberName: string;
  memberPhoto?: string;
  memberId: string;
  recipientId?: string;
}) {
  return createNotification({
    type: "birthday",
    title: `🎂 ¡Feliz Cumpleaños ${params.memberName}!`,
    message: `¡Hoy está de cumpleaños ${params.memberName}! Envíale una felicitación.`,
    recipientId: params.recipientId,
    category: "birthday",
    priority: 3,
    metadata: {
      birthday_member_id: params.memberId,
      birthday_member_name: params.memberName,
      birthday_member_photo: params.memberPhoto,
      show_confetti: true,
      play_birthday_sound: true,
    },
  });
}

/**
 * Crear notificación de reemplazo de director
 */
export function createDirectorReplacementNotification(params: {
  recipientId: string;
  originalDirector: string;
  replacementDirector: string;
  serviceDate: string;
  status: "pending" | "accepted" | "rejected";
  requestId: string;
}) {
  const statusMessages = {
    pending: `${params.originalDirector} te solicita reemplazarle como director el ${params.serviceDate}`,
    accepted: `${params.replacementDirector} aceptó reemplazarte como director el ${params.serviceDate}`,
    rejected: `${params.replacementDirector} rechazó la solicitud de reemplazo para el ${params.serviceDate}`,
  };

  return createNotification({
    type: "director_replacement_request",
    title: "Solicitud de Reemplazo",
    message: statusMessages[params.status],
    recipientId: params.recipientId,
    category: "director",
    priority: 3,
    showOverlay: true,
    metadata: {
      request_id: params.requestId,
      original_director: params.originalDirector,
      replacement_director: params.replacementDirector,
      service_date: params.serviceDate,
      status: params.status,
    },
  });
}

/**
 * Crear notificación de selección de canción
 */
export function createSongSelectionNotification(params: {
  songTitle: string;
  serviceDate: string;
  selectedBy: string;
  recipientId?: string;
}) {
  return createNotification({
    type: "song_selection",
    title: "Nueva Canción Seleccionada",
    message: `${params.selectedBy} seleccionó "${params.songTitle}" para el servicio del ${params.serviceDate}`,
    recipientId: params.recipientId,
    category: "repertory",
    priority: 2,
    showOverlay: false,
    metadata: {
      song_title: params.songTitle,
      service_date: params.serviceDate,
      selected_by: params.selectedBy,
    },
  });
}

/**
 * Crear notificación de donación de sangre urgente
 */
export function createBloodDonationNotification(params: {
  recipientName: string;
  bloodType: string;
  medicalCenter: string;
  contactPhone: string;
  familyMember: string;
  urgencyLevel?: "normal" | "high" | "urgent";
}) {
  return createBroadcastNotification({
    type: "blood_donation",
    title: "🩸 Donación de Sangre Urgente",
    message: `Se necesita sangre tipo ${params.bloodType} para ${params.recipientName}`,
    category: "overlay",
    priority: 3,
    showOverlay: true,
    metadata: {
      recipient_name: params.recipientName,
      blood_type: params.bloodType,
      medical_center: params.medicalCenter,
      contact_phone: params.contactPhone,
      family_member: params.familyMember,
      urgency_level: params.urgencyLevel || "urgent",
    },
  });
}

/**
 * Crear notificación de ensayo extraordinario
 */
export function createExtraordinaryRehearsalNotification(params: {
  rehearsalDate: string;
  rehearsalTime: string;
  activityName: string;
  location?: string;
  notes?: string;
}) {
  return createBroadcastNotification({
    type: "extraordinary_rehearsal",
    title: "🎵 Ensayo Extraordinario",
    message: `Ensayo para ${params.activityName} el ${params.rehearsalDate} a las ${params.rehearsalTime}`,
    category: "overlay",
    priority: 3,
    showOverlay: true,
    metadata: {
      rehearsal_date: params.rehearsalDate,
      rehearsal_time: params.rehearsalTime,
      activity_name: params.activityName,
      location: params.location,
      notes: params.notes,
    },
  });
}

/**
 * Crear notificación de instrucciones ministeriales
 */
export function createMinistryInstructionsNotification(params: {
  title: string;
  instructions: string;
  priority?: NotificationPriority;
}) {
  return createBroadcastNotification({
    type: "ministry_instructions",
    title: params.title,
    message: params.instructions,
    category: "overlay",
    priority: params.priority || 2,
    showOverlay: true,
    metadata: {
      instructions: params.instructions,
    },
  });
}

export default {
  createNotification,
  createBroadcastNotification,
  createBulkNotifications,
  dispatchOverlayEvent,
  markNotificationAsRead,
  getUserNotifications,
  createBirthdayNotification,
  createDirectorReplacementNotification,
  createSongSelectionNotification,
  createBloodDonationNotification,
  createExtraordinaryRehearsalNotification,
  createMinistryInstructionsNotification,
};

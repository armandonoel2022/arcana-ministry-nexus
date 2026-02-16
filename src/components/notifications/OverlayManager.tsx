import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import ServiceNotificationOverlay from "./ServiceNotificationOverlay";
import { DailyVerseOverlay } from "./DailyVerseOverlay";
import { DailyAdviceOverlay } from "./DailyAdviceOverlay";
import GeneralAnnouncementOverlay from "./GeneralAnnouncementOverlay";
import MinistryInstructionsOverlay from "./MinistryInstructionsOverlay";
import ExtraordinaryRehearsalOverlay from "./ExtraordinaryRehearsalOverlay";
import BloodDonationOverlay from "./BloodDonationOverlay";
import PregnancyRevealOverlay from "./PregnancyRevealOverlay";
import BirthAnnouncementOverlay from "./BirthAnnouncementOverlay";
import DirectorChangeOverlay from "./DirectorChangeOverlay";
import SpecialEventOverlay from "./SpecialEventOverlay";
import VoiceReplacementOverlay from "./VoiceReplacementOverlay";
import QuarantineServiceOverlay from "./QuarantineServiceOverlay";
import { toast } from "sonner";
import { createBroadcastNotification, NotificationType } from "@/services/notificationService";

interface OverlayData {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: any;
}

// Custom event types for type safety
declare global {
  interface WindowEventMap {
    showOverlay: CustomEvent<OverlayData>;
    showServiceOverlay: CustomEvent<void>;
    showVerseOverlay: CustomEvent<{ verseText: string; verseReference: string }>;
    showAdviceOverlay: CustomEvent<{ title: string; message: string }>;
    showBloodDonationOverlay: CustomEvent<any>;
    showRehearsalOverlay: CustomEvent<any>;
    showInstructionsOverlay: CustomEvent<any>;
    showAnnouncementOverlay: CustomEvent<any>;
  }
}

// Key para persistir estado de inicialización durante la sesión
const OVERLAY_INIT_KEY = 'overlay_manager_initialized_session';

// Helper para verificar si es una verdadera "nueva sesión" de la app
const isNewAppSession = (): boolean => {
  const initData = sessionStorage.getItem(OVERLAY_INIT_KEY);
  if (!initData) return true;
  
  try {
    const { timestamp } = JSON.parse(initData);
    // Si han pasado más de 30 minutos desde la última inicialización, es nueva sesión
    const thirtyMinutes = 30 * 60 * 1000;
    return Date.now() - timestamp > thirtyMinutes;
  } catch {
    return true;
  }
};

const markAppSessionInitialized = (): void => {
  sessionStorage.setItem(OVERLAY_INIT_KEY, JSON.stringify({
    timestamp: Date.now(),
    initialized: true
  }));
};

const OverlayManager: React.FC = () => {
  const navigate = useNavigate();
  const [activeOverlay, setActiveOverlay] = useState<OverlayData | null>(null);
  const [overlayType, setOverlayType] = useState<string | null>(null);
  // Solo marcar como "no inicializado" si es una nueva sesión real
  const hasInitialized = useRef(!isNewAppSession());
  const currentUserId = useRef<string | null>(null);
  const isMounted = useRef(true);
  const lastScheduledCheck = useRef<number>(0);
  const scheduledNotificationsChecked = useRef<Set<string>>(new Set());

  // Function to save overlay notification to database if it doesn't exist
  // NOTA: Esta función ya no guarda overlays diarios - esos se manejan externamente
  const saveOverlayToNotifications = useCallback(async (notification: OverlayData) => {
    // Only save if it's a scheduled/test/broadcast overlay (NOT previews)
    const isTemporaryId =
      notification.id.startsWith("scheduled-") ||
      notification.id.startsWith("test-") ||
      notification.id.startsWith("broadcast-") ||
      notification.id.startsWith("notification-");
    
    if (!isTemporaryId) {
      console.log("📱 [OverlayManager] Overlay ya tiene ID de BD, no se guarda nuevamente");
      return;
    }

    // IMPORTANTE: Los overlays diarios NO deben crear duplicados
    // El sistema programado ya crea las notificaciones en la BD
    const skipSaveTypes = ['service_overlay', 'daily_verse', 'daily_advice'];
    if (skipSaveTypes.includes(notification.type)) {
      console.log("📱 [OverlayManager] Overlay diario - no se crea duplicado en BD:", notification.type);
      return;
    }

    try {
      console.log("📱 [OverlayManager] Guardando overlay en centro de notificaciones:", notification.type);
      
      // Use the notification service to create a persistent notification
      await createBroadcastNotification({
        type: notification.type as NotificationType,
        title: notification.title,
        message: notification.message,
        metadata: {
          ...notification.metadata,
          saved_from_overlay: true,
          original_id: notification.id,
        },
        showOverlay: false, // Don't trigger another overlay, we're already showing it
      });
      
      console.log("📱 [OverlayManager] ✅ Overlay guardado exitosamente en centro de notificaciones");
    } catch (error) {
      console.error("📱 [OverlayManager] Error guardando overlay:", error);
    }
  }, []);

  // Track currently showing overlay ID to prevent duplicates
  const currentOverlayId = useRef<string | null>(null);
  
  // Queue for pending overlays (moved before showOverlay since it's used inside)
  const overlayQueue = useRef<OverlayData[]>([]);
  const isProcessingQueue = useRef(false);
  
  // Track overlays shown in this session to prevent repeats
  const shownInSession = useRef<Set<string>>(new Set());

  // Helper to generate a stable key for an overlay (ignoring timestamps in IDs)
  // IMPORTANTE: Para tipos diarios como daily_verse y daily_advice, usamos tipo+fecha para evitar duplicados
  const getOverlaySessionKey = useCallback((notification: OverlayData): string => {
    // For test/preview, don't track (allow multiple tests)
    if (notification.id.startsWith('preview-') || notification.id.startsWith('test-')) {
      return '';
    }
    
    // Obtener fecha de hoy en zona horaria dominicana
    const dominicanNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' }));
    const todayKey = dominicanNow.toISOString().split('T')[0];
    
    // Para tipos diarios, usar tipo+fecha (no ID) para evitar duplicados del mismo día
    const dailyTypes = ['daily_verse', 'daily_advice', 'service_overlay'];
    if (dailyTypes.includes(notification.type)) {
      return `${notification.type}_${todayKey}`;
    }
    
    // For scheduled/backup overlays, use type + base ID
    if (notification.id.startsWith('scheduled-')) {
      const parts = notification.id.split('-');
      const baseId = parts.slice(0, 3).join('-');
      return `${notification.type}_${baseId}`;
    }
    
    // For regular notifications, use the actual ID
    return `${notification.type}_${notification.id}`;
  }, []);

  // Function to show overlay with safety check
  const showOverlay = useCallback(
    (notification: OverlayData) => {
      if (!isMounted.current) return;

      console.log("📱 [OverlayManager] showOverlay()", {
        id: notification.id,
        type: notification.type,
        currentId: currentOverlayId.current,
      });

      const isPreview = notification.id?.startsWith("preview-");
      const isTest = notification.id?.startsWith("test-");
      const isFromNotificationCenter = notification.id?.startsWith("notification-click-");

      // CONTROL DE SESIÓN: Verificar si ya se mostró en esta sesión
      const sessionKey = getOverlaySessionKey(notification);
      if (sessionKey && !isPreview && !isTest && !isFromNotificationCenter) {
        // Check both our Set AND sessionStorage for redundancy
        if (shownInSession.current.has(sessionKey) || sessionStorage.getItem(`overlay_session_${sessionKey}`)) {
          console.log("📱 [OverlayManager] ⚠️ Overlay ya mostrado en esta sesión, ignorando:", sessionKey);
          return;
        }
      }

      // For notification center clicks, always allow reopening (use unique timestamp ID)
      if (isFromNotificationCenter) {
        console.log("📱 [OverlayManager] Overlay desde NotificationCenter, permitiendo siempre");
        currentOverlayId.current = notification.id;
        
        // Special handling for birthday overlays
        if (notification.type === 'birthday' || notification.type === 'birthday_daily') {
          const memberData = notification.metadata || {};
          window.dispatchEvent(new CustomEvent('testBirthdayOverlay', {
            detail: {
              id: memberData.birthday_member_id || memberData.member_id || notification.id,
              nombres: memberData.birthday_member_name?.split(' ')[0] || 'Cumpleañero',
              apellidos: memberData.birthday_member_name?.split(' ').slice(1).join(' ') || '',
              photo_url: memberData.birthday_member_photo,
              cargo: memberData.member_role || 'Integrante',
              fecha_nacimiento: memberData.birthday_date || new Date().toISOString().split('T')[0],
            }
          }));
          return;
        }
        
        setActiveOverlay(notification);
        setOverlayType(notification.type);
        return;
      }

      // PREVENT duplicate overlays - if same ID is already showing, skip
      if (currentOverlayId.current === notification.id) {
        console.log("📱 [OverlayManager] Overlay ya visible, ignorando duplicado:", notification.id);
        return;
      }

      // Previews should always be immediate/replacing (never queued)
      if (isPreview) {
        currentOverlayId.current = notification.id;
        setActiveOverlay(notification);
        setOverlayType(notification.type);
        return;
      }

      // Non-preview: if an overlay is already active, queue it (but check if not already in queue)
      if (currentOverlayId.current) {
        // Check if already in queue
        const alreadyQueued = overlayQueue.current.some(q => getOverlaySessionKey(q) === sessionKey);
        if (alreadyQueued) {
          console.log("📱 [OverlayManager] Overlay ya en cola, ignorando:", notification.type);
          return;
        }
        console.log("📱 [OverlayManager] Overlay activo, añadiendo a cola:", notification.type);
        overlayQueue.current.push(notification);
        return;
      }

      // MARCAR COMO MOSTRADO EN SESIÓN antes de mostrarlo
      if (sessionKey) {
        shownInSession.current.add(sessionKey);
        sessionStorage.setItem(`overlay_session_${sessionKey}`, 'true');
        console.log("📱 [OverlayManager] ✅ Marcando overlay como mostrado en sesión:", sessionKey);
      }

      console.log("📱 [OverlayManager] Mostrando overlay:", notification.type, notification.id);

      // MARCAR COMO LEÍDO EN LA BD INMEDIATAMENTE (para evitar que otros dispositivos/polls lo vuelvan a mostrar)
      if (notification.id && !notification.id.startsWith("preview-") && !notification.id.startsWith("test-") && !notification.id.startsWith("scheduled-")) {
        (async () => {
          try {
            await supabase.from("system_notifications").update({ is_read: true }).eq("id", notification.id);
            console.log("📱 [OverlayManager] ✅ Marcado como leído en BD:", notification.id);
          } catch (err) {
            console.error("📱 [OverlayManager] Error marcando leído:", err);
          }
        })();
      }

    // Special handling for birthday overlays - dispatch to BirthdayOverlay component
    if (notification.type === 'birthday' || notification.type === 'birthday_daily') {
      const memberData = notification.metadata || {};
      window.dispatchEvent(new CustomEvent('testBirthdayOverlay', {
        detail: {
          id: memberData.birthday_member_id || memberData.member_id || notification.id,
          nombres: memberData.birthday_member_name?.split(' ')[0] || 'Cumpleañero',
          apellidos: memberData.birthday_member_name?.split(' ').slice(1).join(' ') || '',
          photo_url: memberData.birthday_member_photo,
          cargo: memberData.member_role || 'Integrante',
          fecha_nacimiento: memberData.birthday_date || new Date().toISOString().split('T')[0],
        }
      }));
      // Mark as read if it has a real ID, or save if temporary
      if (notification.id && !notification.id.startsWith('preview-') && !notification.id.startsWith('test-')) {
        supabase.from('system_notifications').update({ is_read: true }).eq('id', notification.id);
      } else {
        saveOverlayToNotifications(notification);
      }
      return; // Don't show in generic overlay, BirthdayOverlay handles it
    }

    // Save overlay to notifications center if it has a temporary ID
    saveOverlayToNotifications(notification);

    // Set overlay directly without clearing first (prevents flicker)
    currentOverlayId.current = notification.id;
    setActiveOverlay(notification);
    setOverlayType(notification.type);
  }, [saveOverlayToNotifications, getOverlaySessionKey]);

  // Function to dismiss overlay and mark as read
  const handleDismiss = useCallback(async () => {
    if (
      activeOverlay &&
      activeOverlay.id &&
      !activeOverlay.id.startsWith("preview-") &&
      !activeOverlay.id.startsWith("test-") &&
      !activeOverlay.id.startsWith("scheduled-")
    ) {
      try {
        console.log("📱 [OverlayManager] Marcando notificación como leída:", activeOverlay.id);
        await supabase.from("system_notifications").update({ is_read: true }).eq("id", activeOverlay.id);
      } catch (error) {
        console.error("Error marcando notificación como leída:", error);
      }
    }

    // Clear the current overlay reference
    currentOverlayId.current = null;
    setActiveOverlay(null);
    setOverlayType(null);
  }, [activeOverlay]);

  // Process next overlay in queue
  const processNextOverlay = useCallback(() => {
    if (overlayQueue.current.length === 0) {
      isProcessingQueue.current = false;
      return;
    }

    const nextOverlay = overlayQueue.current.shift();
    if (nextOverlay) {
      showOverlay(nextOverlay);
    }
  }, [showOverlay]);

  // Enhanced dismiss that processes queue
  const handleDismissWithQueue = useCallback(async () => {
    await handleDismiss();
    // Small delay before showing next overlay
    setTimeout(() => {
      processNextOverlay();
    }, 500);
  }, [handleDismiss, processNextOverlay]);

  // Función helper para obtener títulos por defecto - MOVED UP before checkPendingOverlays
  const getDefaultTitle = useCallback((type: string): string => {
    const titles: Record<string, string> = {
      service_overlay: "Programa de Servicios",
      daily_verse: "Versículo del Día",
      daily_advice: "Consejo del Día",
      death_announcement: "Anuncio de Fallecimiento",
      meeting_announcement: "Convocatoria a Reunión",
      special_service: "Servicio Especial",
      prayer_request: "Solicitud de Oración",
      blood_donation: "Donación de Sangre Urgente",
      extraordinary_rehearsal: "Ensayo Extraordinario",
      ministry_instructions: "Instrucciones a Integrantes",
      pregnancy_reveal: "Revelación de Embarazo",
      birth_announcement: "Anuncio de Nacimiento",
    };
    return titles[type] || "Notificación";
  }, []);

  // Check for pending overlays AND missed scheduled notifications when component mounts
  const checkPendingOverlays = useCallback(async () => {
    // Prevent multiple initializations - AHORA USANDO PERSISTENCIA DE SESIÓN
    if (hasInitialized.current) {
      console.log("📱 [OverlayManager] Ya inicializado en esta sesión, ignorando verificación de overlays");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.log("📱 [OverlayManager] No hay usuario autenticado");
        return;
      }

      currentUserId.current = user.id;
      hasInitialized.current = true;
      // Persistir que ya inicializamos en esta sesión
      markAppSessionInitialized();
      console.log("📱 [OverlayManager] ✅ Primera inicialización de sesión para usuario:", user.id);

      // Only get overlay types that should show as modal overlays (NOT regular notifications)
      const overlayTypes = [
        "service_overlay",
        "daily_verse",
        "daily_advice",
        "birthday",
        "birthday_daily",
        "death_announcement",
        "meeting_announcement",
        "special_service",
        "prayer_request",
        "blood_donation",
        "extraordinary_rehearsal",
        "ministry_instructions",
        "pregnancy_reveal",
        "birth_announcement",
        "director_change",
        "special_event",
        "voice_replacement",
      ];

      // Get ALL pending notifications from system_notifications (not just 1)
      const { data: pendingNotifications, error } = await supabase
        .from("system_notifications")
        .select("*")
        .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
        .eq("is_read", false)
        .in("type", overlayTypes)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: true }); // Oldest first

      if (error) {
        console.error("Error checking pending overlays:", error);
      }

      // ALSO check for scheduled notifications that should have triggered TODAY
      const rdNow = new Date();
      const dominicanTime = new Date(rdNow.toLocaleString("en-US", { timeZone: "America/Santo_Domingo" }));
      const currentDay = dominicanTime.getDay();
      const currentHour = dominicanTime.getHours();
      const currentMinute = dominicanTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const todayDateKey = dominicanTime.toISOString().split('T')[0];

      // Fetch scheduled notifications for today
      const { data: scheduledNotifications } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .contains("days_of_week", [currentDay])
        .eq("is_active", true);

      const missedScheduledOverlays: OverlayData[] = [];

      if (scheduledNotifications && scheduledNotifications.length > 0) {
        console.log("📱 [OverlayManager] Verificando notificaciones programadas para hoy:", scheduledNotifications.length);

        for (const scheduled of scheduledNotifications) {
          // Parse scheduled time
          const timeParts = scheduled.time.split(':');
          const scheduledHour = parseInt(timeParts[0], 10);
          const scheduledMinute = parseInt(timeParts[1], 10);
          const scheduledTimeInMinutes = scheduledHour * 60 + scheduledMinute;

          // If scheduled time has already passed today
          if (scheduledTimeInMinutes <= currentTimeInMinutes) {
            // Check if we've already shown this one today (using localStorage for persistence across sessions)
            const shownKey = `scheduled_shown_${scheduled.id}_${todayDateKey}`;
            
            if (!localStorage.getItem(shownKey)) {
              console.log(`📱 [OverlayManager] Notificación programada perdida encontrada: ${scheduled.name} (${scheduled.time})`);
              
              // Mark as shown for today
              localStorage.setItem(shownKey, "true");
              
              missedScheduledOverlays.push({
                id: `scheduled-missed-${scheduled.id}-${Date.now()}`,
                type: scheduled.notification_type,
                title: scheduled.name || getDefaultTitle(scheduled.notification_type),
                message: scheduled.description || "",
                metadata: scheduled.metadata || {},
              });
            }
          }
        }
      }

      // Combine pending system notifications with missed scheduled overlays
      const allOverlaysToShow: OverlayData[] = [];

      if (pendingNotifications && pendingNotifications.length > 0) {
        console.log(`📱 [OverlayManager] ${pendingNotifications.length} overlays pendientes en system_notifications`);

        // Filter out already shown in this session AND deduplicate by type+date for ALL daily types
        const seenTypes = new Set<string>();
        const dailyTypes = ['service_overlay', 'daily_verse', 'daily_advice'];
        
        const notShownNotifications = pendingNotifications.filter(notification => {
          // For daily types, use type+date key for deduplication (ONLY ONE PER DAY)
          if (dailyTypes.includes(notification.type)) {
            const typeKey = `${notification.type}_${todayDateKey}`;
            if (seenTypes.has(typeKey) || sessionStorage.getItem(`overlay_session_${typeKey}`)) {
              console.log(`📱 [OverlayManager] Ignorando ${notification.type} duplicado del día`);
              return false;
            }
            seenTypes.add(typeKey);
            sessionStorage.setItem(`overlay_session_${typeKey}`, "true");
            return true;
          }
          
          // For other types, use standard session key format
          const sessionKey = `overlay_session_${notification.type}_${notification.id}`;
          if (sessionStorage.getItem(sessionKey)) {
            return false;
          }
          
          return true;
        });

        notShownNotifications.forEach(notification => {
          const sessionKey = `overlay_session_${notification.type}_${notification.id}`;
          sessionStorage.setItem(sessionKey, "true");
          allOverlaysToShow.push({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata || {},
          });
        });
      }

      // Add missed scheduled overlays
      if (missedScheduledOverlays.length > 0) {
        console.log(`📱 [OverlayManager] ${missedScheduledOverlays.length} overlays programados perdidos encontrados`);
        allOverlaysToShow.push(...missedScheduledOverlays);
      }

      // Add all to queue and start processing
      if (allOverlaysToShow.length > 0) {
        console.log(`📱 [OverlayManager] Total de overlays a mostrar: ${allOverlaysToShow.length}`);
        allOverlaysToShow.forEach(overlay => {
          overlayQueue.current.push(overlay);
        });

        // Start processing queue
        if (!isProcessingQueue.current) {
          isProcessingQueue.current = true;
          processNextOverlay();
        }
      } else {
        console.log("📱 [OverlayManager] No hay overlays pendientes para mostrar");
      }
    } catch (error) {
      console.error("Error in checkPendingOverlays:", error);
    }
  }, [showOverlay, processNextOverlay, getDefaultTitle]);

  // Función MEJORADA para verificar notificaciones programadas - SISTEMA DE BACKUP
  // Solo se ejecuta cuando HAY una coincidencia de hora exacta
  const checkScheduledNotifications = useCallback(async () => {
    if (!isMounted.current) return;

    const now = Date.now();
    // Evitar verificar demasiado frecuentemente (mínimo 60 segundos para reducir ruido)
    if (now - lastScheduledCheck.current < 60000) {
      return;
    }

    lastScheduledCheck.current = now;

    try {
      // Get current time in Dominican Republic
      const rdNow = new Date();
      const dominicanTime = new Date(rdNow.toLocaleString("en-US", { timeZone: "America/Santo_Domingo" }));

      const currentDay = dominicanTime.getDay();
      const currentHour = dominicanTime.getHours();
      const currentMinute = dominicanTime.getMinutes();

      // Formato HH:MM para comparación flexible
      const currentTimeFormatted = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
      const currentTimeWithSeconds = `${currentTimeFormatted}:00`;

      // Solo loguear si estamos en un minuto donde PUEDE haber coincidencia
      // (reducir spam de logs)

      // Buscar notificaciones programadas para HOY
      const { data: scheduledNotifications, error } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .contains("days_of_week", [currentDay])
        .eq("is_active", true);

      if (error) {
        console.error("⏰ [OverlayManager] Error buscando notificaciones:", error);
        return;
      }

      // Solo loguear si encontramos algo Y hay coincidencia de tiempo
      if (scheduledNotifications && scheduledNotifications.length > 0) {

        for (const notification of scheduledNotifications) {
          const notificationTime = notification.time;

          // VERIFICACIÓN FLEXIBLE DE TIEMPO
          const timeMatches =
            notificationTime === currentTimeWithSeconds || // Exacto con segundos
            notificationTime === currentTimeFormatted || // Exacto sin segundos
            notificationTime.startsWith(currentTimeFormatted + ":"); // Que empiece con HH:MM:

          if (timeMatches) {
            console.log("⏰ [OverlayManager] ✅ HORA COINCIDE!", notification.name, "a las", notificationTime);

            // Crear clave única para evitar duplicados en este minuto
            const executionKey = `scheduled_exec_${notification.id}_${currentDay}_${currentHour}_${currentMinute}`;

            if (!scheduledNotificationsChecked.current.has(executionKey)) {
              scheduledNotificationsChecked.current.add(executionKey);

              console.log("⏰ [OverlayManager] 🚀 Ejecutando como backup:", notification.notification_type);

              // DISPARAR DIRECTAMENTE USANDO showOverlay
              showOverlay({
                id: `scheduled-backup-${notification.id}-${Date.now()}`,
                type: notification.notification_type,
                title: notification.name || getDefaultTitle(notification.notification_type),
                message: notification.description || "",
                metadata: notification.metadata || {},
              });

              // Limpiar el set periódicamente para evitar acumulación excesiva
              if (scheduledNotificationsChecked.current.size > 100) {
                scheduledNotificationsChecked.current.clear();
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("⏰ [OverlayManager] Error en checkScheduledNotifications:", error);
    }
  }, [showOverlay, getDefaultTitle]);

  useEffect(() => {
    // Solo loguear si es primera vez en la sesión
    if (isNewAppSession()) {
      console.log("📱 [OverlayManager] Inicializando nueva sesión...");
    }
    
    // Limpiar claves de sessionStorage de días anteriores para evitar acumulación
    const dominicanNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' }));
    const todayKey = dominicanNow.toISOString().split('T')[0];
    const sessionStorageKeys = Object.keys(sessionStorage);
    let cleanedCount = 0;
    sessionStorageKeys.forEach(key => {
      if (key.startsWith('overlay_session_')) {
        // Si la key contiene una fecha y no es la de hoy, eliminarla
        const dateMatch = key.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch && dateMatch[0] !== todayKey) {
          sessionStorage.removeItem(key);
          cleanedCount++;
        }
      }
    });
    if (cleanedCount > 0) {
      console.log("🧹 [OverlayManager] Limpiados", cleanedCount, "registros de sesión antiguos");
    }
    
    // También limpiar localStorage de scheduled_shown de días anteriores
    const localStorageKeys = Object.keys(localStorage);
    let localCleanedCount = 0;
    localStorageKeys.forEach(key => {
      if (key.startsWith('scheduled_shown_')) {
        const dateMatch = key.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch && dateMatch[0] !== todayKey) {
          localStorage.removeItem(key);
          localCleanedCount++;
        }
      }
    });
    if (localCleanedCount > 0) {
      console.log("🧹 [OverlayManager] Limpiados", localCleanedCount, "registros localStorage antiguos");
    }

    // Event handler for generic showOverlay event
    const handleShowOverlay = (event: CustomEvent<OverlayData>) => {
      showOverlay(event.detail);
    };

    // Event handler for service overlay
    const handleShowServiceOverlay = () => {
      showOverlay({
        id: `preview-service-${Date.now()}`,
        type: "service_overlay",
        title: "Programa de Servicios",
        message: "",
        metadata: {},
      });
    };

    // Event handler for verse overlay
    const handleShowVerseOverlay = (event: CustomEvent<{ verseText: string; verseReference: string }>) => {
      showOverlay({
        id: `preview-verse-${Date.now()}`,
        type: "daily_verse",
        title: "Versículo del Día",
        message: event.detail.verseText,
        metadata: {
          verse_text: event.detail.verseText,
          verse_reference: event.detail.verseReference,
        },
      });
    };

    // Event handler for advice overlay
    const handleShowAdviceOverlay = (event: CustomEvent<{ title: string; message: string }>) => {
      showOverlay({
        id: `preview-advice-${Date.now()}`,
        type: "daily_advice",
        title: "Consejo del Día",
        message: event.detail.message,
        metadata: {
          advice_title: event.detail.title,
          advice_message: event.detail.message,
        },
      });
    };

    // Event handler for blood donation overlay
    const handleShowBloodDonationOverlay = (event: CustomEvent<any>) => {
      showOverlay({
        id: `preview-blood-${Date.now()}`,
        type: "blood_donation",
        title: "Donación de Sangre Urgente",
        message: "",
        metadata: event.detail,
      });
    };

    // Event handler for rehearsal overlay
    const handleShowRehearsalOverlay = (event: CustomEvent<any>) => {
      showOverlay({
        id: `preview-rehearsal-${Date.now()}`,
        type: "extraordinary_rehearsal",
        title: "Ensayo Extraordinario",
        message: "",
        metadata: event.detail,
      });
    };

    // Event handler for instructions overlay
    const handleShowInstructionsOverlay = (event: CustomEvent<any>) => {
      showOverlay({
        id: `preview-instructions-${Date.now()}`,
        type: "ministry_instructions",
        title: event.detail.title || "Instrucciones",
        message: event.detail.instructions || "",
        metadata: event.detail,
      });
    };

    // Event handler for general announcement overlay
    const handleShowAnnouncementOverlay = (event: CustomEvent<any>) => {
      showOverlay({
        id: `preview-announcement-${Date.now()}`,
        type: event.detail.type || "meeting_announcement",
        title: event.detail.title || "Anuncio",
        message: event.detail.message || "",
        metadata: event.detail,
      });
    };

    // Register all event listeners
    window.addEventListener("showOverlay", handleShowOverlay as EventListener);
    window.addEventListener("showServiceOverlay", handleShowServiceOverlay as EventListener);
    window.addEventListener("showVerseOverlay", handleShowVerseOverlay as EventListener);
    window.addEventListener("showAdviceOverlay", handleShowAdviceOverlay as EventListener);
    window.addEventListener("showBloodDonationOverlay", handleShowBloodDonationOverlay as EventListener);
    window.addEventListener("showRehearsalOverlay", handleShowRehearsalOverlay as EventListener);
    window.addEventListener("showInstructionsOverlay", handleShowInstructionsOverlay as EventListener);
    window.addEventListener("showAnnouncementOverlay", handleShowAnnouncementOverlay as EventListener);

    // Check for pending overlays on mount
    checkPendingOverlays();

    // Configurar verificación de notificaciones programadas como SISTEMA DE BACKUP
    let scheduledCheckInterval: NodeJS.Timeout | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const overlayTypes = [
      "service_overlay",
      "daily_verse",
      "daily_advice",
      "birthday",
      "birthday_daily",
      "death_announcement",
      "meeting_announcement",
      "special_service",
      "prayer_request",
      "blood_donation",
      "extraordinary_rehearsal",
      "ministry_instructions",
      "pregnancy_reveal",
      "birth_announcement",
    ];

    const checkForNewNotifications = async () => {
      if (!isMounted.current) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      currentUserId.current = user.id;

      // Check for notifications for this user OR broadcast notifications (recipient_id is null)
      const { data: notifications, error } = await supabase
        .from("system_notifications")
        .select("*")
        .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
        .eq("is_read", false)
        .in("type", overlayTypes)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("📱 [OverlayManager] Error al verificar notificaciones:", error);
        return;
      }

      if (notifications && notifications.length > 0) {
        const notification = notifications[0];
        const sessionKey = `overlay_shown_session_${notification.id}`;

        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "true");
          console.log("📱 [OverlayManager] ✅ Overlay encontrado via polling:", notification.type, notification);
          showOverlay({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata || {},
          });
        }
      }
    };

    // Start checking scheduled notifications as backup cada 60 segundos (reducido para menos ruido)
    const startScheduledCheck = () => {
      if (scheduledCheckInterval) return;
      scheduledCheckInterval = setInterval(checkScheduledNotifications, 60000);
      // Check immediately (pero solo una vez)
      setTimeout(() => checkScheduledNotifications(), 10000);
    };

    // Start polling for system_notifications - cada 30 segundos (reducido de 15)
    const startPolling = () => {
      if (pollInterval) return;
      pollInterval = setInterval(checkForNewNotifications, 30000);
      // No hacer check inmediato ya que checkPendingOverlays() ya busca overlays pendientes
    };

    // Setup Realtime for instant notifications
    const setupRealtimeListener = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      currentUserId.current = user.id;

      // Use Realtime WITHOUT filter - check recipient client-side
      channel = supabase
        .channel(`overlay-manager-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "system_notifications",
          },
          (payload) => {
            const notification = payload.new as any;

            // Check if notification is for this user or broadcast
            if (notification.recipient_id && notification.recipient_id !== user.id) {
              return;
            }

            // Check if notification type requires overlay
            if (overlayTypes.includes(notification.type)) {
              const sessionKey = `overlay_shown_session_${notification.id}`;
              if (!sessionStorage.getItem(sessionKey)) {
                sessionStorage.setItem(sessionKey, "true");
                console.log("📱 [OverlayManager] ✅ Nueva notificación via Realtime:", notification.type);
                showOverlay({
                  id: notification.id,
                  type: notification.type,
                  title: notification.title,
                  message: notification.message,
                  metadata: notification.metadata || {},
                });
              }
            }
          },
        )
        .subscribe();

      // Start all checks
      startScheduledCheck();
      startPolling();
    };

    setupRealtimeListener();

    // Cleanup
    return () => {
      isMounted.current = false;
      window.removeEventListener("showOverlay", handleShowOverlay as EventListener);
      window.removeEventListener("showServiceOverlay", handleShowServiceOverlay as EventListener);
      window.removeEventListener("showVerseOverlay", handleShowVerseOverlay as EventListener);
      window.removeEventListener("showAdviceOverlay", handleShowAdviceOverlay as EventListener);
      window.removeEventListener("showBloodDonationOverlay", handleShowBloodDonationOverlay as EventListener);
      window.removeEventListener("showRehearsalOverlay", handleShowRehearsalOverlay as EventListener);
      window.removeEventListener("showInstructionsOverlay", handleShowInstructionsOverlay as EventListener);
      window.removeEventListener("showAnnouncementOverlay", handleShowAnnouncementOverlay as EventListener);

      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
      if (scheduledCheckInterval) {
        clearInterval(scheduledCheckInterval);
      }
    };
  }, [showOverlay, checkPendingOverlays, checkScheduledNotifications, getDefaultTitle]);
  // State for dynamically loaded content
  const [dynamicVerseData, setDynamicVerseData] = useState<{ text: string; reference: string } | null>(null);
  const [dynamicAdviceData, setDynamicAdviceData] = useState<{ title: string; message: string } | null>(null);

  // Load daily verse data when needed
  useEffect(() => {
    if (overlayType === 'daily_verse' && activeOverlay) {
      const metadata = activeOverlay.metadata || {};
      // Si ya tiene datos válidos, usarlos
      if (metadata.verse_text && metadata.verse_text.length > 5) {
        setDynamicVerseData({ text: metadata.verse_text, reference: metadata.verse_reference || '' });
        return;
      }
      
      // Cargar desde la base de datos
      const loadVerseData = async () => {
        const dominicanNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santo_Domingo' }));
        const today = dominicanNow.toISOString().split('T')[0];
        const { data, error } = await supabase
          .from('daily_verses')
          .select('*, bible_verses(*)')
          .eq('date', today)
          .maybeSingle();

        if (data?.bible_verses) {
          const verse = data.bible_verses as any;
          setDynamicVerseData({
            text: verse.text,
            reference: `${verse.book} ${verse.chapter}:${verse.verse}`
          });
        } else if (!error) {
          // Si no hay versículo para hoy, selección determinística por día
          const { data: allVerses } = await supabase.from('bible_verses').select('*');

          if (allVerses && allVerses.length > 0) {
            const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
            const idx = dayOfYear % allVerses.length;
            const verse = allVerses[idx];
            setDynamicVerseData({
              text: verse.text,
              reference: `${verse.book} ${verse.chapter}:${verse.verse}`
            });
          }
        }
      };
      loadVerseData();
    }
  }, [overlayType, activeOverlay]);

  // Load daily advice data when needed
  useEffect(() => {
    if (overlayType === 'daily_advice' && activeOverlay) {
      const metadata = activeOverlay.metadata || {};
      // Si ya tiene datos válidos, usarlos
      if (metadata.advice_message && metadata.advice_message.length > 5) {
        setDynamicAdviceData({ title: metadata.advice_title || 'Consejo del Día', message: metadata.advice_message });
        return;
      }
      
      // Cargar desde la base de datos - seleccionar uno aleatorio
      const loadAdviceData = async () => {
        const { data, error } = await supabase
          .from('daily_advice')
          .select('*')
          .eq('is_active', true);

        if (data && data.length > 0) {
          // Seleccionar uno aleatorio basado en el día
          const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
          const index = dayOfYear % data.length;
          const advice = data[index];
          setDynamicAdviceData({
            title: advice.title,
            message: advice.message
          });
        }
      };
      loadAdviceData();
    }
  }, [overlayType, activeOverlay]);

  // Reset dynamic data when overlay closes
  useEffect(() => {
    if (!activeOverlay) {
      setDynamicVerseData(null);
      setDynamicAdviceData(null);
    }
  }, [activeOverlay]);

  // Render the appropriate overlay based on type
  const renderOverlay = () => {
    if (!activeOverlay || !overlayType) return null;

    const metadata = activeOverlay.metadata || {};

    switch (overlayType) {
      case "service_overlay":
        // SIEMPRE skip save si tiene ID real de BD o viene del NotificationCenter
        // Solo guardar si es preview (ID temporal que no existe en BD)
        const shouldSaveService = activeOverlay.id?.startsWith("preview-");
        return (
          <ServiceNotificationOverlay
            forceShow={true}
            skipSaveNotification={!shouldSaveService}
            onClose={handleDismissWithQueue}
            onNavigate={(path) => {
              handleDismissWithQueue();
              navigate(path);
            }}
          />
        );

      case "daily_verse":
        // Usar datos dinámicos si están disponibles, sino esperar
        if (!dynamicVerseData) {
          return null; // Esperar a que carguen los datos
        }
        // SIEMPRE skip save si tiene ID real de BD o viene del NotificationCenter
        // Solo guardar si es preview (ID temporal que no existe en BD)
        const shouldSaveVerse = activeOverlay.id?.startsWith("preview-");
        return (
          <DailyVerseOverlay
            verseText={dynamicVerseData.text}
            verseReference={dynamicVerseData.reference}
            skipSaveNotification={!shouldSaveVerse}
            onClose={handleDismissWithQueue}
          />
        );

      case "daily_advice":
        // Usar datos dinámicos si están disponibles, sino esperar
        if (!dynamicAdviceData) {
          return null; // Esperar a que carguen los datos
        }
        // SIEMPRE skip save si tiene ID real de BD o viene del NotificationCenter
        // Solo guardar si es preview (ID temporal que no existe en BD)
        const shouldSaveAdvice = activeOverlay.id?.startsWith("preview-");
        return (
          <DailyAdviceOverlay
            title={dynamicAdviceData.title}
            message={dynamicAdviceData.message}
            skipSaveNotification={!shouldSaveAdvice}
            onClose={handleDismissWithQueue}
          />
        );

      case "death_announcement":
      case "meeting_announcement":
      case "special_service":
      case "prayer_request":
        return (
          <GeneralAnnouncementOverlay
            title={metadata.title || activeOverlay.title || ""}
            message={metadata.message || activeOverlay.message || ""}
            announcementType={overlayType as any}
            onClose={handleDismissWithQueue}
          />
        );

      case "ministry_instructions":
        return (
          <MinistryInstructionsOverlay
            title={metadata.title || activeOverlay.title || ""}
            instructions={metadata.instructions || activeOverlay.message || ""}
            priority={metadata.priority || "normal"}
            onClose={handleDismissWithQueue}
          />
        );

      case "extraordinary_rehearsal":
        return (
          <ExtraordinaryRehearsalOverlay
            activityName={metadata.activity_name || activeOverlay.title || ""}
            date={metadata.date || new Date().toISOString()}
            time={metadata.rehearsal_time || ""}
            location={metadata.location}
            additionalNotes={metadata.additional_notes}
            specialEventName={metadata.special_event_name}
            onClose={handleDismissWithQueue}
          />
        );

      case "blood_donation":
        return (
          <BloodDonationOverlay
            recipientName={metadata.recipient_name || ""}
            bloodType={metadata.blood_type || ""}
            contactPhone={metadata.contact_phone || ""}
            medicalCenter={metadata.medical_center || ""}
            familyContact={metadata.family_contact || ""}
            urgencyLevel={metadata.urgency_level || "urgent"}
            additionalInfo={metadata.additional_info}
            onClose={handleDismissWithQueue}
          />
        );

      case "pregnancy_reveal":
        return (
          <PregnancyRevealOverlay
            parentNames={metadata.parent_names || ""}
            sonogramImageUrl={metadata.sonogram_image_url}
            message={metadata.pregnancy_message || metadata.message || activeOverlay.message}
            dueDate={metadata.due_date}
            onClose={handleDismissWithQueue}
          />
        );

      case "birth_announcement":
        return (
          <BirthAnnouncementOverlay
            babyName={metadata.baby_name}
            parentNames={metadata.parent_names || ""}
            babyPhotoUrl={metadata.baby_photo_url}
            birthDate={metadata.birth_date}
            birthTime={metadata.birth_time}
            weight={metadata.baby_weight || metadata.weight}
            height={metadata.baby_height || metadata.height}
            message={metadata.birth_message || metadata.message || activeOverlay.message}
            onClose={handleDismissWithQueue}
          />
        );

      case "director_change":
      case "director_replacement_request":
      case "director_replacement_response":
        return (
          <DirectorChangeOverlay
            serviceDate={metadata.service_date || new Date().toISOString()}
            serviceTime={metadata.service_time || "10:45 a.m."}
            originalDirectorName={metadata.original_director_name || metadata.original_director || metadata.requester_name || "Director Original"}
            originalDirectorPhoto={metadata.original_director_photo || metadata.requester_photo}
            newDirectorName={metadata.new_director_name || metadata.new_director || metadata.responder_name || "Nuevo Director"}
            newDirectorPhoto={metadata.new_director_photo || metadata.responder_photo}
            status={metadata.status || "accepted"}
            hasSongSelection={metadata.has_song_selection || false}
            onClose={handleDismissWithQueue}
          />
        );

      case "special_event":
        return (
          <SpecialEventOverlay
            eventName={metadata.event_name || activeOverlay.title || undefined}
            eventDate={metadata.event_date || undefined}
            eventTime={metadata.event_time}
            location={metadata.location}
            description={metadata.description || activeOverlay.message || undefined}
            eventType={metadata.event_type}
            autoFetch={!metadata.event_name && !metadata.event_date} // Auto-fetch if no data provided
            onClose={handleDismissWithQueue}
          />
        );

      case "voice_replacement":
      case "voice_replacement_request":
      case "voice_replacement_response":
        return (
          <VoiceReplacementOverlay
            serviceDate={metadata.service_date || new Date().toISOString()}
            serviceTime={metadata.service_time || "10:45 a.m."}
            serviceTitle={metadata.service_title || "Servicio de Alabanza"}
            originalMemberName={metadata.original_member_name || "Corista"}
            originalMemberPhoto={metadata.original_member_photo}
            replacementMemberName={metadata.replacement_member_name || "Reemplazo"}
            replacementMemberPhoto={metadata.replacement_member_photo}
            voiceType={metadata.voice_type || "Soprano"}
            micPosition={metadata.mic_position}
            groupName={metadata.group_name || "Grupo de Alabanza"}
            status={metadata.status || "pending"}
            reason={metadata.reason}
            onClose={handleDismissWithQueue}
          />
        );

      case "quarantine_service":
        return (
          <QuarantineServiceOverlay
            forceShow={true}
            serviceDate={metadata.service_date}
            serviceTime={metadata.service_time || "7:00 PM"}
            serviceDay={metadata.service_day}
            location={metadata.location || "Templo Principal"}
            specialMessage={metadata.special_message || metadata.message}
            onClose={handleDismissWithQueue}
          />
        );

      default:
        console.log("📱 [OverlayManager] Tipo de overlay no reconocido:", overlayType);
        return null;
    }
  };

  // Render overlay in a portal-like manner at the top level
  if (!activeOverlay || !overlayType) return null;

  return (
    <div className="overlay-manager-root" style={{ position: "fixed", inset: 0, zIndex: 9999, pointerEvents: "none" }}>
      <div style={{ pointerEvents: "auto" }}>{renderOverlay()}</div>
    </div>
  );
};

export default OverlayManager;

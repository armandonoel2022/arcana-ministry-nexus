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

const OverlayManager: React.FC = () => {
  const navigate = useNavigate();
  const [activeOverlay, setActiveOverlay] = useState<OverlayData | null>(null);
  const [overlayType, setOverlayType] = useState<string | null>(null);
  const hasInitialized = useRef(false);
  const currentUserId = useRef<string | null>(null);
  const isMounted = useRef(true);
  const lastScheduledCheck = useRef<number>(0);
  const scheduledNotificationsChecked = useRef<Set<string>>(new Set());

  // Function to save overlay notification to database if it doesn't exist
  const saveOverlayToNotifications = useCallback(async (notification: OverlayData) => {
    // Only save if it's a preview/backup/scheduled overlay (not already from DB)
    const isTemporaryId = notification.id.startsWith('preview-') || 
                          notification.id.startsWith('scheduled-') || 
                          notification.id.startsWith('test-') ||
                          notification.id.startsWith('broadcast-') ||
                          notification.id.startsWith('notification-');
    
    if (!isTemporaryId) {
      console.log("📱 [OverlayManager] Overlay ya tiene ID de BD, no se guarda nuevamente");
      return;
    }

    // IMPORTANTE: Algunos overlays cargan sus propios datos y deben manejar su propio guardado
    // para poder incluir los datos reales (no los metadatos vacíos del scheduled_notifications)
    const selfSavingTypes = ['service_overlay', 'daily_verse', 'daily_advice'];
    if (selfSavingTypes.includes(notification.type)) {
      console.log("📱 [OverlayManager] El overlay", notification.type, "maneja su propio guardado con datos reales");
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

  // Function to show overlay with safety check
  const showOverlay = useCallback((notification: OverlayData) => {
    if (!isMounted.current) return;
    console.log("📱 [OverlayManager] Mostrando overlay:", notification.type, notification);

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

    // Clear any existing overlay first
    setActiveOverlay(null);
    setOverlayType(null);

    // Force a small delay to ensure DOM is ready
    setTimeout(() => {
      if (isMounted.current) {
        setActiveOverlay(notification);
        setOverlayType(notification.type);
      }
    }, 50);
  }, [saveOverlayToNotifications]);

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

    setActiveOverlay(null);
    setOverlayType(null);
  }, [activeOverlay]);

  // Queue for pending overlays
  const overlayQueue = useRef<OverlayData[]>([]);
  const isProcessingQueue = useRef(false);

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
    };
    return titles[type] || "Notificación";
  }, []);

  // Check for pending overlays AND missed scheduled notifications when component mounts
  const checkPendingOverlays = useCallback(async () => {
    // Prevent multiple initializations
    if (hasInitialized.current) {
      console.log("📱 [OverlayManager] Ya inicializado, ignorando");
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
      console.log("📱 [OverlayManager] Verificando overlays pendientes para usuario:", user.id);

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

        // Filter out already shown in this session
        const notShownNotifications = pendingNotifications.filter(notification => {
          const sessionKey = `overlay_shown_session_${notification.id}`;
          return !sessionStorage.getItem(sessionKey);
        });

        notShownNotifications.forEach(notification => {
          sessionStorage.setItem(`overlay_shown_session_${notification.id}`, "true");
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
  const checkScheduledNotifications = useCallback(async () => {
    if (!isMounted.current) return;

    const now = Date.now();
    // Evitar verificar demasiado frecuentemente (mínimo 30 segundos)
    if (now - lastScheduledCheck.current < 30000) {
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

      console.log("⏰ [OverlayManager-Backup] Verificando a las:", currentTimeWithSeconds, "Día:", currentDay);

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

      if (scheduledNotifications && scheduledNotifications.length > 0) {
        console.log("⏰ [OverlayManager] Notificaciones encontradas para hoy:", scheduledNotifications.length);

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
    console.log("📱 [OverlayManager] Inicializando...");

    // Event handler for generic showOverlay event
    const handleShowOverlay = (event: CustomEvent<OverlayData>) => {
      console.log("📱 [OverlayManager] Evento showOverlay recibido:", event.detail);
      showOverlay(event.detail);
    };

    // Event handler for service overlay
    const handleShowServiceOverlay = () => {
      console.log("📱 [OverlayManager] Evento showServiceOverlay recibido");
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
      console.log("📱 [OverlayManager] Evento showVerseOverlay recibido:", event.detail);
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
      console.log("📱 [OverlayManager] Evento showAdviceOverlay recibido:", event.detail);
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
      console.log("📱 [OverlayManager] Evento showBloodDonationOverlay recibido:", event.detail);
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
      console.log("📱 [OverlayManager] Evento showRehearsalOverlay recibido:", event.detail);
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
      console.log("📱 [OverlayManager] Evento showInstructionsOverlay recibido:", event.detail);
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
      console.log("📱 [OverlayManager] Evento showAnnouncementOverlay recibido:", event.detail);
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

    // Start checking scheduled notifications as backup cada 30 segundos
    const startScheduledCheck = () => {
      if (scheduledCheckInterval) return;
      console.log("⏰ [OverlayManager] Iniciando sistema de backup cada 30 segundos");
      scheduledCheckInterval = setInterval(checkScheduledNotifications, 30000);
      // Check immediately
      setTimeout(() => checkScheduledNotifications(), 5000);
    };

    // Start polling for system_notifications
    const startPolling = () => {
      if (pollInterval) return;
      console.log("📱 [OverlayManager] Iniciando polling de system_notifications cada 15 segundos");
      pollInterval = setInterval(checkForNewNotifications, 15000);
      checkForNewNotifications();
    };

    // Setup Realtime for instant notifications
    const setupRealtimeListener = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      console.log("📱 [OverlayManager] Configurando sistema de overlays para usuario:", user.id);
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
            console.log("📱 [OverlayManager] Notificación recibida via Realtime:", notification);

            // Check if notification is for this user or broadcast
            if (notification.recipient_id && notification.recipient_id !== user.id) {
              console.log("📱 [OverlayManager] Notificación no es para este usuario");
              return;
            }

            // Check if notification type requires overlay
            if (overlayTypes.includes(notification.type)) {
              const sessionKey = `overlay_shown_session_${notification.id}`;
              if (!sessionStorage.getItem(sessionKey)) {
                sessionStorage.setItem(sessionKey, "true");
                console.log("📱 [OverlayManager] ✅ Mostrando overlay via Realtime:", notification.type);
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
        .subscribe((status) => {
          console.log("📱 [OverlayManager] Estado Realtime:", status);
          if (status === "SUBSCRIBED") {
            console.log("📱 [OverlayManager] ✅ Realtime conectado");
          }
        });

      // Start all checks
      startScheduledCheck();
      startPolling();
    };

    setupRealtimeListener();

    // Cleanup
    return () => {
      console.log("📱 [OverlayManager] Limpiando listeners...");
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
        return (
          <ServiceNotificationOverlay
            forceShow={true}
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
        return (
          <DailyVerseOverlay
            verseText={dynamicVerseData.text}
            verseReference={dynamicVerseData.reference}
            onClose={handleDismissWithQueue}
          />
        );

      case "daily_advice":
        // Usar datos dinámicos si están disponibles, sino esperar
        if (!dynamicAdviceData) {
          return null; // Esperar a que carguen los datos
        }
        return (
          <DailyAdviceOverlay
            title={dynamicAdviceData.title}
            message={dynamicAdviceData.message}
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

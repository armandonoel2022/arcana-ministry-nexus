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

  // Function to show overlay with safety check
  const showOverlay = useCallback((notification: OverlayData) => {
    if (!isMounted.current) return;
    console.log("📱 [OverlayManager] Mostrando overlay:", notification.type, notification);

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
  }, []);

  // Function to dismiss overlay and mark as read
  const handleDismiss = useCallback(async () => {
    if (
      activeOverlay &&
      activeOverlay.id &&
      !activeOverlay.id.startsWith("preview-") &&
      !activeOverlay.id.startsWith("test-")
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

  // Check for pending overlays when component mounts - only show ONE pending overlay
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
        "death_announcement",
        "meeting_announcement",
        "special_service",
        "prayer_request",
        "blood_donation",
        "extraordinary_rehearsal",
        "ministry_instructions",
      ];

      const { data: pendingNotifications, error } = await supabase
        .from("system_notifications")
        .select("*")
        .or(`recipient_id.eq.${user.id},recipient_id.is.null`)
        .eq("is_read", false)
        .in("type", overlayTypes)
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) {
        console.error("Error checking pending overlays:", error);
        return;
      }

      if (pendingNotifications && pendingNotifications.length > 0) {
        const notification = pendingNotifications[0];
        console.log("📱 [OverlayManager] Overlay pendiente encontrado:", notification);

        // Check if this notification was already shown in this session
        const sessionKey = `overlay_shown_session_${notification.id}`;
        const shownInSession = sessionStorage.getItem(sessionKey);

        if (!shownInSession) {
          sessionStorage.setItem(sessionKey, "true");
          showOverlay({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata || {},
          });
        } else {
          console.log("📱 [OverlayManager] Overlay ya mostrado en esta sesión");
        }
      }
    } catch (error) {
      console.error("Error in checkPendingOverlays:", error);
    }
  }, [showOverlay]);

  // Función mejorada para verificar notificaciones programadas
  const checkScheduledNotifications = useCallback(async () => {
    if (!isMounted.current) return;

    const now = Date.now();
    // Evitar verificar demasiado frecuentemente (mínimo 10 segundos)
    if (now - lastScheduledCheck.current < 10000) {
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

      console.log(
        "📱 [OverlayManager] Verificando notificaciones programadas - Día:",
        currentDay,
        "Hora:",
        currentTimeFormatted,
      );

      // Primero, verificar con hora exacta (HH:MM:00)
      const { data: exactTimeNotifications, error: exactError } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .contains("days_of_week", [currentDay])
        .eq("time", currentTimeWithSeconds)
        .eq("is_active", true);

      if (exactError) {
        console.error("📱 [OverlayManager] Error verificando notificaciones exactas:", exactError);
      }

      // También verificar con formato HH:MM (sin segundos)
      const { data: hourMinuteNotifications, error: hmError } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .contains("days_of_week", [currentDay])
        .eq("is_active", true);

      if (hmError) {
        console.error("📱 [OverlayManager] Error verificando notificaciones por hora/minuto:", hmError);
      }

      // Combinar resultados
      const allNotifications = [
        ...(exactTimeNotifications || []),
        ...(hourMinuteNotifications || []).filter((notification) => notification.time.startsWith(currentTimeFormatted)),
      ];

      // Eliminar duplicados
      const uniqueNotifications = Array.from(new Map(allNotifications.map((item) => [item.id, item])).values());

      if (uniqueNotifications.length > 0) {
        console.log("📱 [OverlayManager] ✅ Notificaciones programadas encontradas:", uniqueNotifications.length);

        for (const notification of uniqueNotifications) {
          // Crear clave única para esta ejecución específica
          const executionKey = `scheduled_exec_${notification.id}_${currentDay}_${currentTimeFormatted}`;

          // Verificar si ya se ejecutó esta notificación en este minuto específico
          if (!scheduledNotificationsChecked.current.has(executionKey)) {
            scheduledNotificationsChecked.current.add(executionKey);

            console.log("📱 [OverlayManager] 🚀 Disparando overlay programado:", notification.notification_type);

            // Crear system_notification correspondiente
            const { data: userData } = await supabase.auth.getUser();
            const userId = userData?.user?.id;

            // Insertar en system_notifications para que sea procesado por el sistema normal
            const { error: insertError } = await supabase.from("system_notifications").insert({
              type: notification.notification_type,
              title: notification.name,
              message: notification.description || "Notificación programada",
              recipient_id: userId, // Para usuario específico, o null para todos
              notification_category: "scheduled",
              priority: 1,
              metadata: notification.metadata || {},
              created_at: new Date().toISOString(),
              is_read: false,
            });

            if (insertError) {
              console.error("📱 [OverlayManager] Error insertando notificación:", insertError);
            } else {
              console.log("📱 [OverlayManager] ✅ Notificación programada insertada en system_notifications");
            }
          }
        }

        // Limpiar el set periódicamente para evitar acumulación excesiva
        if (scheduledNotificationsChecked.current.size > 100) {
          scheduledNotificationsChecked.current.clear();
        }
      }
    } catch (error) {
      console.error("📱 [OverlayManager] Error en checkScheduledNotifications:", error);
    }
  }, []);

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

    // Configurar verificación de notificaciones programadas
    let scheduledCheckInterval: NodeJS.Timeout | null = null;
    let pollInterval: NodeJS.Timeout | null = null;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const overlayTypes = [
      "service_overlay",
      "daily_verse",
      "daily_advice",
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

    // Start checking scheduled notifications every 30 seconds
    const startScheduledCheck = () => {
      if (scheduledCheckInterval) return;
      console.log("📱 [OverlayManager] Iniciando verificación de notificaciones programadas cada 30 segundos");
      scheduledCheckInterval = setInterval(checkScheduledNotifications, 30000);
      // Check immediately
      setTimeout(() => checkScheduledNotifications(), 2000);
    };

    // Start polling for system_notifications as backup
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
  }, [showOverlay, checkPendingOverlays, checkScheduledNotifications]);

  // Render the appropriate overlay based on type
  const renderOverlay = () => {
    if (!activeOverlay || !overlayType) return null;

    const metadata = activeOverlay.metadata || {};

    switch (overlayType) {
      case "service_overlay":
        return (
          <ServiceNotificationOverlay
            forceShow={true}
            onClose={handleDismiss}
            onNavigate={(path) => {
              handleDismiss();
              navigate(path);
            }}
          />
        );

      case "daily_verse":
        return (
          <DailyVerseOverlay
            verseText={metadata.verse_text || activeOverlay.message || ""}
            verseReference={metadata.verse_reference || ""}
            onClose={handleDismiss}
          />
        );

      case "daily_advice":
        return (
          <DailyAdviceOverlay
            title={metadata.advice_title || activeOverlay.title || ""}
            message={metadata.advice_message || activeOverlay.message || ""}
            onClose={handleDismiss}
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
            onClose={handleDismiss}
          />
        );

      case "ministry_instructions":
        return (
          <MinistryInstructionsOverlay
            title={metadata.title || activeOverlay.title || ""}
            instructions={metadata.instructions || activeOverlay.message || ""}
            priority={metadata.priority || "normal"}
            onClose={handleDismiss}
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
            onClose={handleDismiss}
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
            onClose={handleDismiss}
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

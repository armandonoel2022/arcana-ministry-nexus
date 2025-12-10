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
  const lastMinuteChecked = useRef<string>("");

  // Function to show overlay with safety check
  const showOverlay = useCallback((notification: OverlayData) => {
    if (!isMounted.current) return;
    console.log("📱 [OverlayManager] Mostrando overlay:", notification.type, notification);

    // Force a small delay to ensure DOM is ready
    setTimeout(() => {
      if (isMounted.current) {
        setActiveOverlay(notification);
        setOverlayType(notification.type);
      }
    }, 100);
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
    if (hasInitialized.current) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      currentUserId.current = user.id;
      hasInitialized.current = true;
      console.log("📱 [OverlayManager] Verificando overlays pendientes para usuario:", user.id);

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

      if (error) return;

      if (pendingNotifications && pendingNotifications.length > 0) {
        const notification = pendingNotifications[0];
        console.log("📱 [OverlayManager] Overlay pendiente encontrado:", notification);

        const sessionKey = `overlay_shown_session_${notification.id}`;
        if (!sessionStorage.getItem(sessionKey)) {
          sessionStorage.setItem(sessionKey, "true");
          showOverlay({
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            metadata: notification.metadata || {},
          });
        }
      }
    } catch (error) {
      console.error("Error in checkPendingOverlays:", error);
    }
  }, [showOverlay]);

  // Función SIMPLE para verificar notificaciones programadas - DISPARA EXACTAMENTE LO MISMO QUE PREVIEW
  const checkScheduledNotifications = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      // Get current time in Dominican Republic
      const rdNow = new Date();
      const dominicanTime = new Date(rdNow.toLocaleString("en-US", { timeZone: "America/Santo_Domingo" }));

      const currentDay = dominicanTime.getDay();
      const currentHour = dominicanTime.getHours();
      const currentMinute = dominicanTime.getMinutes();
      const currentSecond = dominicanTime.getSeconds();

      // Verificar solo en el segundo 0 de cada minuto (para evitar múltiples ejecuciones)
      if (currentSecond !== 0) return;

      const currentMinuteKey = `${currentDay}-${currentHour}:${currentMinute}`;
      if (lastMinuteChecked.current === currentMinuteKey) return;

      lastMinuteChecked.current = currentMinuteKey;

      const currentTimeFormatted = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;
      const currentTimeWithSeconds = `${currentTimeFormatted}:00`;

      console.log("📱 [OverlayManager] Verificando notificaciones programadas:", currentTimeFormatted);

      // Buscar notificaciones programadas para ESTE minuto exacto
      const { data: scheduledNotifications, error } = await supabase
        .from("scheduled_notifications")
        .select("*")
        .contains("days_of_week", [currentDay])
        .eq("time", currentTimeWithSeconds)
        .eq("is_active", true);

      if (error) {
        console.error("Error verificando notificaciones programadas:", error);
        return;
      }

      if (scheduledNotifications && scheduledNotifications.length > 0) {
        console.log("📱 [OverlayManager] ✅ Notificaciones programadas encontradas:", scheduledNotifications.length);

        for (const notification of scheduledNotifications) {
          console.log("📱 [OverlayManager] 🚀 Disparando overlay programado:", notification.notification_type);

          // DISPARAR EXACTAMENTE LO MISMO QUE SE DISPARA EN EL PREVIEW
          switch (notification.notification_type) {
            case "service_overlay":
              window.dispatchEvent(
                new CustomEvent("showOverlay", {
                  detail: {
                    id: `scheduled-service-${Date.now()}`,
                    type: "service_overlay",
                    title: notification.name || "Programa de Servicios",
                    message: notification.description || "",
                    metadata: notification.metadata || {},
                  },
                }),
              );
              break;

            case "daily_verse":
              try {
                // Cargar versículo actual del día
                const today = new Date().toISOString().split("T")[0];
                const { data: dailyVerse } = await supabase
                  .from("daily_verses")
                  .select(`*, bible_verses (*)`)
                  .eq("date", today)
                  .single();

                if (dailyVerse && dailyVerse.bible_verses) {
                  const verse = dailyVerse.bible_verses as any;
                  window.dispatchEvent(
                    new CustomEvent("showOverlay", {
                      detail: {
                        id: `scheduled-verse-${Date.now()}`,
                        type: "daily_verse",
                        title: "Versículo del Día",
                        message: verse.text,
                        metadata: {
                          verse_text: verse.text,
                          verse_reference: `${verse.book} ${verse.chapter}:${verse.verse}`,
                        },
                      },
                    }),
                  );
                } else {
                  // Fallback: usar versículo por defecto
                  window.dispatchEvent(
                    new CustomEvent("showOverlay", {
                      detail: {
                        id: `scheduled-verse-${Date.now()}`,
                        type: "daily_verse",
                        title: "Versículo del Día",
                        message:
                          "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
                        metadata: {
                          verse_text:
                            "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
                          verse_reference: "Juan 3:16",
                        },
                      },
                    }),
                  );
                }
              } catch (error) {
                console.error("Error cargando versículo:", error);
                // Usar fallback
                window.dispatchEvent(
                  new CustomEvent("showOverlay", {
                    detail: {
                      id: `scheduled-verse-${Date.now()}`,
                      type: "daily_verse",
                      title: "Versículo del Día",
                      message:
                        "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
                      metadata: {
                        verse_text:
                          "Porque de tal manera amó Dios al mundo, que ha dado a su Hijo unigénito, para que todo aquel que en él cree, no se pierda, mas tenga vida eterna.",
                        verse_reference: "Juan 3:16",
                      },
                    },
                  }),
                );
              }
              break;

            case "daily_advice":
              try {
                // Cargar consejo aleatorio
                const { data: adviceList } = await supabase.from("daily_advice").select("*").eq("is_active", true);

                if (adviceList && adviceList.length > 0) {
                  const randomAdvice = adviceList[Math.floor(Math.random() * adviceList.length)];
                  window.dispatchEvent(
                    new CustomEvent("showOverlay", {
                      detail: {
                        id: `scheduled-advice-${Date.now()}`,
                        type: "daily_advice",
                        title: "Consejo del Día",
                        message: randomAdvice.message,
                        metadata: {
                          advice_title: randomAdvice.title,
                          advice_message: randomAdvice.message,
                        },
                      },
                    }),
                  );
                } else {
                  // Fallback
                  window.dispatchEvent(
                    new CustomEvent("showOverlay", {
                      detail: {
                        id: `scheduled-advice-${Date.now()}`,
                        type: "daily_advice",
                        title: "Consejo del Día",
                        message: "La excelencia viene de la práctica constante. Dedica tiempo a ensayar.",
                        metadata: {
                          advice_title: "Consejo del Día",
                          advice_message: "La excelencia viene de la práctica constante. Dedica tiempo a ensayar.",
                        },
                      },
                    }),
                  );
                }
              } catch (error) {
                console.error("Error cargando consejo:", error);
                // Fallback
                window.dispatchEvent(
                  new CustomEvent("showOverlay", {
                    detail: {
                      id: `scheduled-advice-${Date.now()}`,
                      type: "daily_advice",
                      title: "Consejo del Día",
                      message: "La excelencia viene de la práctica constante. Dedica tiempo a ensayar.",
                      metadata: {
                        advice_title: "Consejo del Día",
                        advice_message: "La excelencia viene de la práctica constante. Dedica tiempo a ensayar.",
                      },
                    },
                  }),
                );
              }
              break;

            case "blood_donation":
              window.dispatchEvent(
                new CustomEvent("showOverlay", {
                  detail: {
                    id: `scheduled-blood-${Date.now()}`,
                    type: "blood_donation",
                    title: notification.metadata?.title || notification.name || "Donación de Sangre Urgente",
                    message: notification.description || "",
                    metadata: notification.metadata || {},
                  },
                }),
              );
              break;

            case "extraordinary_rehearsal":
              window.dispatchEvent(
                new CustomEvent("showOverlay", {
                  detail: {
                    id: `scheduled-rehearsal-${Date.now()}`,
                    type: "extraordinary_rehearsal",
                    title: notification.metadata?.title || notification.name || "Ensayo Extraordinario",
                    message: notification.description || "",
                    metadata: notification.metadata || {},
                  },
                }),
              );
              break;

            case "ministry_instructions":
              window.dispatchEvent(
                new CustomEvent("showOverlay", {
                  detail: {
                    id: `scheduled-instructions-${Date.now()}`,
                    type: "ministry_instructions",
                    title: notification.metadata?.title || notification.name || "Instrucciones",
                    message: notification.description || notification.metadata?.instructions || "",
                    metadata: notification.metadata || {},
                  },
                }),
              );
              break;

            default:
              // Para announcements (death_announcement, meeting_announcement, etc.)
              window.dispatchEvent(
                new CustomEvent("showOverlay", {
                  detail: {
                    id: `scheduled-${notification.notification_type}-${Date.now()}`,
                    type: notification.notification_type,
                    title: notification.metadata?.title || notification.name || "Anuncio",
                    message: notification.description || notification.metadata?.message || "",
                    metadata: notification.metadata || {},
                  },
                }),
              );
          }
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

    // Configurar verificación de notificaciones programadas - MUCHO MÁS SIMPLE
    let scheduledCheckInterval: NodeJS.Timeout | null = null;

    // Start checking scheduled notifications every 10 seconds
    const startScheduledCheck = () => {
      if (scheduledCheckInterval) return;
      console.log("📱 [OverlayManager] Iniciando verificación de notificaciones programadas cada 10 segundos");
      scheduledCheckInterval = setInterval(checkScheduledNotifications, 10000);
      // Check immediately
      setTimeout(() => checkScheduledNotifications(), 2000);
    };

    startScheduledCheck();

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

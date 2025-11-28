import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AnimatedLogoTrigger } from "@/components/AnimatedLogoTrigger";
import SplashScreen from "@/components/SplashScreen";
import Index from "./pages/Index";
import RepertoirioMusical from "./pages/RepertoirioMusical";
import MinisterialAgenda from "./pages/MinisterialAgenda";
import DirectorReplacements from "./pages/DirectorReplacements";
import Communication from "./pages/Communication";
import Integrantes from "./pages/Integrantes";
import MemberProfile from "./pages/MemberProfile";
import WorshipGroups from "./pages/WorshipGroups";
import Recomendaciones from "./pages/Recomendaciones";
import EventosEspeciales from "./pages/EventosEspeciales";
import SpiritualModule from "./pages/SpiritualModule";
import AdminDashboard from "./pages/AdminDashboard";
import Notificaciones from "./pages/Notificaciones";
import BirthdayModulePage from "./pages/BirthdayModule";
import AboutMinistry from "./pages/AboutMinistry";
import Statutes from "./pages/Statutes";
import VocalTraining from "./pages/VocalTraining";
import MusicalTraining from "./pages/MusicalTraining";
import DanceTraining from "./pages/DanceTraining";
import PersonalAssistant from "./pages/PersonalAssistant";
import NotificationTesting from "./pages/NotificationTesting";
import ScheduledNotifications from "./pages/ScheduledNotifications";
import Settings from "./pages/Settings";
import GroupRehearsal from "./pages/GroupRehearsal";
import RehearsalSession from "./pages/RehearsalSession";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";
import { ThemeProvider } from "./hooks/useTheme";
import { ProtectedRoute } from "./components/ProtectedRoute";
import NotificationOverlay from "./components/notifications/NotificationOverlay";
import ServiceNotificationOverlay from "./components/notifications/ServiceNotificationOverlay";
import { useSwipeGesture } from "./hooks/useSwipeGesture";
import { BirthdayOverlay } from "./components/birthday/BirthdayOverlay";
import DirectorReplacementRequestOverlay from "./components/agenda/DirectorReplacementRequestOverlay";
import DirectorReplacementNotificationOverlay from "./components/agenda/DirectorReplacementNotificationOverlay";
import SongChangeOverlay from "./components/songs/SongChangeOverlay";
import { PendingSongNotifications } from "./components/songs/PendingSongNotifications";
import { DailyVerseOverlay } from "./components/notifications/DailyVerseOverlay";
import { DailyAdviceOverlay } from "./components/notifications/DailyAdviceOverlay";
import GeneralAnnouncementOverlay from "./components/notifications/GeneralAnnouncementOverlay";
import MinistryInstructionsOverlay from "./components/notifications/MinistryInstructionsOverlay";
import ExtraordinaryRehearsalOverlay from "./components/notifications/ExtraordinaryRehearsalOverlay";
import BloodDonationOverlay from "./components/notifications/BloodDonationOverlay";
import { SwipeIndicator } from "./components/SwipeIndicator";
import { supabase } from "./integrations/supabase/client";
import "./App.css";

const queryClient = new QueryClient();

function HeaderTrigger() {
  return <AnimatedLogoTrigger />;
}

function SidebarLayout() {
  const { setOpenMobile, isMobile } = useSidebar();

  useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile) {
        setOpenMobile(true);
      }
    },
  });

  return null;
}

// Hook personalizado para manejar notificaciones del sistema
function useSystemNotifications() {
  const [currentNotification, setCurrentNotification] = useState<any>(null);
  const [showServiceOverlay, setShowServiceOverlay] = useState(false);
  const [showVerseOverlay, setShowVerseOverlay] = useState(false);
  const [showAdviceOverlay, setShowAdviceOverlay] = useState(false);
  const [showGeneralAnnouncement, setShowGeneralAnnouncement] = useState(false);
  const [showMinistryInstructions, setShowMinistryInstructions] = useState(false);
  const [showExtraordinaryRehearsal, setShowExtraordinaryRehearsal] = useState(false);
  const [showBloodDonation, setShowBloodDonation] = useState(false);

  useEffect(() => {
    console.log("🔔 [SYSTEM NOTIFICATIONS] Iniciando configuración del listener...");

    let cleanup: (() => void) | null = null;

    // Obtener el usuario actual para filtrar solo sus notificaciones
    const setupListener = async () => {
      try {
        console.log("👤 [SYSTEM NOTIFICATIONS] Obteniendo usuario autenticado...");
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error("❌ [SYSTEM NOTIFICATIONS] Error obteniendo usuario:", authError);
          return;
        }
        
        if (!user) {
          console.log("❌ [SYSTEM NOTIFICATIONS] No hay usuario autenticado");
          return;
        }

        console.log("✅ [SYSTEM NOTIFICATIONS] Usuario autenticado:", user.id);
        console.log("🔧 [SYSTEM NOTIFICATIONS] Creando canal de Realtime...");

        const channelName = `user-notifications-${user.id}`;
        console.log("📺 [SYSTEM NOTIFICATIONS] Nombre del canal:", channelName);

        const channel = supabase
          .channel(channelName, {
            config: {
              broadcast: { self: true },
              presence: { key: user.id }
            }
          })
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "system_notifications",
              filter: `recipient_id=eq.${user.id}`,
            },
            async (payload) => {
              console.log("🎯 [SYSTEM NOTIFICATIONS] ¡Nueva notificación recibida!", payload.new);
              const notification = payload.new;

              // Solo procesar notificaciones no leídas
              if (notification.is_read) {
                console.log("📭 [SYSTEM NOTIFICATIONS] Notificación ya leída, ignorando");
                return;
              }

              console.log("📋 [SYSTEM NOTIFICATIONS] Procesando notificación tipo:", notification.type);
              setCurrentNotification(notification);

              // Mostrar el overlay correspondiente según el tipo
              switch (notification.type) {
                case "service_overlay":
                  console.log("📢 [SYSTEM NOTIFICATIONS] Activando overlay de servicios");
                  setShowServiceOverlay(true);
                  
                  // Marcar como leída
                  try {
                    await supabase
                      .from("system_notifications")
                      .update({ is_read: true })
                      .eq("id", notification.id);
                    console.log("✅ [SYSTEM NOTIFICATIONS] Notificación marcada como leída");
                  } catch (err) {
                    console.error("❌ [SYSTEM NOTIFICATIONS] Error marcando notificación:", err);
                  }
                  break;
                case "daily_verse":
                  console.log("📖 [SYSTEM NOTIFICATIONS] Mostrando overlay de versículo");
                  setShowVerseOverlay(true);
                  
                  // Marcar como leída
                  try {
                    await supabase
                      .from("system_notifications")
                      .update({ is_read: true })
                      .eq("id", notification.id);
                    console.log("✅ [SYSTEM NOTIFICATIONS] Notificación de versículo marcada como leída");
                  } catch (err) {
                    console.error("❌ [SYSTEM NOTIFICATIONS] Error marcando notificación:", err);
                  }
                  break;
                case "daily_advice":
                  console.log("💡 [SYSTEM NOTIFICATIONS] Mostrando overlay de consejo");
                  setShowAdviceOverlay(true);
                  
                  // Marcar como leída
                  try {
                    await supabase
                      .from("system_notifications")
                      .update({ is_read: true })
                      .eq("id", notification.id);
                    console.log("✅ [SYSTEM NOTIFICATIONS] Notificación de consejo marcada como leída");
                  } catch (err) {
                    console.error("❌ [SYSTEM NOTIFICATIONS] Error marcando notificación:", err);
                  }
                  break;
                case "death_announcement":
                case "meeting_announcement":
                case "special_service":
                case "prayer_request":
                  console.log("📢 [SYSTEM NOTIFICATIONS] Mostrando anuncio general:", notification.type);
                  setShowGeneralAnnouncement(true);
                  
                  // Marcar como leída
                  try {
                    await supabase
                      .from("system_notifications")
                      .update({ is_read: true })
                      .eq("id", notification.id);
                    console.log("✅ [SYSTEM NOTIFICATIONS] Notificación de anuncio general marcada como leída");
                  } catch (err) {
                    console.error("❌ [SYSTEM NOTIFICATIONS] Error marcando notificación:", err);
                  }
                  break;
                case "ministry_instructions":
                  console.log("📋 [SYSTEM NOTIFICATIONS] Mostrando instrucciones ministeriales");
                  setShowMinistryInstructions(true);
                  
                  // Marcar como leída
                  try {
                    await supabase
                      .from("system_notifications")
                      .update({ is_read: true })
                      .eq("id", notification.id);
                    console.log("✅ [SYSTEM NOTIFICATIONS] Notificación de instrucciones marcada como leída");
                  } catch (err) {
                    console.error("❌ [SYSTEM NOTIFICATIONS] Error marcando notificación:", err);
                  }
                  break;
                case "extraordinary_rehearsal":
                  console.log("🎵 [SYSTEM NOTIFICATIONS] Mostrando ensayo extraordinario");
                  setShowExtraordinaryRehearsal(true);
                  
                  // Marcar como leída
                  try {
                    await supabase
                      .from("system_notifications")
                      .update({ is_read: true })
                      .eq("id", notification.id);
                    console.log("✅ [SYSTEM NOTIFICATIONS] Notificación de ensayo marcada como leída");
                  } catch (err) {
                    console.error("❌ [SYSTEM NOTIFICATIONS] Error marcando notificación:", err);
                  }
                  break;
                case "blood_donation":
                  console.log("🩸 [SYSTEM NOTIFICATIONS] Mostrando solicitud de donación de sangre");
                  setShowBloodDonation(true);
                  
                  // Marcar como leída
                  try {
                    await supabase
                      .from("system_notifications")
                      .update({ is_read: true })
                      .eq("id", notification.id);
                    console.log("✅ [SYSTEM NOTIFICATIONS] Notificación de donación marcada como leída");
                  } catch (err) {
                    console.error("❌ [SYSTEM NOTIFICATIONS] Error marcando notificación:", err);
                  }
                  break;
                case "general":
                case "reminder":
                  console.log("ℹ️ [SYSTEM NOTIFICATIONS] Notificación general:", notification);
                  break;
                default:
                  console.log("❌ [SYSTEM NOTIFICATIONS] Tipo de notificación no manejado:", notification.type);
              }
            },
          )
          .subscribe((status) => {
            console.log("📡 [SYSTEM NOTIFICATIONS] Estado de suscripción:", status);
            if (status === "SUBSCRIBED") {
              console.log("✅ [SYSTEM NOTIFICATIONS] ¡Suscripción exitosa! El listener está activo y esperando notificaciones...");
            } else if (status === "CHANNEL_ERROR") {
              console.error("❌ [SYSTEM NOTIFICATIONS] Error en la suscripción");
            } else if (status === "TIMED_OUT") {
              console.error("⏱️ [SYSTEM NOTIFICATIONS] Timeout en la suscripción");
            } else if (status === "CLOSED") {
              console.log("🔒 [SYSTEM NOTIFICATIONS] Canal cerrado");
            }
          });

        // Guardar función de cleanup para el canal
        cleanup = () => {
          console.log("🧹 [SYSTEM NOTIFICATIONS] Limpiando canal");
          supabase.removeChannel(channel);
        };
      } catch (error) {
        console.error("❌ [SYSTEM NOTIFICATIONS] Error en setup:", error);
      }
    };

    setupListener();

    return () => {
      console.log("🔚 [SYSTEM NOTIFICATIONS] Desmontando listener");
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  const closeServiceOverlay = () => {
    console.log("🔒 Cerrando overlay de servicios");
    setShowServiceOverlay(false);
    setCurrentNotification(null);
  };

  const closeVerseOverlay = () => {
    console.log("🔒 Cerrando overlay de versículo");
    setShowVerseOverlay(false);
    setCurrentNotification(null);
  };

  const closeAdviceOverlay = () => {
    console.log("🔒 Cerrando overlay de consejo");
    setShowAdviceOverlay(false);
    setCurrentNotification(null);
  };

  const closeGeneralAnnouncement = () => {
    console.log("🔒 Cerrando anuncio general");
    setShowGeneralAnnouncement(false);
    setCurrentNotification(null);
  };

  const closeMinistryInstructions = () => {
    console.log("🔒 Cerrando instrucciones ministeriales");
    setShowMinistryInstructions(false);
    setCurrentNotification(null);
  };

  const closeExtraordinaryRehearsal = () => {
    console.log("🔒 Cerrando ensayo extraordinario");
    setShowExtraordinaryRehearsal(false);
    setCurrentNotification(null);
  };

  const closeBloodDonation = () => {
    console.log("🔒 Cerrando donación de sangre");
    setShowBloodDonation(false);
    setCurrentNotification(null);
  };

  return {
    showServiceOverlay,
    showVerseOverlay,
    showAdviceOverlay,
    showGeneralAnnouncement,
    showMinistryInstructions,
    showExtraordinaryRehearsal,
    showBloodDonation,
    currentNotification,
    closeServiceOverlay,
    closeVerseOverlay,
    closeAdviceOverlay,
    closeGeneralAnnouncement,
    closeMinistryInstructions,
    closeExtraordinaryRehearsal,
    closeBloodDonation,
  };
}

function AppContent() {
  const {
    showServiceOverlay,
    showVerseOverlay,
    showAdviceOverlay,
    showGeneralAnnouncement,
    showMinistryInstructions,
    showExtraordinaryRehearsal,
    showBloodDonation,
    currentNotification,
    closeServiceOverlay,
    closeVerseOverlay,
    closeAdviceOverlay,
    closeGeneralAnnouncement,
    closeMinistryInstructions,
    closeExtraordinaryRehearsal,
    closeBloodDonation,
  } = useSystemNotifications();

  console.log("🔄 Renderizando AppContent:", {
    showServiceOverlay,
    showVerseOverlay,
    showAdviceOverlay,
    hasNotification: !!currentNotification,
  });

  return (
    <BrowserRouter>
      {/* Overlays de notificaciones del sistema - SOLO UNO de cada tipo */}
      {showServiceOverlay && (
        <ServiceNotificationOverlay
          forceShow={true}
          onClose={closeServiceOverlay}
          onNavigate={(path) => {
            closeServiceOverlay();
            // La navegación se maneja dentro del componente
          }}
        />
      )}

      {showVerseOverlay && currentNotification && (
        <DailyVerseOverlay
          verseText={currentNotification.metadata?.verse_text || ""}
          verseReference={currentNotification.metadata?.verse_reference || ""}
          onClose={closeVerseOverlay}
        />
      )}

      {showAdviceOverlay && currentNotification && (
        <DailyAdviceOverlay
          title={currentNotification.metadata?.advice_title || ""}
          message={currentNotification.metadata?.advice_message || ""}
          onClose={closeAdviceOverlay}
        />
      )}

      {showGeneralAnnouncement && currentNotification && (
        <GeneralAnnouncementOverlay
          title={currentNotification.metadata?.title || currentNotification.title}
          message={currentNotification.metadata?.message || currentNotification.message}
          announcementType={currentNotification.type}
          onClose={closeGeneralAnnouncement}
        />
      )}

      {showMinistryInstructions && currentNotification && (
        <MinistryInstructionsOverlay
          title={currentNotification.metadata?.title || currentNotification.title}
          instructions={currentNotification.metadata?.instructions || currentNotification.message}
          priority={currentNotification.metadata?.priority || 'normal'}
          onClose={closeMinistryInstructions}
        />
      )}

      {showExtraordinaryRehearsal && currentNotification && (
        <ExtraordinaryRehearsalOverlay
          activityName={currentNotification.metadata?.activity_name || currentNotification.title}
          date={currentNotification.metadata?.date || new Date().toISOString()}
          time={currentNotification.metadata?.rehearsal_time || ""}
          location={currentNotification.metadata?.location}
          additionalNotes={currentNotification.metadata?.additional_notes}
          onClose={closeExtraordinaryRehearsal}
        />
      )}

      {showBloodDonation && currentNotification && (
        <BloodDonationOverlay
          recipientName={currentNotification.metadata?.recipient_name || ""}
          bloodType={currentNotification.metadata?.blood_type || ""}
          contactPhone={currentNotification.metadata?.contact_phone || ""}
          medicalCenter={currentNotification.metadata?.medical_center || ""}
          familyContact={currentNotification.metadata?.family_contact || ""}
          urgencyLevel={currentNotification.metadata?.urgency_level || 'urgent'}
          additionalInfo={currentNotification.metadata?.additional_info}
          onClose={closeBloodDonation}
        />
      )}

      {/* Overlays existentes - SIN DUPLICADOS */}
      <BirthdayOverlay />
      <DirectorReplacementRequestOverlay />
      <DirectorReplacementNotificationOverlay />
      <SongChangeOverlay />
      <PendingSongNotifications />

      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SidebarProvider defaultOpen={false}>
                <SidebarLayout />
                <SwipeIndicator />
                <div className="flex h-screen w-full bg-gray-50">
                  <AppSidebar />
                  <div className="flex-1 flex flex-col">
                    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                      <AnimatedLogoTrigger />
                    </header>
                    <main className="flex-1 overflow-auto bg-gray-50">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/repertorio" element={<RepertoirioMusical />} />
                        <Route path="/rehearsals" element={<GroupRehearsal />} />
                        <Route path="/rehearsals/:sessionId" element={<RehearsalSession />} />
                        <Route path="/agenda" element={<MinisterialAgenda />} />
                        <Route path="/director-replacements" element={<DirectorReplacements />} />
                        <Route path="/communication" element={<Communication />} />
                        <Route path="/integrantes" element={<Integrantes />} />
                        <Route path="/member/:id" element={<MemberProfile />} />
                        <Route path="/worship-groups" element={<WorshipGroups />} />
                        <Route path="/recomendaciones" element={<Recomendaciones />} />
                        <Route path="/eventos-especiales" element={<EventosEspeciales />} />
                        <Route path="/spiritual" element={<SpiritualModule />} />
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/notificaciones" element={<Notificaciones />} />
                        <Route path="/cumpleanos" element={<BirthdayModulePage />} />
                        <Route path="/vocal-training" element={<VocalTraining />} />
                        <Route path="/musical-training" element={<MusicalTraining />} />
                        <Route path="/dance-training" element={<DanceTraining />} />
                        <Route path="/personal-assistant" element={<PersonalAssistant />} />
                        <Route path="/notification-testing" element={<NotificationTesting />} />
                        <Route path="/scheduled-notifications" element={<ScheduledNotifications />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/about" element={<AboutMinistry />} />
                        <Route path="/statutes" element={<Statutes />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NotificationOverlay />
            {showSplash ? <SplashScreen onComplete={handleSplashComplete} /> : <AppContent />}
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;

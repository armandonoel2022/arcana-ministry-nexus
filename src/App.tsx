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
import { supabase } from "./integrations/supabase/client";
import "./App.css";

const queryClient = new QueryClient();

function HeaderTrigger() {
  return <AnimatedLogoTrigger />;
}

function SidebarLayout() {
  const { setOpenMobile, isMobile } = useSidebar();

  // Gesto de deslizamiento para abrir el sidebar en móvil
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

  useEffect(() => {
    // Configurar el listener de Supabase para notificaciones del sistema
    const channel = supabase
      .channel("system_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "system_notifications",
        },
        (payload) => {
          console.log("Nueva notificación del sistema recibida:", payload.new);
          const notification = payload.new;

          // Guardar la notificación actual
          setCurrentNotification(notification);

          // Mostrar el overlay correspondiente según el tipo
          switch (notification.type) {
            case "service_overlay":
              setShowServiceOverlay(true);
              break;
            case "daily_verse":
              setShowVerseOverlay(true);
              break;
            case "daily_advice":
              setShowAdviceOverlay(true);
              break;
            case "general":
            case "reminder":
              // Para notificaciones generales, podrías mostrar un toast o notificación estándar
              console.log("Notificación general:", notification);
              break;
            default:
              console.log("Tipo de notificación no manejado:", notification.type);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const closeServiceOverlay = () => {
    setShowServiceOverlay(false);
    setCurrentNotification(null);
  };

  const closeVerseOverlay = () => {
    setShowVerseOverlay(false);
    setCurrentNotification(null);
  };

  const closeAdviceOverlay = () => {
    setShowAdviceOverlay(false);
    setCurrentNotification(null);
  };

  return {
    showServiceOverlay,
    showVerseOverlay,
    showAdviceOverlay,
    currentNotification,
    closeServiceOverlay,
    closeVerseOverlay,
    closeAdviceOverlay,
  };
}

function AppContent() {
  const {
    showServiceOverlay,
    showVerseOverlay,
    showAdviceOverlay,
    currentNotification,
    closeServiceOverlay,
    closeVerseOverlay,
    closeAdviceOverlay,
  } = useSystemNotifications();

  return (
    <BrowserRouter>
      {/* Overlays de notificaciones del sistema */}
      {showServiceOverlay && (
        <ServiceNotificationOverlay
          forceShow={true}
          onClose={closeServiceOverlay}
          onNavigate={(path) => {
            closeServiceOverlay();
            // Navegación se manejaría en el componente ServiceNotificationOverlay
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

      {/* Overlays existentes */}
      <ServiceNotificationOverlay />
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
              <SidebarProvider>
                <SidebarLayout />
                <div className="flex h-screen w-full bg-gray-50">
                  <AppSidebar />
                  <div className="flex-1 flex flex-col">
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

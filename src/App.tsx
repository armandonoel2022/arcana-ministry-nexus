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
import OverlayManager from "./components/notifications/OverlayManager";
import { useSwipeGesture } from "./hooks/useSwipeGesture";
import { BirthdayOverlay } from "./components/birthday/BirthdayOverlay";
import DirectorReplacementRequestOverlay from "./components/agenda/DirectorReplacementRequestOverlay";
import DirectorReplacementNotificationOverlay from "./components/agenda/DirectorReplacementNotificationOverlay";
import SongChangeOverlay from "./components/songs/SongChangeOverlay";
import { PendingSongNotifications } from "./components/songs/PendingSongNotifications";
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

function AppContent() {
  return (
    <BrowserRouter>
      {/* OverlayManager centralizado - maneja TODOS los overlays de notificaciones */}
      <OverlayManager />

      {/* Overlays específicos que funcionan independientemente */}
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

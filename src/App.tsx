
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Menu } from "lucide-react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
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
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";

const queryClient = new QueryClient();

function HeaderTrigger() {
  const { open } = useSidebar();
  
  return (
    <SidebarTrigger className="group p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105 md:hidden">
      <Menu className={`w-5 h-5 transition-transform duration-300 ${open ? 'rotate-90' : 'rotate-0'} group-hover:text-blue-600`} />
    </SidebarTrigger>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/*" element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <div className="flex h-screen w-full bg-gray-50">
                      <AppSidebar />
                      <div className="flex-1 flex flex-col">
                        {/* Global Header with Sidebar Toggle - Only on Mobile */}
                        <header className="h-12 bg-white border-b border-gray-200 flex items-center px-4 shadow-sm md:hidden">
                          <HeaderTrigger />
                          <div className="flex-1 flex items-center justify-center">
                            <h1 className="text-lg font-bold text-gray-900">ARCANA</h1>
                          </div>
                        </header>
                        
                        <main className="flex-1 overflow-auto bg-gray-50">
                          <Routes>
                            <Route path="/" element={<Index />} />
                            <Route path="/repertorio" element={<RepertoirioMusical />} />
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
                            <Route path="/about" element={<AboutMinistry />} />
                            <Route path="/statutes" element={<Statutes />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </SidebarProvider>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

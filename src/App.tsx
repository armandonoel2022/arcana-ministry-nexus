
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
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
import AboutMinistry from "./pages/AboutMinistry";
import Statutes from "./pages/Statutes";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <main className="flex-1 overflow-auto">
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
                  <Route path="/about" element={<AboutMinistry />} />
                  <Route path="/statutes" element={<Statutes />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </QueryClientProvider>
  );
}

export default App;

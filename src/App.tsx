
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import Index from "./pages/Index";
import AboutMinistry from "./pages/AboutMinistry";
import Statutes from "./pages/Statutes";
import MinisterialAgenda from "./pages/MinisterialAgenda";
import RepertoirioMusical from "./pages/RepertoirioMusical";
import Integrantes from "./pages/Integrantes";
import MemberProfile from "./pages/MemberProfile";
import WorshipGroups from "./pages/WorshipGroups";
import Communication from "./pages/Communication";
import AdminDashboard from "./pages/AdminDashboard";
import SpiritualModule from "./pages/SpiritualModule";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full">
            <AppSidebar />
            <main className="flex-1 flex flex-col">
              <div className="p-4 border-b border-slate-200 bg-white">
                <SidebarTrigger />
              </div>
              <div className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<AboutMinistry />} />
                  <Route path="/statutes" element={<Statutes />} />
                  <Route path="/agenda" element={<MinisterialAgenda />} />
                  <Route path="/repertorio" element={<RepertoirioMusical />} />
                  <Route path="/integrantes" element={<Integrantes />} />
                  <Route path="/integrantes/:id" element={<MemberProfile />} />
                  <Route path="/grupos" element={<WorshipGroups />} />
                  <Route path="/comunicacion" element={<Communication />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                  <Route path="/espiritual" element={<SpiritualModule />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </div>
            </main>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

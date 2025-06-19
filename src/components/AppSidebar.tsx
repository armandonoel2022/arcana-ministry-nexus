
import {
  Calendar,
  Music,
  Users,
  MessageCircle,
  Heart,
  Settings,
  Mic,
  BookOpen,
  Gift,
  Scan,
  Bell,
  Bot,
  Home
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

const menuItems = [
  {
    id: "home",
    title: "Inicio",
    icon: Home,
    url: "/",
    isMain: true
  },
  {
    id: "agenda",
    title: "Agenda Ministerial",
    description: "Turnos de alabanza y notificaciones",
    icon: Calendar,
    url: "#",
    comingSoon: true,
    isMain: true
  },
  {
    id: "repertorio", 
    title: "Repertorio Musical",
    description: "Catálogo de canciones",
    icon: Music,
    url: "#",
    comingSoon: true,
    isMain: true
  },
  {
    id: "musicos",
    title: "Gestión de Músicos",
    description: "Rotación y solicitudes",
    icon: Users,
    url: "#",
    comingSoon: true,
    isMain: true
  },
  {
    id: "comunicacion",
    title: "Comunicación",
    description: "Chats grupales",
    icon: MessageCircle,
    url: "#",
    comingSoon: true,
    isMain: false
  },
  {
    id: "perfiles",
    title: "Perfiles",
    description: "Datos personales y roles",
    icon: Mic,
    url: "#",
    comingSoon: true,
    isMain: false
  },
  {
    id: "espiritual",
    title: "Módulo Espiritual",
    description: "Versículo diario",
    icon: BookOpen,
    url: "#",
    comingSoon: true,
    isMain: false
  },
  {
    id: "eventos",
    title: "Eventos Especiales",
    description: "Cumpleaños y actividades",
    icon: Heart,
    url: "#",
    comingSoon: true,
    isMain: false
  },
  {
    id: "inventario",
    title: "Inventario QR",
    description: "Registro de equipos",
    icon: Scan,
    url: "#",
    comingSoon: true,
    isMain: false
  },
  {
    id: "donaciones",
    title: "Donaciones",
    description: "Registro de ofrendas",
    icon: Gift,
    url: "#",
    comingSoon: true,
    isMain: false
  },
  {
    id: "cuidado",
    title: "Recomendaciones",
    description: "Ejercicios personalizados",
    icon: Settings,
    url: "#",
    comingSoon: true,
    isMain: false
  },
  {
    id: "chatbot",
    title: "ARCANA Asistente",
    description: "Chatbot AI",
    icon: Bot,
    url: "#",
    comingSoon: true,
    isMain: false
  },
  {
    id: "notificaciones",
    title: "Notificaciones",
    description: "Centro de alertas",
    icon: Bell,
    url: "#",
    comingSoon: true,
    isMain: false
  }
];

export function AppSidebar() {
  const mainModules = menuItems.filter(item => item.isMain);
  const otherModules = menuItems.filter(item => !item.isMain);

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-arcana-gradient rounded-full flex items-center justify-center">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold arcana-gradient-text">ARCANA</h2>
            <p className="text-sm text-gray-600">Ministerio ADN</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulos Principales</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainModules.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors">
                        <IconComponent className="w-5 h-5 text-arcana-blue-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{item.title}</span>
                            {item.comingSoon && (
                              <Badge variant="secondary" className="text-xs bg-arcana-gold-gradient text-white border-0">
                                Próximamente
                              </Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          )}
                        </div>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Otros Módulos</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {otherModules.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      <a href={item.url} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                        <IconComponent className="w-4 h-4 text-arcana-blue-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">{item.title}</span>
                            {item.comingSoon && (
                              <Badge variant="secondary" className="text-xs bg-arcana-gold-gradient text-white border-0">
                                Próximamente
                              </Badge>
                            )}
                          </div>
                        </div>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 ARCANA
          </p>
          <p className="text-xs text-gray-400">
            Ministerio ADN Arca de Noé
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

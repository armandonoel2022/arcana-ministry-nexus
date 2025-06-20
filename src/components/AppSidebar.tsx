import {
  Calendar,
  Music,
  Users,
  MessageCircle,
  Heart,
  Settings,
  Mic,
  BookOpen,
  Scan,
  Bell,
  Home,
  UsersRound,
  Shield
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
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const menuItems = [
  {
    id: "home",
    title: "Inicio",
    icon: Home,
    url: "/",
    isMain: true
  },
  {
    id: "about",
    title: "Acerca del Ministerio",
    icon: Heart,
    url: "/about",
    isMain: true
  },
  {
    id: "statutes",
    title: "Estatutos",
    icon: BookOpen,
    url: "/statutes",
    isMain: true
  },
  {
    id: "agenda",
    title: "Agenda Ministerial",
    icon: Calendar,
    url: "/agenda",
    comingSoon: false,
    isMain: true
  },
  {
    id: "repertorio", 
    title: "Repertorio Musical",
    icon: Music,
    url: "/repertorio",
    comingSoon: false,
    isMain: true
  },
  {
    id: "integrantes",
    title: "Integrantes",
    icon: Users,
    url: "/integrantes",
    comingSoon: false,
    isMain: true
  },
  {
    id: "grupos",
    title: "Grupos de Alabanza",
    icon: UsersRound,
    url: "/grupos",
    comingSoon: false,
    isMain: true
  },
  {
    id: "comunicacion",
    title: "Comunicación",
    icon: MessageCircle,
    url: "/comunicacion",
    comingSoon: false,
    isMain: true
  },
  {
    id: "admin",
    title: "Panel de Administración",
    icon: Shield,
    url: "/admin",
    comingSoon: false,
    isMain: true,
    adminOnly: true
  },
  {
    id: "espiritual",
    title: "Módulo Espiritual",
    icon: BookOpen,
    url: "/espiritual",
    comingSoon: false,
    isMain: false
  },
  {
    id: "eventos",
    title: "Eventos Especiales",
    icon: Heart,
    url: "/eventos-especiales",
    comingSoon: false,
    isMain: false
  },
  {
    id: "inventario",
    title: "Inventario QR",
    icon: Scan,
    url: "#",
    comingSoon: true,
    isMain: false
  },
  {
    id: "cuidado",
    title: "Recomendaciones",
    icon: Settings,
    url: "/recomendaciones",
    comingSoon: false,
    isMain: false
  },
  {
    id: "notificaciones",
    title: "Notificaciones",
    icon: Bell,
    url: "#",
    comingSoon: true,
    isMain: false
  }
];

export function AppSidebar() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        if (profile) {
          setUserRole(profile.role);
        }
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar elementos del menú basado en el rol del usuario
  const getFilteredMenuItems = (items: typeof menuItems) => {
    return items.filter(item => {
      if (item.adminOnly) {
        return userRole === 'administrator';
      }
      return true;
    });
  };

  const filteredMainModules = getFilteredMenuItems(menuItems.filter(item => item.isMain));
  const filteredOtherModules = getFilteredMenuItems(menuItems.filter(item => !item.isMain));

  return (
    <Sidebar className="border-r border-slate-200">
      <SidebarHeader className="p-4">
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
              {filteredMainModules.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      {item.url.startsWith('#') ? (
                        <a href={item.url} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                          <IconComponent className="w-4 h-4 text-arcana-blue-600 flex-shrink-0" />
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 text-sm">{item.title}</span>
                            {item.comingSoon && (
                              <Badge variant="secondary" className="text-xs bg-arcana-gold-gradient text-white border-0">
                                Próximamente
                              </Badge>
                            )}
                          </div>
                        </a>
                      ) : (
                        <Link to={item.url} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                          <IconComponent className="w-4 h-4 text-arcana-blue-600 flex-shrink-0" />
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800 text-sm">{item.title}</span>
                            {item.comingSoon && (
                              <Badge variant="secondary" className="text-xs bg-arcana-gold-gradient text-white border-0">
                                Próximamente
                              </Badge>
                            )}
                          </div>
                        </Link>
                      )}
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
              {filteredOtherModules.map((item) => {
                const IconComponent = item.icon;
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton asChild>
                      {item.url.startsWith('#') ? (
                        <a href={item.url} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                          <IconComponent className="w-4 h-4 text-arcana-blue-600 flex-shrink-0" />
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">{item.title}</span>
                            {item.comingSoon && (
                              <Badge variant="secondary" className="text-xs bg-arcana-gold-gradient text-white border-0">
                                Próximamente
                              </Badge>
                            )}
                          </div>
                        </a>
                      ) : (
                        <Link to={item.url} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 transition-colors">
                          <IconComponent className="w-4 h-4 text-arcana-blue-600 flex-shrink-0" />
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-700">{item.title}</span>
                            {item.comingSoon && (
                              <Badge variant="secondary" className="text-xs bg-arcana-gold-gradient text-white border-0">
                                Próximamente
                              </Badge>
                            )}
                          </div>
                        </Link>
                      )}
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

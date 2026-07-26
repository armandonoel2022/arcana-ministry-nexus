
import {
  Calendar,
  Music,
  MessageSquare,
  Users,
  Star,
  Sparkles,
  Heart,
  Bell,
  Settings,
  Info,
  FileText,
  UserCheck,
  Home,
  Gift,
  Menu,
  Mic,
  Guitar,
  Users2,
  Bot,
  LogOut,
  Headphones,
  TestTube,
  Shirt
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar"
import { Link, useLocation } from "react-router-dom"
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications"
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/hooks/usePermissions"
import { Button } from "@/components/ui/button"
import { ThemeSelector } from "@/components/ThemeSelector"
import { PushNotificationPermission } from "@/components/notifications/PushNotificationPermission"
import { LucideIcon } from "lucide-react"
import arcanaLogo from "@/assets/arcana-logo.png"

// Menu items organized by categories
// Icon mapping for menu items
const iconMap: Record<string, LucideIcon> = {
  '/': Home,
  '/notificaciones': Bell,
  '/agenda': Calendar,
  '/reemplazos': UserCheck,
  '/director-replacements': UserCheck,
  '/repertorio': Music,
  '/ensayos': Headphones,
  '/rehearsals': Headphones,
  '/eventos': Sparkles,
  '/eventos-especiales': Sparkles,
  '/comunicacion': MessageSquare,
  '/communication': MessageSquare,
  '/integrantes': Users,
  '/grupos': Users,
  '/worship-groups': Users,
  '/cumpleanos': Gift,
  '/recomendaciones': Star,
  '/asistente': Bot,
  '/personal-assistant': Bot,
  '/espiritual': Heart,
  '/spiritual': Heart,
  '/configuracion': Settings,
  '/settings': Settings,
  '/admin': Settings,
  '/pruebas-notificaciones': TestTube,
  '/acerca': Info,
  '/about': Info,
  '/estatutos': FileText,
  '/statutes': FileText,
  '/notificaciones-programadas': Calendar,
  '/scheduled-notifications': Calendar,
  '/mi-outfit': Shirt,
};

// Category order for display
const categoryOrder = [
  'Principal',
  'Ministerio',
  'Comunidad',
  'Personal',
  'Configuración',
  'Administración Avanzada'
];

export function AppSidebar() {
  const { setOpen, state } = useSidebar()
  const location = useLocation()
  const unreadCount = useUnreadNotifications()
  const { signOut, user, userProfile } = useAuth()
  const { permissions, isAdmin, isLoading } = usePermissions()
  const isCollapsed = state === "collapsed"
  
  const handleLinkClick = () => {
    // Close sidebar when a link is clicked (both mobile and desktop)
    setOpen(false)
  }

  // Group permissions by category
  const groupedPermissions = categoryOrder.map(category => {
    const items = permissions
      .filter(p => p.screen_category === category && p.can_view)
      .map(p => ({
        title: p.screen_name,
        url: p.screen_path,
        icon: iconMap[p.screen_path] || Settings,
      }));
    
    return {
      label: category,
      items,
    };
  }).filter(group => group.items.length > 0);

  return (
    <Sidebar className="border-r-0 shadow-2xl" collapsible="icon">
      <SidebarContent className="bg-sidebar flex flex-col h-full overflow-hidden">
        {/* Header - fixed top */}
        <div className={`flex-shrink-0 border-b border-sidebar-border/60 ${isCollapsed ? 'p-3 flex justify-center' : 'p-5'}`}>
          {isCollapsed ? (
            <img 
              src={arcanaLogo} 
              alt="ARCANA" 
              className="w-10 h-10 object-contain rounded-xl bg-card border border-sidebar-border p-1 shadow-md"
            />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <img 
                  src={arcanaLogo} 
                  alt="ARCANA Logo" 
                  className="w-11 h-11 object-contain rounded-2xl bg-card border border-sidebar-border p-1.5 shadow-md"
                />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate tracking-tight">{userProfile?.full_name || 'Usuario'}</p>
                <p className="text-xs text-sidebar-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Categories - scrollable middle */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="p-4 text-center text-sidebar-muted-foreground text-sm">
              Cargando menú...
            </div>
          ) : groupedPermissions.length === 0 ? (
            <SidebarGroup className="px-3 py-2">
              <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-muted-foreground font-semibold mb-2">
                Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      asChild 
                      className="h-10 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-lg"
                      data-active={location.pathname === '/'}
                    >
                      <Link 
                        to="/" 
                        className="flex items-center gap-3 px-3"
                        onClick={handleLinkClick}
                      >
                        <Home className="w-4 h-4" />
                        <span className="font-medium text-sm">Inicio</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : (
            groupedPermissions.map((category) => (
              <SidebarGroup key={category.label} className="px-3 py-2">
                <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-muted-foreground font-semibold mb-2">
                  {category.label}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="space-y-1">
                    {category.items.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            className="h-10 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-lg"
                            data-active={location.pathname === item.url}
                          >
                            <Link 
                              to={item.url} 
                              className="flex items-center gap-3 px-3"
                              onClick={handleLinkClick}
                            >
                              <IconComponent className="w-4 h-4" />
                              <span className="font-medium text-sm">{item.title}</span>
                              {item.title === "Notificaciones" && unreadCount > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold">
                                  {unreadCount > 99 ? "99+" : unreadCount}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))
          )}
        </div>
        
        {/* Footer - fixed bottom */}
        <div className={`flex-shrink-0 border-t border-sidebar-border/60 bg-sidebar ${isCollapsed ? 'p-2 flex justify-center' : 'p-4'}`}>
          <Button
            onClick={signOut}
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={isCollapsed 
              ? "h-10 w-10 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
              : "w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"}
            aria-label="Cerrar Sesión"
          >
            <LogOut className={isCollapsed ? "w-5 h-5" : "w-4 h-4 mr-3"} />
            {!isCollapsed && "Cerrar Sesión"}
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}


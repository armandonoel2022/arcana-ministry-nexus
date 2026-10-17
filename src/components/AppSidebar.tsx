
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
  ShieldCheck,
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
  Shirt,
  Package,
  DollarSign,
  ChevronDown
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  '/admin': ShieldCheck,
  '/pruebas-notificaciones': TestTube,
  '/acerca': Info,
  '/about': Info,
  '/estatutos': FileText,
  '/statutes': FileText,
  '/notificaciones-programadas': Calendar,
  '/scheduled-notifications': Calendar,
  '/mi-outfit': Shirt,
  '/inventario': Package,
  '/finanzas': DollarSign,
};

// Screens already reachable from the Home dashboard — hidden from the sidebar to avoid redundancy
const HIDDEN_FROM_SIDEBAR = new Set([
  '/agenda', '/repertorio', '/director-replacements', '/reemplazos',
  '/communication', '/comunicacion', '/cumpleanos', '/recomendaciones',
  '/integrantes', '/worship-groups', '/grupos',
]);

// Hierarchical sidebar sections (client-side grouping, independent of DB categories)
// Always visible at the top, never inside a collapsible section
const PINNED_PATHS = ['/', '/notificaciones'];

const SECTIONS: { label: string; paths: string[]; defaultOpen: boolean }[] = [
  { label: 'Ministerio', paths: ['/rehearsals', '/ensayos', '/eventos-especiales', '/eventos'], defaultOpen: true },
  { label: 'Participa', paths: ['/encuestas', '/votaciones'], defaultOpen: true },
  { label: 'Mi espacio', paths: ['/spiritual', '/espiritual', '/personal-assistant', '/asistente', '/mi-outfit'], defaultOpen: false },
  { label: 'Gestión', paths: ['/inventario', '/finanzas', '/scheduled-notifications', '/notificaciones-programadas', '/admin', '/pruebas-notificaciones'], defaultOpen: false },
  { label: 'Ministerio e info', paths: ['/about', '/acerca', '/statutes', '/estatutos', '/settings', '/configuracion'], defaultOpen: false },
];

export function AppSidebar() {
  const { setOpen, state } = useSidebar()
  const location = useLocation()
  const unreadCount = useUnreadNotifications()
  const { signOut, user, userProfile } = useAuth()
  const { permissions, isLoading } = usePermissions()
  const isCollapsed = state === "collapsed"

  const handleLinkClick = () => {
    setOpen(false)
  }

  type Perm = typeof permissions[number];
  const visible = permissions.filter(p => p.can_view && !HIDDEN_FROM_SIDEBAR.has(p.screen_path) && !PINNED_PATHS.includes(p.screen_path));
  const used = new Set<string>();
  const toItem = (p: Perm) => ({
    title: p.screen_path === '/' ? 'Inicio' : p.screen_name,
    url: p.screen_path,
    icon: iconMap[p.screen_path] || Settings,
  });
  const sections = SECTIONS.map(section => ({
    label: section.label,
    defaultOpen: section.defaultOpen,
    items: section.paths
      .map(path => visible.find(p => p.screen_path === path))
      .filter((p): p is Perm => !!p)
      .map(p => { used.add(p.screen_path); return toItem(p); }),
  }));
  const leftovers = visible.filter(p => !used.has(p.screen_path)).map(toItem);
  if (leftovers.length) sections.push({ label: 'Otros', defaultOpen: false, items: leftovers });
  const groupedPermissions = sections.filter(g => g.items.length > 0);

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
            <>
            <SidebarGroup className="px-3 pt-3 pb-1">
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {[{ title: 'Inicio', url: '/', icon: Home }, { title: 'Notificaciones', url: '/notificaciones', icon: Bell }].map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        className="h-11 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-lg"
                        data-active={location.pathname === item.url}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-3" onClick={handleLinkClick}>
                          <item.icon className="w-5 h-5" />
                          <span className="font-semibold text-sm">{item.title}</span>
                          {item.url === '/notificaciones' && unreadCount > 0 && (
                            <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <div className="mx-4 my-1 border-t border-sidebar-border/60" />
            {groupedPermissions.map((category) => (
              <Collapsible
                key={category.label}
                defaultOpen={category.defaultOpen || category.items.some(i => i.url === location.pathname)}
                open={isCollapsed ? true : undefined}
                className="group/section"
              >
              <SidebarGroup className="px-3 py-1">
                {!isCollapsed && (
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel className="cursor-pointer flex items-center justify-between text-xs uppercase tracking-wider text-sidebar-muted-foreground font-semibold mb-1 hover:text-sidebar-foreground">
                      {category.label}
                      <ChevronDown className="w-3.5 h-3.5 transition-transform group-data-[state=closed]/section:-rotate-90" />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                )}
                <CollapsibleContent>
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
                </CollapsibleContent>
              </SidebarGroup>
              </Collapsible>
            ))}
            </>
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


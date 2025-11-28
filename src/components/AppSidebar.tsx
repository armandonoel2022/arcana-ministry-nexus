
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
  Headphones
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
import { Button } from "@/components/ui/button"
import { ThemeSelector } from "@/components/ThemeSelector"
import { PushNotificationPermission } from "@/components/notifications/PushNotificationPermission"

// Menu items organized by categories
const menuCategories = [
  {
    label: "Principal",
    items: [
      {
        title: "Inicio",
        url: "/",
        icon: Home,
      },
      {
        title: "Notificaciones",
        url: "/notificaciones",
        icon: Bell,
      },
    ]
  },
  {
    label: "Ministerio",
    items: [
      {
        title: "Agenda Ministerial",
        url: "/agenda",
        icon: Calendar,
      },
      {
        title: "Reemplazos de Director",
        url: "/director-replacements",
        icon: UserCheck,
      },
      {
        title: "Repertorio Musical",
        url: "/repertorio",
        icon: Music,
      },
      {
        title: "Ensayos Colaborativos",
        url: "/rehearsals",
        icon: Headphones,
      },
      {
        title: "Eventos Especiales",
        url: "/eventos-especiales",
        icon: Sparkles,
      },
    ]
  },
  {
    label: "Comunidad",
    items: [
      {
        title: "Comunicación",
        url: "/communication",
        icon: MessageSquare,
      },
      {
        title: "Integrantes",
        url: "/integrantes",
        icon: Users,
      },
      {
        title: "Grupos de Alabanza",
        url: "/worship-groups",
        icon: Users,
      },
      {
        title: "Cumpleaños",
        url: "/cumpleanos",
        icon: Gift,
      },
      {
        title: "Recomendaciones",
        url: "/recomendaciones",
        icon: Star,
      },
    ]
  },
  {
    label: "Personal",
    items: [
      {
        title: "Asistente Personal",
        url: "/personal-assistant",
        icon: Bot,
      },
      {
        title: "Módulo Espiritual",
        url: "/spiritual",
        icon: Heart,
      },
    ]
  },
  {  
  label: "Configuración",  
  items: [  
    {  
      title: "Configuración",  
      url: "/settings",  
      icon: Settings,  
    },
    {  
      title: "Administración",  
      url: "/admin",  
      icon: Settings,  
    },  
    {  
      title: "Pruebas de Notificaciones",  
      url: "/notification-testing",  
      icon: Bell,  
    },  
    {  
      title: "Acerca del Ministerio",  
      url: "/about",  
      icon: Info,  
    },  
    {  
      title: "Estatutos",  
      url: "/statutes",  
      icon: FileText,  
    },  
  ]  
}
]

export function AppSidebar() {
  const { setOpen } = useSidebar()
  const location = useLocation()
  const unreadCount = useUnreadNotifications()
  const { signOut, user, userProfile } = useAuth()
  
  const handleLinkClick = () => {
    // Close sidebar when a link is clicked (both mobile and desktop)
    setOpen(false)
  }

  return (
    <Sidebar className="border-r-0 shadow-xl" collapsible="icon">
      <SidebarContent className="bg-sidebar">
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <img 
                src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
                alt="ARCANA Logo" 
                className="w-10 h-10 object-cover rounded-2xl shadow-sm"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">{userProfile?.full_name || 'Usuario'}</p>
              <p className="text-xs text-sidebar-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation Categories */}
        {menuCategories.map((category) => (
          <SidebarGroup key={category.label} className="px-3 py-2">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-muted-foreground font-semibold mb-2">
              {category.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {category.items.map((item) => (
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
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{item.title}</span>
                        {item.title === "Notificaciones" && unreadCount > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center font-bold">
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
        ))}

        {/* Admin-only section for Scheduled Notifications */}
        {userProfile?.role === 'administrator' && (
          <SidebarGroup className="px-3 py-2 border-t border-sidebar-border">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-muted-foreground font-semibold mb-2">
              Administración Avanzada
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className="h-10 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200 data-[active=true]:bg-sidebar-primary data-[active=true]:text-sidebar-primary-foreground data-[active=true]:shadow-lg"
                    data-active={location.pathname === '/scheduled-notifications'}
                  >
                    <Link 
                      to="/scheduled-notifications" 
                      className="flex items-center gap-3 px-3"
                      onClick={handleLinkClick}
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium text-sm">Notificaciones Programadas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        
        {/* Theme Selector, Push Notifications and Logout Button */}
        <div className="mt-auto p-4 border-t border-sidebar-border space-y-2">
          <PushNotificationPermission />
          <ThemeSelector />
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar Sesión
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

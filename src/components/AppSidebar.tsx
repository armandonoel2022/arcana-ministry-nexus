
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
  const { setOpenMobile } = useSidebar()
  const location = useLocation()
  const unreadCount = useUnreadNotifications()
  const { signOut, user, userProfile } = useAuth()

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    setOpenMobile(false)
  }

  return (
    <Sidebar className="border-r-0 bg-white shadow-xl" collapsible="icon">
      <SidebarContent className="bg-white">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="w-10 h-10 bg-white rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all duration-200 hover:scale-105 group hidden md:flex shadow-md">
              <Menu className="w-6 h-6 text-blue-600 transition-transform duration-300 group-hover:rotate-90" />
            </SidebarTrigger>
            <img 
              src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
              alt="ARCANA Logo" 
              className="w-10 h-10 object-cover rounded-xl shadow-sm border border-gray-100 md:hidden"
            />
            <div>
              <h1 className="text-xl font-bold text-gray-900">ARCANA</h1>
              <p className="text-sm text-gray-500">{userProfile?.full_name?.split(' ')[0] || 'Usuario'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Categories */}
        {menuCategories.map((category) => (
          <SidebarGroup key={category.label} className="px-3 py-2">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
              {category.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {category.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      className="h-10 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 data-[active=true]:bg-blue-500 data-[active=true]:text-white data-[active=true]:shadow-lg"
                      data-active={location.pathname === item.url}
                    >
                      <Link 
                        to={item.url} 
                        className="flex items-center gap-3 px-3 relative"
                        onClick={handleLinkClick}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{item.title}</span>
                        {item.title === "Notificaciones" && unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
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
          <SidebarGroup className="px-3 py-2 border-t border-gray-200">
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-2">
              Administración Avanzada
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    className="h-10 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-all duration-200 data-[active=true]:bg-orange-500 data-[active=true]:text-white data-[active=true]:shadow-lg"
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
        <div className="mt-auto p-4 border-t border-gray-100 space-y-2">
          <PushNotificationPermission />
          <ThemeSelector />
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Cerrar Sesión
          </Button>
          {user && (
            <p className="text-xs text-gray-500 mt-2 px-3">
              {user.email}
            </p>
          )}
        </div>
      </SidebarContent>
    </Sidebar>
  )
}

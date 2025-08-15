
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
  Bot
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
        title: "Eventos Especiales",
        url: "/eventos-especiales",
        icon: Sparkles,
      },
    ]
  },
  {
    label: "Entrenamiento",
    items: [
      {
        title: "Entrenamiento Vocal",
        url: "/vocal-training",
        icon: Mic,
      },
      {
        title: "Entrenamiento Musical",
        url: "/musical-training",
        icon: Guitar,
      },
      {
        title: "Entrenamiento de Danza",
        url: "/dance-training",
        icon: Users2,
      },
      {
        title: "Recomendaciones",
        url: "/recomendaciones",
        icon: Star,
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
            <SidebarTrigger className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 group hidden md:flex">
              <Menu className="w-6 h-6 text-white transition-transform duration-300 group-hover:rotate-90" />
            </SidebarTrigger>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center md:hidden">
              <Menu className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">ARCANA</h1>
              <p className="text-sm text-gray-500">Armando</p>
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
                        className="flex items-center gap-3 px-3"
                        onClick={handleLinkClick}
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="font-medium text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}


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
  UserSwitch,
  Home
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
} from "@/components/ui/sidebar"
import { Link } from "react-router-dom"

// Menu items.
const items = [
  {
    title: "Inicio",
    url: "/",
    icon: Home,
  },
  {
    title: "Agenda Ministerial",
    url: "/agenda",
    icon: Calendar,
  },
  {
    title: "Reemplazos de Director",
    url: "/director-replacements",
    icon: UserSwitch,
  },
  {
    title: "Repertorio Musical",
    url: "/repertorio",
    icon: Music,
  },
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
    title: "Recomendaciones",
    url: "/recomendaciones",
    icon: Star,
  },
  {
    title: "Eventos Especiales",
    url: "/eventos-especiales",
    icon: Sparkles,
  },
  {
    title: "Módulo Espiritual",
    url: "/spiritual",
    icon: Heart,
  },
  {
    title: "Notificaciones",
    url: "/notificaciones",
    icon: Bell,
  },
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

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold text-purple-600">
            Ministerio Arcana
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}

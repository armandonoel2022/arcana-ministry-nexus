
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Bot
} from "lucide-react";

const Index = () => {
  const [selectedModule, setSelectedModule] = useState<string | null>(null);

  const modules = [
    {
      id: "agenda",
      title: "Agenda Ministerial",
      description: "Turnos de alabanza y notificaciones automáticas",
      icon: Calendar,
      color: "bg-arcana-blue-gradient",
      comingSoon: true
    },
    {
      id: "repertorio", 
      title: "Repertorio Musical",
      description: "Catálogo de canciones y sistema de semáforo",
      icon: Music,
      color: "bg-arcana-gold-gradient",
      comingSoon: true
    },
    {
      id: "musicos",
      title: "Gestión de Músicos",
      description: "Rotación automática y solicitudes de cambio",
      icon: Users,
      color: "bg-arcana-blue-gradient",
      comingSoon: true
    },
    {
      id: "comunicacion",
      title: "Comunicación",
      description: "Chats grupales y walkie-talkie",
      icon: MessageCircle,
      color: "bg-arcana-gold-gradient",
      comingSoon: true
    },
    {
      id: "perfiles",
      title: "Perfiles de Usuarios",
      description: "Datos personales y roles del ministerio",
      icon: Mic,
      color: "bg-arcana-blue-gradient",
      comingSoon: true
    },
    {
      id: "espiritual",
      title: "Módulo Espiritual",
      description: "Versículo diario e historia del ministerio",
      icon: BookOpen,
      color: "bg-arcana-gold-gradient",
      comingSoon: true
    },
    {
      id: "eventos",
      title: "Eventos Especiales",
      description: "Cumpleaños y actividades recreativas",
      icon: Heart,
      color: "bg-arcana-blue-gradient",
      comingSoon: true
    },
    {
      id: "inventario",
      title: "Inventario QR",
      description: "Registro de equipos e instrumentos",
      icon: Scan,
      color: "bg-arcana-gold-gradient",
      comingSoon: true
    },
    {
      id: "donaciones",
      title: "Donaciones",
      description: "Registro de ofrendas y reportes",
      icon: Gift,
      color: "bg-arcana-blue-gradient",
      comingSoon: true
    },
    {
      id: "cuidado",
      title: "Recomendaciones",
      description: "Ejercicios diarios personalizados",
      icon: Settings,
      color: "bg-arcana-gold-gradient",
      comingSoon: true
    },
    {
      id: "chatbot",
      title: "ARCANA Asistente",
      description: "Chatbot AI para consultas rápidas",
      icon: Bot,
      color: "bg-arcana-blue-gradient",
      comingSoon: true
    },
    {
      id: "notificaciones",
      title: "Centro de Notificaciones",
      description: "Gestión centralizada de alertas",
      icon: Bell,
      color: "bg-arcana-gold-gradient",
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50">
      {/* Header con logo y bienvenida */}
      <div className="bg-arcana-gradient text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-float">
              <Mic className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            ARCANA
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-2 animate-slide-up">
            Ministerio ADN Arca de Noé
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto animate-slide-up">
            Tu plataforma integral para la gestión del ministerio de alabanza
          </p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Bienvenida personalizada */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-scale-in">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-800">
              ¡Bienvenido al Ministerio!
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Gestiona tu participación en el ministerio de alabanza de forma integral
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="bg-arcana-gradient hover:opacity-90 text-white px-8 py-3 text-lg rounded-full shadow-lg transition-all duration-300 hover:scale-105">
              Comenzar
            </Button>
          </CardContent>
        </Card>

        {/* Módulos principales */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Módulos del Sistema
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module, index) => {
              const IconComponent = module.icon;
              return (
                <Card 
                  key={module.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setSelectedModule(module.id)}
                >
                  <CardHeader className="text-center pb-3">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${module.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <CardTitle className="text-lg text-gray-800">
                        {module.title}
                      </CardTitle>
                      {module.comingSoon && (
                        <Badge variant="secondary" className="text-xs bg-arcana-gold-gradient text-white border-0">
                          Próximamente
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-sm text-gray-600 leading-relaxed">
                      {module.description}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Información del ministerio */}
        <Card className="bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-sm border-0 shadow-lg animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-xl text-gray-800 mb-4">
              Acerca del Ministerio ADN Arca de Noé
            </CardTitle>
            <CardDescription className="text-gray-700 leading-relaxed max-w-3xl mx-auto">
              Somos un ministerio dedicado a la alabanza y adoración, comprometidos con la excelencia 
              en el servicio a Dios. ARCANA es nuestra herramienta para coordinar eficientemente 
              todos los aspectos de nuestro ministerio, desde la programación de servicios hasta 
              la gestión de inventarios y la comunicación entre hermanos.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-arcana-blue-600" />
                <span>Gestión de Equipos</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-arcana-blue-600" />
                <span>Programación Inteligente</span>
              </div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-arcana-blue-600" />
                <span>Repertorio Organizado</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-arcana-blue-600" />
                <span>Comunidad Unida</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-12">
        <div className="max-w-6xl mx-auto text-center px-4">
          <p className="text-gray-300">
            © 2024 ARCANA - Ministerio ADN Arca de Noé. Desarrollado con amor para la gloria de Dios.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

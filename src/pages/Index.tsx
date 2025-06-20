
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Music, 
  Users, 
  MessageCircle,
  Mic,
  Heart
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const mainModules = [
    {
      id: "agenda",
      title: "Agenda Ministerial", 
      description: "Gestiona los turnos de alabanza y recibe notificaciones automáticas para cada servicio",
      icon: Calendar,
      color: "bg-arcana-blue-gradient",
      comingSoon: false,
      features: ["Programación automática", "Notificaciones", "Rotación de grupos"],
      url: "/agenda"
    },
    {
      id: "repertorio", 
      title: "Repertorio Musical",
      description: "Catálogo completo de canciones con sistema de semáforo para conocimiento",
      icon: Music,
      color: "bg-arcana-gold-gradient",
      comingSoon: false,
      features: ["Catálogo de canciones", "Sistema de semáforo", "Letras y acordes"],
      url: "/repertorio"
    },
    {
      id: "integrantes",
      title: "Integrantes",
      description: "Gestión de miembros y roles del ministerio de alabanza",
      icon: Users,
      color: "bg-arcana-blue-gradient",
      comingSoon: false,
      features: ["Gestión de miembros", "Perfiles detallados", "Roles y grupos"],
      url: "/integrantes"
    },
    {
      id: "comunicacion",
      title: "Comunicación",
      description: "Mantén contacto con el equipo a través de chats grupales y walkie-talkie",
      icon: MessageCircle,
      color: "bg-arcana-gold-gradient",
      comingSoon: true,
      features: ["Chat grupal", "Walkie-talkie", "Mensajes directos"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50">
      {/* Header */}
      <div className="bg-arcana-gradient text-white py-12 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm animate-float">
              <Mic className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-fade-in">
            ARCANA
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-2 animate-slide-up">
            Tu plataforma integral para el ministerio de alabanza
          </p>
          <p className="text-lg text-white/80 max-w-2xl mx-auto animate-slide-up">
            Gestiona de forma eficiente todos los aspectos del Ministerio ADN Arca de Noé
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-8 px-6">
        {/* Quick Actions */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm animate-scale-in">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-gray-800">
              Acciones Rápidas
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Comienza a gestionar tu participación en el ministerio
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap justify-center gap-4">
            <Link to="/agenda?filter=my_agenda">
              <Button className="bg-arcana-blue-gradient hover:opacity-90 text-white px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105">
                Ver Mi Agenda
              </Button>
            </Link>
            <Link to="/repertorio">
              <Button variant="outline" className="border-arcana-blue-600 text-arcana-blue-600 hover:bg-arcana-blue-50 px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105">
                Explorar Repertorio
              </Button>
            </Link>
            <Link to="/integrantes">
              <Button variant="outline" className="border-arcana-gold-600 text-arcana-gold-600 hover:bg-arcana-gold-50 px-6 py-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105">
                Ver Integrantes
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Main Modules */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Funcionalidades Principales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mainModules.map((module, index) => {
              const IconComponent = module.icon;
              const ModuleContent = (
                <Card 
                  key={module.id}
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:scale-105 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-full ${module.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg flex-shrink-0`}>
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg text-gray-800">
                            {module.title}
                          </CardTitle>
                          {module.comingSoon && (
                            <Badge variant="secondary" className="text-xs bg-arcana-gold-gradient text-white border-0">
                              Próximamente
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm text-gray-600 leading-relaxed mb-3">
                          {module.description}
                        </CardDescription>
                        <div className="flex flex-wrap gap-1">
                          {module.features.map((feature, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              );

              return module.url && !module.comingSoon ? (
                <Link key={module.id} to={module.url}>
                  {ModuleContent}
                </Link>
              ) : (
                ModuleContent
              );
            })}
          </div>
        </div>

        {/* Ministry Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center animate-fade-in">
            <CardHeader>
              <div className="w-12 h-12 bg-arcana-blue-gradient rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl text-arcana-blue-600">3</CardTitle>
              <CardDescription>Miembros Activos</CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg text-center animate-fade-in animation-delay-200">
            <CardHeader>
              <div className="w-12 h-12 bg-arcana-gold-gradient rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <CardTitle className="text-2xl text-arcana-gold-600">3</CardTitle>
              <CardDescription>Grupos de Alabanza</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Information Card */}
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
        </Card>
      </div>
    </div>
  );
};

export default Index;

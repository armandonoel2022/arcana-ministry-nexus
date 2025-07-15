
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Music, 
  Users, 
  MessageCircle,
  Mic,
  Heart,
  CheckCircle,
  TrendingUp,
  Star,
  Bell
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const mainServices = [
    {
      id: "agenda",
      title: "Agenda Ministerial", 
      description: "Servicios y eventos",
      icon: Calendar,
      url: "/agenda",
      gradient: "service-card-blue"
    },
    {
      id: "repertorio", 
      title: "Repertorio Musical",
      description: "Catálogo de canciones",
      icon: Music,
      url: "/repertorio",
      gradient: "service-card-blue-light"
    },
    {
      id: "integrantes",
      title: "Integrantes",
      description: "Miembros del ministerio",
      icon: Users,
      url: "/integrantes",
      gradient: "service-card-blue-dark"
    },
    {
      id: "comunicacion",
      title: "Comunicación",
      description: "Chat del equipo",
      icon: MessageCircle,
      url: "/communication",
      gradient: "service-card-blue"
    }
  ];

  return (
    <div className="min-h-screen ciudadconecta-gradient">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Welcome */}
        <div className="ciudadconecta-glass rounded-2xl p-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl">
              <Heart className="w-10 h-10 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              ARCANA
          </h1>
          <p className="text-white text-xl mb-6 drop-shadow-md">
            Tu plataforma integral para una iglesia mejor. Organiza, consulta y participa.
          </p>
          
          {/* Personal Greeting */}
          <div className="ciudadconecta-glass rounded-2xl p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-white mb-2 drop-shadow-md">¡Hola, Armando!</h2>
            <p className="text-white/90 mb-4 drop-shadow-sm">
              Tienes gestiones pendientes de seguimiento
            </p>
            <div className="text-sm text-white/80 drop-shadow-sm">
              (3 servicios) • (2 notificaciones pendientes)
            </div>
            <Link to="/admin">
              <Button className="mt-4 bg-white text-blue-600 hover:bg-gray-100 rounded-xl px-6 font-semibold shadow-lg">
                GESTIONAR MINISTERIO (2)
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Services */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6 text-center drop-shadow-md">
            SERVICIOS PRINCIPALES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Link key={service.id} to={service.url}>
                  <Card 
                    className={`${service.gradient} ciudadconecta-card cursor-pointer hover:scale-105 transition-all duration-300`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white">{service.title}</h3>
                        </div>
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                          <span className="text-white">•</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/integrantes">
            <Card className="bg-white ciudadconecta-card text-center hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">18</h3>
                <p className="text-gray-600">Integrantes Activos</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/agenda">
            <Card className="bg-white ciudadconecta-card text-center hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">5</h3>
                <p className="text-gray-600">Servicios este mes</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/repertorio">
            <Card className="bg-white ciudadconecta-card text-center hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Music className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">48</h3>
                <p className="text-gray-600">Canciones en repertorio</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

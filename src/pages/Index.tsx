
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      <div className="container mx-auto p-8 max-w-5xl">
        {/* Header with Personality */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-8 mb-8 shadow-xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-400/20 rounded-full translate-y-24 -translate-x-24"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center border border-white/30">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">ARCANA</h1>
                <p className="text-blue-100 text-lg">Ministerio ADN</p>
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-semibold mb-3">¡Hola, Armando!</h2>
              <p className="text-blue-100 mb-6 text-lg">
                Gestiona de forma eficiente todos los aspectos del Ministerio ADN Arca de Noé
              </p>
              <div className="flex flex-wrap gap-3">
                <Button className="bg-white text-blue-600 hover:bg-blue-50 rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all">
                  Ver Mi Agenda
                </Button>
                <Button className="bg-white/20 text-white border border-white/30 hover:bg-white/30 rounded-xl px-6 py-3 backdrop-blur">
                  Explorar Repertorio
                </Button>
                <Button className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900 hover:from-yellow-500 hover:to-yellow-600 rounded-xl px-6 py-3 font-semibold shadow-lg">
                  Chat Grupal
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Services with Character */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Funcionalidades Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon;
              const isBlue = index % 2 === 0;
              return (
                <Link key={service.id} to={service.url}>
                  <Card className="bg-white hover:shadow-2xl transition-all duration-300 border-0 shadow-lg group cursor-pointer hover:-translate-y-2 overflow-hidden">
                    <div className={`h-2 ${isBlue ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-yellow-400 to-yellow-500'}`}></div>
                    <CardContent className="p-8">
                      <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
                          isBlue ? 'bg-gradient-to-br from-blue-500 to-blue-600' : 'bg-gradient-to-br from-yellow-400 to-yellow-500'
                        }`}>
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                            {service.title}
                          </h3>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                          <span className="text-gray-400 group-hover:text-blue-500">→</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Clean Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/integrantes">
            <Card className="bg-white hover:shadow-md transition-all duration-200 border border-gray-100 text-center cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">3</h3>
                <p className="text-gray-600 text-sm">Miembros Activos</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/agenda">
            <Card className="bg-white hover:shadow-md transition-all duration-200 border border-gray-100 text-center cursor-pointer group">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-1">3</h3>
                <p className="text-gray-600 text-sm">Grupos de Alabanza</p>
              </CardContent>
            </Card>
          </Link>

          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Acerca del Ministerio ADN Arca de Noé
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Somos un ministerio dedicado a la alabanza y adoración, comprometidos con la excelencia en el 
              servicio a Dios. ARCANA es nuestra herramienta para coordinar eficientemente todos los aspectos 
              de nuestro ministerio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;


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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-8 max-w-4xl">
        {/* Clean Header */}
        <div className="bg-white rounded-xl p-8 mb-8 shadow-sm border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ARCANA</h1>
              <p className="text-gray-600">Ministerio ADN</p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">¡Hola, Armando!</h2>
            <p className="text-gray-600 mb-4">
              Gestiona de forma eficiente todos los aspectos del Ministerio ADN Arca de Noé
            </p>
            <div className="flex gap-3">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6">
                Ver Mi Agenda
              </Button>
              <Button variant="outline" className="rounded-lg px-6">
                Explorar Repertorio
              </Button>
              <Button variant="outline" className="rounded-lg px-6 text-yellow-600 border-yellow-600 hover:bg-yellow-50">
                Chat Grupal
              </Button>
            </div>
          </div>
        </div>

        {/* Main Services - Clean Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Funcionalidades Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Link key={service.id} to={service.url}>
                  <Card className="bg-white hover:shadow-md transition-all duration-200 border border-gray-100 group cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          index % 2 === 0 ? 'bg-blue-600' : 'bg-yellow-500'
                        }`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {service.title}
                          </h3>
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


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Music, 
  Users, 
  MessageCircle,
  UserCheck,
  Heart
} from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  const mainServices = [
    {
      id: "agenda",
      title: "Agenda Ministerial",
      description: "Gestiona los servicios y eventos ministeriales",
      icon: Calendar,
      url: "/agenda"
    },
    {
      id: "repertorio", 
      title: "Repertorio Musical",
      description: "Explora y gestiona el catálogo de canciones",
      icon: Music,
      url: "/repertorio"
    },
    {
      id: "comunicacion",
      title: "Comunicación",
      description: "Conecta con los miembros del ministerio",
      icon: MessageCircle,
      url: "/communication"
    },
    {
      id: "integrantes",
      title: "Integrantes",
      description: "Administra los miembros del ministerio",
      icon: Users,
      url: "/integrantes"
    },
    {
      id: "director-replacements",
      title: "Reemplazos de Director",
      description: "Gestiona las solicitudes de reemplazo",
      icon: UserCheck,
      url: "/director-replacements"
    },
    {
      id: "spiritual",
      title: "Módulo Espiritual",
      description: "Accede a recursos espirituales diarios",
      icon: Heart,
      url: "/spiritual"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-primary/5 to-background">
      {/* Main Hero Section */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <div className="max-w-4xl mx-auto px-8 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            ARCANA
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Tu plataforma integral para el ministerio de alabanza.<br />
            Gestiona, coordina y participa.
          </p>
          
          {/* Welcome Message */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 animate-fade-in">
            <h2 className="text-2xl font-semibold mb-2">¡Bienvenido al Ministerio!</h2>
            <p className="text-lg opacity-90 mb-4">
              Descubre cómo usar ARCANA paso a paso
            </p>
            <p className="text-sm opacity-75">
              Servicios activos • Miembros conectados
            </p>
          </div>

          {/* CTA Button */}
          <Link to="/about">
            <Button 
              size="lg" 
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300 hover:scale-105"
            >
              CONOCE LA PLATAFORMA
            </Button>
          </Link>
        </div>
      </div>

      {/* Services Section */}
      <div className="max-w-6xl mx-auto px-8 py-16">
        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
            SERVICIOS PRINCIPALES
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon;
              return (
                <Link key={service.id} to={service.url}>
                  <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:scale-105 animate-fade-in">
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                        <IconComponent className="w-8 h-8 text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3 text-foreground">
                        {service.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {service.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

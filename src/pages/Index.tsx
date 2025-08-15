
import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [memberCount, setMemberCount] = useState<number>(0);
  const [groupCount, setGroupCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener conteo de miembros activos
        const { count: membersCount, error: membersError } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (membersError) {
          console.error('Error fetching members count:', membersError);
        } else {
          setMemberCount(membersCount || 0);
        }

        // Obtener conteo de grupos de alabanza activos
        const { count: groupsCount, error: groupsError } = await supabase
          .from('worship_groups')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        if (groupsError) {
          console.error('Error fetching groups count:', groupsError);
        } else {
          setGroupCount(groupsCount || 0);
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen modern-gradient">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with Personality - Centered */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="modern-card p-8 relative overflow-hidden mx-auto max-w-4xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-modern-blue-100/10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-8 mb-8">
                {/* Logo Container */}
                <div className="w-24 h-24 modern-glass rounded-full flex items-center justify-center border border-white/30 overflow-hidden hover-scale">
                  {/* Placeholder for ministry logo - user can upload their logo here */}
                  <div className="w-full h-full bg-white/10 rounded-full flex items-center justify-center">
                    <Heart className="w-12 h-12 text-white/70" />
                  </div>
                </div>
                
                {/* ARCANA Title - Made Larger */}
                <div>
                  <h1 className="text-6xl font-bold modern-gradient-text tracking-wide">ARCANA</h1>
                </div>
              </div>
              
              <div className="modern-glass rounded-2xl p-6 border border-white/20">
                <h2 className="text-2xl font-semibold mb-3 text-white">¡Hola, Armando!</h2>
                <p className="text-modern-blue-100 mb-6 text-lg">
                  Gestiona de forma eficiente todos los aspectos del Ministerio ADN Arca de Noé
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <Link to="/agenda">
                    <Button className="modern-button rounded-2xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all">
                      Ver Mi Agenda
                    </Button>
                  </Link>
                  <Link to="/repertorio">
                    <Button className="modern-button-outline rounded-2xl px-6 py-3 backdrop-blur">
                      Explorar Repertorio
                    </Button>
                  </Link>
                  <Link to="/communication">
                    <Button className="bg-gradient-to-r from-accent to-accent/80 text-accent-foreground hover:from-accent/90 hover:to-accent/70 rounded-2xl px-6 py-3 font-semibold shadow-lg">
                      Chat Grupal
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Services with Character - Oval Cards */}
        <div className="mb-12 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center animate-fade-in">Funcionalidades Principales</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon;
              const isBlue = index % 2 === 0;
              return (
                <Link key={service.id} to={service.url}>
                  <div className="modern-glass hover:shadow-2xl transition-all duration-500 group cursor-pointer hover:-translate-y-3 overflow-hidden rounded-[2.5rem] relative animate-fade-in hover-scale">
                    <div className={`absolute inset-0 opacity-10 ${isBlue ? 'bg-gradient-to-br from-modern-blue-500 to-modern-blue-600' : 'bg-gradient-to-br from-accent to-accent/80'}`}></div>
                    <div className="p-8 relative z-10">
                      <div className="flex items-center gap-6">
                        <div className={`modern-circle w-20 h-20 flex items-center justify-center shadow-xl transition-all duration-300 group-hover:scale-110 ${
                          isBlue ? 'bg-gradient-to-br from-modern-blue-500 to-modern-blue-600' : 'bg-gradient-to-br from-accent to-accent/80'
                        }`}>
                          <IconComponent className="w-10 h-10 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-modern-blue-600 transition-colors mb-2">
                            {service.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">{service.description}</p>
                        </div>
                        <div className="modern-circle w-10 h-10 bg-secondary flex items-center justify-center group-hover:bg-modern-blue-100 transition-all duration-300 group-hover:scale-110">
                          <span className="text-muted-foreground group-hover:text-modern-blue-500 text-lg">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Clean Statistics - Oval Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link to="/integrantes">
            <div className="modern-glass hover:shadow-xl transition-all duration-300 text-center cursor-pointer group rounded-[2rem] p-8 hover:-translate-y-2 animate-fade-in hover-scale">
              <div className="w-16 h-16 bg-gradient-to-br from-modern-blue-500 to-modern-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {loading ? "..." : memberCount}
              </h3>
              <p className="text-muted-foreground">Miembros Activos</p>
            </div>
          </Link>

          <Link to="/worship-groups">
            <div className="modern-glass hover:shadow-xl transition-all duration-300 text-center cursor-pointer group rounded-[2rem] p-8 hover:-translate-y-2 animate-fade-in hover-scale">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-300 shadow-lg">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {loading ? "..." : groupCount}
              </h3>
              <p className="text-muted-foreground">Grupos de Alabanza</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

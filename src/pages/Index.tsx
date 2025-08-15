
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/10 to-accent/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section - Modern Clean Design */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-sm rounded-[3rem] p-12 shadow-xl border border-white/40 mx-auto max-w-4xl relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent/5 rounded-full translate-y-16 -translate-x-16"></div>
            
            <div className="relative z-10">
              {/* Logo and Title */}
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-lg">
                  <Heart className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  ARCANA
                </h1>
              </div>
              
              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-[2rem] p-8 mb-8">
                <h2 className="text-2xl font-semibold mb-3 text-foreground">¡Hola, Armando!</h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Gestiona de forma eficiente todos los aspectos del Ministerio ADN Arca de Noé
                </p>
                
                {/* Quick Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/agenda">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      Ver Mi Agenda
                    </Button>
                  </Link>
                  <Link to="/repertorio">
                    <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white rounded-full px-8 py-3 text-base font-medium transition-all duration-300 hover:scale-105">
                      Explorar Repertorio
                    </Button>
                  </Link>
                  <Link to="/communication">
                    <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-8 py-3 text-base font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                      Chat Grupal
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved Divider Section */}
        <div className="relative mb-16">
          <svg 
            className="w-full h-24 text-white/90" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,60 C300,120 900,0 1200,60 L1200,120 L0,120 Z" 
              fill="currentColor"
            />
          </svg>
        </div>

        {/* Main Services Section */}
        <div className="mb-16">
          <div className="bg-white/95 backdrop-blur-sm rounded-[3rem] p-8 shadow-xl border border-white/40">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">
              Funcionalidades Principales
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {mainServices.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <Link key={service.id} to={service.url}>
                    <div className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group cursor-pointer hover:-translate-y-2">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-muted-foreground text-sm">{service.description}</p>
                        </div>
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-primary/10 transition-all duration-300">
                          <span className="text-muted-foreground group-hover:text-primary text-lg font-bold">→</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <Link to="/integrantes">
            <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] p-8 text-center shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {loading ? "..." : memberCount}
              </h3>
              <p className="text-muted-foreground font-medium">Miembros Activos</p>
            </div>
          </Link>

          <Link to="/worship-groups">
            <div className="bg-white/95 backdrop-blur-sm rounded-[2rem] p-8 text-center shadow-lg border border-white/40 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-accent to-accent/80 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">
                {loading ? "..." : groupCount}
              </h3>
              <p className="text-muted-foreground font-medium">Grupos de Alabanza</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

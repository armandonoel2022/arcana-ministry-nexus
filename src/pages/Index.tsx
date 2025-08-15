
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse animation-delay-300"></div>
      <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-cyan-400/10 rounded-full blur-2xl animate-pulse animation-delay-200"></div>
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        {/* Hero Section - Bold and Dynamic */}
        <div className="text-center mb-20 animate-fade-in">
          <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] p-12 shadow-2xl border border-white/20 mx-auto max-w-4xl relative overflow-hidden">
            {/* Floating Elements Inside Card */}
            <div className="absolute top-4 right-8 w-16 h-16 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-2xl opacity-30 rotate-12"></div>
            <div className="absolute bottom-6 left-6 w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-xl opacity-40 -rotate-12"></div>
            
            <div className="relative z-10">
              {/* Logo and Title - More Dynamic */}
              <div className="flex items-center justify-center gap-8 mb-10">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-cyan-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl transform rotate-6 hover:rotate-12 transition-transform duration-500">
                    <Heart className="w-12 h-12 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full animate-bounce"></div>
                </div>
                <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-blue-300 via-cyan-300 to-blue-200 bg-clip-text text-transparent drop-shadow-lg">
                  ARCANA
                </h1>
              </div>
              
              {/* Welcome Message - More Vibrant */}
              <div className="bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-xl rounded-[2.5rem] p-8 mb-8 border border-white/30">
                <h2 className="text-3xl font-bold mb-4 text-white">¡Hola, Armando! 👋</h2>
                <p className="text-blue-100 text-lg mb-8 leading-relaxed">
                  Gestiona de forma eficiente todos los aspectos del <span className="text-cyan-300 font-semibold">Ministerio ADN Arca de Noé</span>
                </p>
                
                {/* Dynamic Action Buttons */}
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/agenda">
                    <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-full px-10 py-4 text-lg font-bold shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 hover:scale-110 transform">
                      ⚡ Ver Mi Agenda
                    </Button>
                  </Link>
                  <Link to="/repertorio">
                    <Button className="bg-white/20 backdrop-blur-sm border-2 border-white/40 text-white hover:bg-white/30 rounded-full px-10 py-4 text-lg font-bold transition-all duration-300 hover:scale-110">
                      🎵 Explorar Repertorio
                    </Button>
                  </Link>
                  <Link to="/communication">
                    <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full px-10 py-4 text-lg font-bold shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-110">
                      💬 Chat Grupal
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Wave Divider */}
        <div className="relative mb-20">
          <svg 
            className="w-full h-32 text-blue-400/30" 
            viewBox="0 0 1200 120" 
            preserveAspectRatio="none"
          >
            <path 
              d="M0,60 C300,120 900,0 1200,60 C1200,80 900,140 600,80 C300,20 0,100 0,60 Z" 
              fill="currentColor"
              className="animate-pulse"
            />
          </svg>
        </div>

        {/* Main Services - More Dynamic Layout */}
        <div className="mb-20">
          <h2 className="text-4xl font-black text-center text-white mb-16 drop-shadow-lg">
            🚀 Funcionalidades <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">Principales</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon;
              const gradients = [
                'from-blue-500 to-cyan-500',
                'from-purple-500 to-pink-500',
                'from-cyan-500 to-blue-500',
                'from-indigo-500 to-purple-500'
              ];
              const currentGradient = gradients[index % gradients.length];
              
              return (
                <Link key={service.id} to={service.url}>
                  <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-500 group cursor-pointer hover:-translate-y-4 hover:scale-105 relative overflow-hidden">
                    {/* Floating Background Effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${currentGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>
                    <div className="absolute top-4 right-4 w-20 h-20 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all duration-500"></div>
                    
                    <div className="relative z-10 flex items-center gap-6">
                      <div className={`w-20 h-20 bg-gradient-to-br ${currentGradient} rounded-3xl flex items-center justify-center shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500`}>
                        <IconComponent className="w-10 h-10 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors duration-300">
                          {service.title}
                        </h3>
                        <p className="text-blue-200 text-base">{service.description}</p>
                      </div>
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
                        <span className="text-white text-2xl font-bold">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Statistics - Floating Cards Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <Link to="/integrantes">
            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-2xl rounded-[2.5rem] p-10 text-center shadow-2xl border border-blue-400/30 hover:shadow-blue-500/25 transition-all duration-500 cursor-pointer group hover:-translate-y-4 hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl group-hover:bg-blue-400/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-2xl">
                  <Users className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-4xl font-black text-white mb-3">
                  {loading ? "⏳" : memberCount}
                </h3>
                <p className="text-blue-200 font-semibold text-lg">👥 Miembros Activos</p>
              </div>
            </div>
          </Link>

          <Link to="/worship-groups">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-2xl rounded-[2.5rem] p-10 text-center shadow-2xl border border-purple-400/30 hover:shadow-purple-500/25 transition-all duration-500 cursor-pointer group hover:-translate-y-4 hover:scale-105 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-2xl group-hover:bg-purple-400/20 transition-all duration-500"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-2xl">
                  <Calendar className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-4xl font-black text-white mb-3">
                  {loading ? "⏳" : groupCount}
                </h3>
                <p className="text-purple-200 font-semibold text-lg">🎵 Grupos de Alabanza</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

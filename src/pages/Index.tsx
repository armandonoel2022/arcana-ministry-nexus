
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
import BirthdayNotificationBanner from "@/components/notifications/BirthdayNotificationBanner";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { userProfile } = useAuth();
  const [memberCount, setMemberCount] = useState<number>(0);
  const [groupCount, setGroupCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [birthdayNotification, setBirthdayNotification] = useState<any>(null);
  
  // Get first name from full name
  const firstName = userProfile?.full_name?.split(' ')[0] || 'Usuario';

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

        // Buscar notificaciones de cumpleaños activas para mostrar en pantalla principal
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: notifications, error: notifError } = await supabase
            .from('system_notifications')
            .select('*')
            .eq('recipient_id', user.id)
            .eq('type', 'birthday')
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(1);

          if (!notifError && notifications && notifications.length > 0) {
            setBirthdayNotification(notifications[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const dismissBirthdayNotification = async () => {
    if (birthdayNotification) {
      // Marcar notificación como leída
      await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', birthdayNotification.id);
      
      setBirthdayNotification(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-600 via-blue-500 to-blue-400">
      <div className="w-full py-6 sm:py-8 md:py-12 max-w-6xl mx-auto md:container px-0">
        
        {/* Birthday Notification Banner */}
        {birthdayNotification && (
          <div className="mb-4 sm:mb-6 md:mb-8">
            <BirthdayNotificationBanner
              notification={birthdayNotification}
              onDismiss={dismissBirthdayNotification}
            />
          </div>
        )}
        {/* Hero Section - Clean and Institutional */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 px-3 sm:px-4 md:px-6">
          <div className="mb-6 sm:mb-8 md:mb-12">
            {/* Logo */}
            <div className="flex items-center justify-center mb-4 sm:mb-6 md:mb-8">
              <img 
                src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
                alt="ARCANA Logo" 
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 object-cover rounded-2xl sm:rounded-3xl shadow-xl border-2 sm:border-4 border-white/20"
              />
            </div>
            
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-2 sm:mb-3 md:mb-4 px-2">
              ARCANA
            </h1>
            <p className="text-blue-100 text-sm sm:text-base md:text-lg mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto px-4">
              Transformando nuestra adoración
            </p>
            
            {/* Welcome Message */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto border border-white/20">
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-1 sm:mb-2 text-white">¡Hola, {firstName}!</h2>
              <p className="text-blue-100 text-xs sm:text-sm md:text-base">Tu participación hace la diferencia</p>
              
              <Link to="/agenda">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 sm:px-8 md:px-12 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base md:text-lg font-medium mt-3 sm:mt-4 md:mt-6 transition-all duration-300">
                  COMENZAR
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-xl mx-3 sm:mx-4 md:mx-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-4 sm:mb-6 md:mb-8 px-2">
            SERVICIOS PRINCIPALES
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 max-w-4xl mx-auto">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon;
              const colors = [
                'bg-gradient-to-r from-blue-500 to-blue-600',
                'bg-gradient-to-r from-blue-600 to-blue-700', 
                'bg-gradient-to-r from-blue-400 to-blue-500',
                'bg-gradient-to-r from-blue-500 to-blue-600',
                'bg-gradient-to-r from-blue-700 to-blue-800'
              ];
              const currentColor = colors[index % colors.length];
              
              return (
                <Link key={service.id} to={service.url}>
                  <div className={`${currentColor} rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 text-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg`}>
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold mb-0.5 sm:mb-1 truncate">
                          {service.title}
                        </h3>
                        <p className="text-white/80 text-xs sm:text-sm line-clamp-1">{service.description}</p>
                      </div>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-base sm:text-lg">•</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto mt-6 sm:mt-8 px-3 sm:px-4 md:px-6">
          <Link to="/integrantes">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center text-white hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                {loading ? "..." : memberCount}
              </h3>
              <p className="text-blue-100 text-sm sm:text-base">Miembros Activos</p>
            </div>
          </Link>

          <Link to="/worship-groups">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center text-white hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                {loading ? "..." : groupCount}
              </h3>
              <p className="text-blue-100 text-sm sm:text-base">Grupos de Alabanza</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;

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
import { BiometricSetup } from "@/components/BiometricSetup";

const Index = () => {
  const [memberCount, setMemberCount] = useState<number>(0);
  const [groupCount, setGroupCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [birthdayNotification, setBirthdayNotification] = useState<any>(null);

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
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-blue-400">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        
        {/* Birthday Notification Banner */}
        {birthdayNotification && (
          <div className="mb-8">
            <BirthdayNotificationBanner
              notification={birthdayNotification}
              onDismiss={dismissBirthdayNotification}
            />
          </div>
        )}
        {/* Hero Section - Clean and Institutional */}
        <div className="text-center mb-16">
          <div className="mb-12">
            {/* Logo */}
            <div className="flex items-center justify-center mb-8">
              <img 
                src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
                alt="ARCANA Logo" 
                className="w-28 h-28 object-cover rounded-3xl shadow-xl border-4 border-white/20"
              />
            </div>
            
            {/* Title */}
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              ARCANA
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
              Transformando nuestra adoración
            </p>
            
            {/* Welcome Message */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 mb-8 max-w-2xl mx-auto border border-white/20">
              <h2 className="text-2xl font-semibold mb-2 text-white">¡Hola, Armando!</h2>
              <p className="text-blue-100">Tu participación hace la diferencia</p>
              
              <Link to="/agenda">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-12 py-3 text-lg font-medium mt-6 transition-all duration-300">
                  COMENZAR
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-8">
            SERVICIOS PRINCIPALES
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon;
              const colors = [
                'bg-gradient-to-r from-blue-500 to-blue-600',
                'bg-gradient-to-r from-blue-600 to-blue-700', 
                'bg-gradient-to-r from-blue-400 to-blue-500',
                'bg-gradient-to-r from-blue-700 to-blue-800'
              ];
              const currentColor = colors[index % colors.length];
              
              return (
                <Link key={service.id} to={service.url}>
                  <div className={`${currentColor} rounded-2xl p-6 text-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg`}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">
                          {service.title}
                        </h3>
                        <p className="text-white/80 text-sm">{service.description}</p>
                      </div>
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-white text-lg">•</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Biometric Setup Section */}
        <div className="max-w-2xl mx-auto mt-8">
          <BiometricSetup />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mt-8">
          <Link to="/integrantes">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2">
                {loading ? "..." : memberCount}
              </h3>
              <p className="text-blue-100">Miembros Activos</p>
            </div>
          </Link>

          <Link to="/worship-groups">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center text-white hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Music className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold mb-2">
                {loading ? "..." : groupCount}
              </h3>
              <p className="text-blue-100">Grupos de Alabanza</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
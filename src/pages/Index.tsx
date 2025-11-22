import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Music, Users, MessageCircle, Mic, Heart, CheckCircle, TrendingUp, Star, Bell } from "lucide-react";
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
  const firstName = userProfile?.full_name?.split(" ")[0] || "Usuario";

  const mainServices = [
    {
      id: "agenda",
      title: "Agenda Ministerial",
      description: "Servicios y eventos",
      icon: Calendar,
      url: "/agenda",
      gradient: "service-card-blue",
    },
    {
      id: "repertorio",
      title: "Repertorio Musical",
      description: "Catálogo de canciones",
      icon: Music,
      url: "/repertorio",
      gradient: "service-card-blue-light",
    },
    {
      id: "integrantes",
      title: "Integrantes",
      description: "Miembros del ministerio",
      icon: Users,
      url: "/integrantes",
      gradient: "service-card-blue-dark",
    },
    {
      id: "comunicacion",
      title: "Comunicación",
      description: "Chat del equipo",
      icon: MessageCircle,
      url: "/communication",
      gradient: "service-card-blue",
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Obtener conteo de miembros activos
        const { count: membersCount, error: membersError } = await supabase
          .from("members")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        if (membersError) {
          console.error("Error fetching members count:", membersError);
        } else {
          setMemberCount(membersCount || 0);
        }

        // Obtener conteo de grupos de alabanza activos
        const { count: groupsCount, error: groupsError } = await supabase
          .from("worship_groups")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        if (groupsError) {
          console.error("Error fetching groups count:", groupsError);
        } else {
          setGroupCount(groupsCount || 0);
        }

        // Buscar notificaciones de cumpleaños activas para mostrar en pantalla principal
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: notifications, error: notifError } = await supabase
            .from("system_notifications")
            .select("*")
            .eq("recipient_id", user.id)
            .eq("type", "birthday")
            .eq("is_read", false)
            .order("created_at", { ascending: false })
            .limit(1);

          if (!notifError && notifications && notifications.length > 0) {
            setBirthdayNotification(notifications[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const dismissBirthdayNotification = async () => {
    if (birthdayNotification) {
      // Marcar notificación como leída
      await supabase.from("system_notifications").update({ is_read: true }).eq("id", birthdayNotification.id);

      setBirthdayNotification(null);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-blue-600 via-blue-500 to-blue-400 relative">
      {/* Viewport meta tag simulation - importante para mobile */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{
          WebkitTapHighlightColor: "transparent",
          touchAction: "manipulation",
        }}
      />

      <div className="w-full min-h-screen py-4 px-3 safe-area-padding">
        {/* Birthday Notification Banner */}
        {birthdayNotification && (
          <div className="mb-4">
            <BirthdayNotificationBanner notification={birthdayNotification} onDismiss={dismissBirthdayNotification} />
          </div>
        )}

        {/* Hero Section - Optimizado para mobile */}
        <div className="text-center mb-6 px-2">
          <div className="mb-6">
            {/* Logo */}
            <div className="flex items-center justify-center mb-4">
              <img
                src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png"
                alt="ARCANA Logo"
                className="w-16 h-16 object-cover rounded-2xl shadow-xl border-2 border-white/20"
              />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold text-white mb-2 px-2 leading-tight">ARCANA</h1>
            <p className="text-blue-100 text-base mb-4 px-2 leading-relaxed">Transformando nuestra adoración</p>

            {/* Welcome Message */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4 border border-white/20">
              <h2 className="text-xl font-semibold mb-1 text-white">¡Hola, {firstName}!</h2>
              <p className="text-blue-100 text-sm">Tu participación hace la diferencia</p>

              <Link to="/agenda" className="block mt-3">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-full py-3 text-base font-medium transition-all duration-300 shadow-lg">
                  COMENZAR
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="bg-white rounded-2xl p-4 shadow-xl mx-1 mb-4">
          <h2 className="text-xl font-bold text-gray-800 text-center mb-4 px-2">SERVICIOS PRINCIPALES</h2>

          <div className="grid grid-cols-1 gap-3">
            {mainServices.map((service, index) => {
              const IconComponent = service.icon;
              const colors = [
                "bg-gradient-to-r from-blue-500 to-blue-600",
                "bg-gradient-to-r from-blue-600 to-blue-700",
                "bg-gradient-to-r from-blue-400 to-blue-500",
                "bg-gradient-to-r from-blue-500 to-blue-600",
              ];
              const currentColor = colors[index % colors.length];

              return (
                <Link key={service.id} to={service.url} className="block">
                  <div
                    className={`${currentColor} rounded-xl p-4 text-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg active:scale-95`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold mb-0.5 truncate">{service.title}</h3>
                        <p className="text-white/80 text-xs line-clamp-1">{service.description}</p>
                      </div>
                      <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-base">→</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-3 px-2 mb-4">
          <Link to="/integrantes" className="block">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center text-white hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20 active:scale-95">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">{loading ? "..." : memberCount}</h3>
              <p className="text-blue-100 text-xs">Miembros Activos</p>
            </div>
          </Link>

          <Link to="/worship-groups" className="block">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center text-white hover:bg-white/20 transition-all duration-300 cursor-pointer border border-white/20 active:scale-95">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Music className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-1">{loading ? "..." : groupCount}</h3>
              <p className="text-blue-100 text-xs">Grupos de Alabanza</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Safe area spacer para iPhone */}
      <div className="h-8 safe-area-bottom"></div>
    </div>
  );
};

export default Index;

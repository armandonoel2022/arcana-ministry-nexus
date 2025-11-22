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

  const firstName = userProfile?.full_name?.split(" ")[0] || "Usuario";

  const mainServices = [
    {
      id: "agenda",
      title: "Agenda Ministerial",
      description: "Servicios y eventos",
      icon: Calendar,
      url: "/agenda",
    },
    {
      id: "repertorio",
      title: "Repertorio Musical",
      description: "Catálogo de canciones",
      icon: Music,
      url: "/repertorio",
    },
    {
      id: "integrantes",
      title: "Integrantes",
      description: "Miembros del ministerio",
      icon: Users,
      url: "/integrantes",
    },
    {
      id: "comunicacion",
      title: "Comunicación",
      description: "Chat del equipo",
      icon: MessageCircle,
      url: "/communication",
    },
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: membersCount } = await supabase
          .from("members")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        setMemberCount(membersCount || 0);

        const { count: groupsCount } = await supabase
          .from("worship_groups")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true);

        setGroupCount(groupsCount || 0);

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: notifications } = await supabase
            .from("system_notifications")
            .select("*")
            .eq("recipient_id", user.id)
            .eq("type", "birthday")
            .eq("is_read", false)
            .order("created_at", { ascending: false })
            .limit(1);

          if (notifications && notifications.length > 0) {
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
      await supabase.from("system_notifications").update({ is_read: true }).eq("id", birthdayNotification.id);
      setBirthdayNotification(null);
    }
  };

  return (
    <div
      className="min-h-screen w-full bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 fixed inset-0 overflow-y-auto"
      style={{
        height: "100vh",
        height: "-webkit-fill-available",
      }}
    >
      {/* Gradient overlay que cubre TODA la pantalla */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 -z-10" />

      {/* Birthday Notification Banner */}
      {birthdayNotification && (
        <div className="absolute top-0 left-0 right-0 z-50 safe-area-padding pt-4">
          <BirthdayNotificationBanner notification={birthdayNotification} onDismiss={dismissBirthdayNotification} />
        </div>
      )}

      {/* Contenedor principal */}
      <div
        className="w-full h-full flex flex-col md:flex-row md:items-center md:justify-center safe-area-padding"
        style={{
          minHeight: "100vh",
          minHeight: "-webkit-fill-available",
        }}
      >
        {/* Lado Izquierdo - Hero Section más limpio */}
        <div className="w-full md:w-2/5 flex flex-col justify-center p-6 md:p-8 lg:p-12">
          <div className="text-center md:text-left">
            {/* Logo y título unificados */}
            <div className="flex flex-col items-center md:items-start mb-8">
              <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                <img
                  src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png"
                  alt="ARCANA Logo"
                  className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-2xl shadow-xl border-2 border-white/20"
                />
                <h1 className="text-4xl md:text-5xl font-bold text-white">ARCANA</h1>
              </div>
              <p className="text-blue-100 text-lg md:text-xl font-light">Transformando nuestra adoración</p>
            </div>

            {/* Mensaje de bienvenida personalizado */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">¡Hola, {firstName}!</h2>
                <p className="text-blue-100 text-base md:text-lg mb-6">
                  Tu participación hace la diferencia en nuestro ministerio
                </p>
                <Link to="/agenda" className="block">
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 rounded-full w-full md:w-auto px-8 py-3 text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl active:scale-95">
                    Comenzar
                  </Button>
                </Link>
              </div>
            </div>

            {/* Stats en desktop */}
            <div className="hidden md:grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{loading ? "..." : memberCount}</h3>
                <p className="text-blue-100 text-sm">Miembros</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">{loading ? "..." : groupCount}</h3>
                <p className="text-blue-100 text-sm">Grupos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Lado Derecho - Services Grid */}
        <div className="w-full md:w-3/5 p-6 md:p-8 lg:p-12">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Servicios Principales</h2>
              <p className="text-blue-100 text-lg">Accede a las herramientas del ministerio</p>
            </div>

            {/* Services Grid mejorado */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mainServices.map((service, index) => {
                const IconComponent = service.icon;
                const colors = [
                  "from-blue-500 to-blue-600",
                  "from-blue-600 to-blue-700",
                  "from-blue-400 to-blue-500",
                  "from-blue-500 to-blue-600",
                ];
                const currentColor = colors[index % colors.length];

                return (
                  <Link key={service.id} to={service.url} className="block group">
                    <div
                      className={`bg-gradient-to-br ${currentColor} rounded-2xl p-6 text-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg group-hover:shadow-xl border-2 border-white/10 h-full`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                          <p className="text-white/80 text-sm leading-relaxed">{service.description}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Stats Mobile */}
            <div className="md:hidden grid grid-cols-2 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{loading ? "..." : memberCount}</h3>
                <p className="text-blue-100 text-xs">Miembros</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/20">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{loading ? "..." : groupCount}</h3>
                <p className="text-blue-100 text-xs">Grupos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Safe area spacer para iPhone */}
      <div className="h-4 safe-area-bottom md:hidden"></div>
    </div>
  );
};

export default Index;

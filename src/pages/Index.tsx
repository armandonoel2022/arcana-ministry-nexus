import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Music, Users, MessageCircle } from "lucide-react";
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
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "repertorio",
      title: "Repertorio Musical",
      description: "Catálogo de canciones",
      icon: Music,
      url: "/repertorio",
      color: "from-blue-600 to-blue-700",
    },
    {
      id: "integrantes",
      title: "Integrantes",
      description: "Miembros del ministerio",
      icon: Users,
      url: "/integrantes",
      color: "from-blue-400 to-blue-500",
    },
    {
      id: "comunicacion",
      title: "Comunicación",
      description: "Chat del equipo",
      icon: MessageCircle,
      url: "/communication",
      color: "from-blue-500 to-blue-600",
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
      className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 fixed inset-0 overflow-y-auto"
      style={{
        height: "100vh",
        height: "-webkit-fill-available",
      }}
    >
      {/* Contenedor principal */}
      <div
        className="w-full h-full max-w-6xl mx-auto safe-area-padding"
        style={{
          minHeight: "100vh",
          minHeight: "-webkit-fill-available",
        }}
      >
        {/* Header */}
        <div className="pt-8 pb-8 px-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img
              src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png"
              alt="ARCANA Logo"
              className="w-16 h-16 object-cover rounded-2xl shadow-lg"
            />
            <div className="text-left">
              <h1 className="text-3xl font-bold text-gray-900">ARCANA</h1>
              <p className="text-gray-600 text-lg">Transformando nuestra adoración</p>
            </div>
          </div>
        </div>

        {/* Birthday Notification */}
        {birthdayNotification && (
          <div className="px-6 mb-6">
            <BirthdayNotificationBanner notification={birthdayNotification} onDismiss={dismissBirthdayNotification} />
          </div>
        )}

        {/* Welcome Card */}
        <div className="px-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-200 max-w-2xl mx-auto">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Hola, {firstName}!</h2>
              <p className="text-gray-600 mb-6">Tu participación hace la diferencia en nuestro ministerio</p>
              <Link to="/agenda">
                <Button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                  Comenzar
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 px-6 mb-8 max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : memberCount}</p>
                <p className="text-blue-100 text-sm">Miembros</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{loading ? "..." : groupCount}</p>
                <p className="text-blue-100 text-sm">Grupos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="px-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Servicios Principales</h2>
            <p className="text-gray-600">Accede a las herramientas del ministerio</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {mainServices.map((service) => {
              const IconComponent = service.icon;
              return (
                <Link key={service.id} to={service.url} className="block">
                  <div
                    className={`bg-gradient-to-br ${service.color} rounded-2xl p-6 text-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl border border-white/20`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold mb-2 truncate">{service.title}</h3>
                        <p className="text-blue-100 text-sm line-clamp-1">{service.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom spacing */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default Index;

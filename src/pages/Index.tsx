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
      className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50 fixed inset-0 overflow-y-auto"
      style={{
        height: "100vh",
        height: "-webkit-fill-available",
      }}
    >
      {/* Contenedor principal */}
      <div
        className="w-full h-full safe-area-padding"
        style={{
          minHeight: "100vh",
          minHeight: "-webkit-fill-available",
        }}
      >
        {/* Header minimalista */}
        <div className="pt-8 pb-6 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png"
                alt="ARCANA Logo"
                className="w-10 h-10 object-cover rounded-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ARCANA</h1>
                <p className="text-gray-600 text-sm">Ministerio de alabanza</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gray-600 text-sm">Bienvenido</p>
              <p className="text-gray-900 font-medium">{firstName}</p>
            </div>
          </div>
        </div>

        {/* Birthday Notification */}
        {birthdayNotification && (
          <div className="px-6 mb-6">
            <BirthdayNotificationBanner notification={birthdayNotification} onDismiss={dismissBirthdayNotification} />
          </div>
        )}

        {/* Stats Cards - Minimalistas */}
        <div className="grid grid-cols-2 gap-4 px-6 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{loading ? "..." : memberCount}</p>
                <p className="text-gray-600 text-sm">Miembros</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Music className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{loading ? "..." : groupCount}</p>
                <p className="text-gray-600 text-sm">Grupos</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="px-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Servicios Principales</h2>
            <p className="text-gray-600">Accede a las herramientas del ministerio</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mainServices.map((service) => {
              const IconComponent = service.icon;
              return (
                <Link key={service.id} to={service.url} className="block">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300 active:scale-95">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">{service.title}</h3>
                        <p className="text-gray-600 text-sm line-clamp-1">{service.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Quick Action Button */}
        <div className="fixed bottom-6 left-6 right-6 safe-area-padding">
          <Link to="/agenda">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
              Comenzar
            </Button>
          </Link>
        </div>
      </div>

      {/* Safe area spacer */}
      <div className="h-20 safe-area-bottom"></div>
    </div>
  );
};

export default Index;

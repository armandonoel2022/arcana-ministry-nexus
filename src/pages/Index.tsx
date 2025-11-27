import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  Calendar,
  Music,
  Users,
  MessageSquare,
  UserCog,
  Cake,
  Lightbulb
} from "lucide-react";
import BirthdayNotificationBanner from "@/components/notifications/BirthdayNotificationBanner";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [memberCount, setMemberCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [birthdayNotification, setBirthdayNotification] = useState<any>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const firstName = userProfile?.full_name?.split(" ")[0] || "Usuario";

  const mainServices = [
    {
      title: "Agenda Ministerial",
      description: "Gestión de servicios y turnos",
      icon: Calendar,
      url: "/agenda",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      title: "Repertorio Musical",
      description: "Catálogo de canciones",
      icon: Music,
      url: "/repertorio",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      title: "Solicitar Reemplazo",
      description: "Reemplazos de director",
      icon: UserCog,
      url: "/director-replacements",
      gradient: "from-green-500 to-emerald-600"
    },
    {
      title: "Comunicación",
      description: "Chat y mensajería",
      icon: MessageSquare,
      url: "/communication",
      gradient: "from-cyan-500 to-blue-500"
    },
    {
      title: "Cumpleaños",
      description: "Fechas especiales",
      icon: Cake,
      url: "/birthday-module",
      gradient: "from-pink-500 to-rose-600"
    },
    {
      title: "Recomendaciones",
      description: "Sugerencias y consejos",
      icon: Lightbulb,
      url: "/recomendaciones",
      gradient: "from-amber-500 to-orange-600"
    }
  ];

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { count: members } = await supabase
          .from('members')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        const { count: groups } = await supabase
          .from('worship_groups')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        setMemberCount(members || 0);
        setGroupCount(groups || 0);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    const checkBirthdayNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: notifications } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('type', 'birthday')
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (notifications && notifications.length > 0) {
        setBirthdayNotification(notifications[0]);
      }
    };

    fetchStats();
    checkBirthdayNotifications();
  }, []);

  const dismissBirthdayNotification = async () => {
    if (!birthdayNotification) return;

    await supabase
      .from('system_notifications')
      .update({ is_read: true })
      .eq('id', birthdayNotification.id);

    setBirthdayNotification(null);
  };

  const handleOptionClick = (url: string) => {
    setIsAnimating(true);
    setTimeout(() => {
      navigate(url);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
         style={{ background: "var(--gradient-primary)", width: "100vw", maxWidth: "100vw" }}>
      
      <div className={`welcome-container ${isAnimating ? 'animating' : ''}`}>
        
        {/* Welcome Message Panel */}
        <div className="message-panel">
          <div className="message-content">
            <img 
              src="/lovable-uploads/8fdbb3a5-23bc-40fb-aa20-6cfe73adc882.png" 
              alt="ARCANA Logo" 
              className="w-20 h-20 mx-auto mb-6 object-contain"
            />
            <h1 className="text-4xl font-bold text-white mb-4">¡Hola, {firstName}!</h1>
            <p className="text-white/90 mb-6 text-lg">
              Sistema de Gestión Musical ARCANA
            </p>
          </div>
        </div>

        {/* Menu Options Panel */}
        <div className="options-panel">
          {birthdayNotification && (
            <div className="mb-4 w-full max-w-[600px]">
              <BirthdayNotificationBanner
                notification={birthdayNotification}
                onDismiss={dismissBirthdayNotification}
              />
            </div>
          )}

          {/* Main Services Grid - 4 buttons */}
          <div className="options-grid">
            {mainServices.map((option, index) => (
              <Button
                key={option.url}
                onClick={() => handleOptionClick(option.url)}
                className={`option-card group animate-fade-in`}
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  background: `linear-gradient(135deg, var(--primary), var(--accent))`
                }}
                variant="outline"
              >
                <div className="option-content">
                  <option.icon className="w-10 h-10 mb-3 group-hover:scale-110 transition-transform duration-200" />
                  <h3 className="font-semibold text-sm mb-1">{option.title}</h3>
                  <p className="text-xs">{option.description}</p>
                </div>
              </Button>
            ))}
          </div>
          
          {/* Stats Cards - Clickable - BELOW main services */}
          <div className="stats-cards">
            <Button
              onClick={() => handleOptionClick("/integrantes")}
              className="stat-card"
              variant="outline"
            >
              <div className="stat-content">
                <Users className="w-6 h-6 mb-1" />
                <span className="stat-number">{memberCount}</span>
                <span className="stat-label">Miembros</span>
              </div>
            </Button>
            <Button
              onClick={() => handleOptionClick("/worship-groups")}
              className="stat-card"
              variant="outline"
            >
              <div className="stat-content">
                <Music className="w-6 h-6 mb-1" />
                <span className="stat-number">{groupCount}</span>
                <span className="stat-label">Grupos</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Toggle Background */}
        <div className="toggle-box">
          <div className="toggle-background"></div>
        </div>
      </div>

      <style>{`
        .welcome-container {
          position: relative;
          width: 1000px;
          height: 600px;
          background: #fff;
          border-radius: 30px;
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.2);
          margin: 20px;
          overflow: hidden;
          max-width: 90vw;
        }

        .message-panel {
          position: absolute;
          width: 35%;
          height: 100%;
          left: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: transparent;
          color: #fff;
          z-index: 3;
          transition: 0.8s ease-in-out;
        }

        .options-panel {
          position: absolute;
          width: 65%;
          height: 100%;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 30px 20px;
          background: #fff;
          z-index: 2;
          transition: 0.8s ease-in-out;
          overflow-y: auto;
        }

        .message-content {
          text-align: center;
          z-index: 5;
          position: relative;
        }

        .options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          width: 100%;
          max-width: 600px;
          margin-bottom: 20px;
        }
        
        @media screen and (min-width: 769px) {
          .options-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          width: 100%;
          max-width: 600px;
        }

        .stat-card {
          height: 70px !important;
          border: 2px solid hsl(var(--primary)) !important;
          border-radius: 12px !important;
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(217 91% 55%)) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative;
          overflow: hidden;
        }

        .stat-card:hover {
          transform: translateY(-2px) !important;
          box-shadow: var(--shadow-elegant) !important;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: white;
          text-align: center;
        }

        .stat-content svg {
          color: white;
        }

        .stat-number {
          font-size: 18px;
          font-weight: bold;
          line-height: 1;
        }

        .stat-label {
          font-size: 11px;
          opacity: 0.9;
        }

        .option-card {
          height: 140px !important;
          border: 2px solid hsl(var(--border)) !important;
          border-radius: 16px !important;
          background: white !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          position: relative;
          overflow: hidden;
        }

        .option-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: var(--shadow-elegant) !important;
          border-color: hsl(var(--primary)) !important;
        }

        .option-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--gradient-primary);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 1;
        }

        .option-card:hover::before {
          opacity: 1;
        }

        .option-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          text-align: center;
          position: relative;
          z-index: 2;
          transition: color 0.3s ease;
          color: hsl(var(--foreground));
          padding: 8px;
        }

        .option-content h3 {
          color: hsl(var(--foreground));
          font-weight: 600;
          font-size: 14px;
        }

        .option-content p {
          color: hsl(var(--muted-foreground));
          font-size: 12px;
        }

        .option-content svg {
          color: hsl(var(--primary));
        }

        .option-card:hover .option-content h3,
        .option-card:hover .option-content p {
          color: white !important;
        }

        .option-card:hover .option-content svg {
          color: white !important;
        }

        .toggle-box {
          position: absolute;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .toggle-background {
          content: '';
          position: absolute;
          left: 0;
          width: 35%;
          height: 100%;
          background: var(--gradient-blue-form);
          z-index: 2;
          transition: 1.8s ease-in-out;
        }

        .welcome-container.animating .message-panel {
          transform: translateX(-100%);
        }

        .welcome-container.animating .options-panel {
          transform: translateX(100%);
        }

        /* Responsive Design */
        @media screen and (max-width: 768px) {
          body, html {
            overflow-x: hidden;
          }

          .welcome-container {
            width: 100vw;
            height: 100vh;
            height: 100dvh;
            border-radius: 0;
            margin: 0;
            flex-direction: column;
            max-width: 100vw;
            position: fixed;
            left: 0;
            right: 0;
            top: 0;
            bottom: 0;
          }

          .message-panel {
            position: relative;
            width: 100%;
            height: 20%;
            min-height: 140px;
            background: var(--gradient-blue-form);
            padding: 16px;
          }

          .options-panel {
            position: relative;
            width: 100%;
            height: 80%;
            background: #fff;
            padding: 20px 16px;
            overflow-y: auto;
            overflow-x: hidden;
            justify-content: space-between;
            gap: 0;
          }

          .options-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            max-width: 100%;
            margin-bottom: 10px;
          }

          .option-card {
            height: 135px !important;
          }

          .option-content svg {
            width: 36px;
            height: 36px;
          }

          .option-content h3 {
            font-size: 13px;
          }

          .option-content p {
            font-size: 10px;
          }

          .stats-cards {
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
            max-width: 100%;
            margin-bottom: 0;
          }

          .stat-card {
            height: 95px !important;
          }

          .stat-number {
            font-size: 16px;
          }

          .stat-label {
            font-size: 10px;
          }

          .stat-content svg {
            width: 20px;
            height: 20px;
            margin-bottom: 4px;
          }

          .toggle-background {
            display: none;
          }

          .message-content h1 {
            font-size: 24px;
            margin-bottom: 8px;
          }

          .message-content p {
            font-size: 14px;
          }

          .message-content img {
            width: 56px;
            height: 56px;
            margin-bottom: 12px;
          }
        }

        @media screen and (max-width: 400px) {
          .message-panel,
          .options-panel {
            padding: 15px;
          }
          
          .message-content h1 {
            font-size: 24px;
          }

          .option-card {
            height: 80px !important;
          }

          .options-grid {
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default Index;

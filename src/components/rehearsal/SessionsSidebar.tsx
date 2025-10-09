import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Music2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Session {
  id: string;
  title: string;
  session_name: string;
  status: string;
  created_at: string;
}

interface SessionsSidebarProps {
  sessions: Session[];
  currentSessionId: string;
  onCreateNew: () => void;
}

const SessionsSidebar = ({ sessions, currentSessionId, onCreateNew }: SessionsSidebarProps) => {
  const navigate = useNavigate();

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: "Borrador", className: "bg-blue-500" },
      in_progress: { label: "En progreso", className: "bg-green-500" },
      completed: { label: "Finalizado", className: "bg-gray-500" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="w-80 bg-card border-r h-screen flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold mb-4">Módulo de Ensayos Colaborativos</h2>
        <Button 
          onClick={onCreateNew}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Ensayo
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {sessions.map((session) => {
            const isActive = session.id === currentSessionId;
            const date = new Date(session.created_at);
            
            return (
              <div
                key={session.id}
                onClick={() => navigate(`/rehearsals/${session.id}`)}
                className={`p-4 rounded-lg cursor-pointer transition-all ${
                  isActive 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                    : 'bg-muted/50 hover:bg-muted'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Music2 className={`w-5 h-5 ${isActive ? 'text-white' : 'text-primary'}`} />
                  {getStatusBadge(session.status)}
                </div>
                <h3 className={`font-semibold mb-1 ${isActive ? 'text-white' : 'text-foreground'}`}>
                  {session.session_name || session.title}
                </h3>
                <p className={`text-sm ${isActive ? 'text-white/80' : 'text-muted-foreground'}`}>
                  {date.toLocaleDateString('es-ES', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                  })}
                  {' '}
                  {date.toLocaleTimeString('es-ES', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SessionsSidebar;

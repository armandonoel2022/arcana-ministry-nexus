import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Mic, 
  UserPlus, 
  Trash2,
  Play,
  Volume2,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RehearsalRecorder from "@/components/rehearsal/RehearsalRecorder";
import RehearsalTracksList from "@/components/rehearsal/RehearsalTracksList";
import InviteParticipantDialog from "@/components/rehearsal/InviteParticipantDialog";
import BackingTrackUpload from "@/components/rehearsal/BackingTrackUpload";

interface Participant {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    full_name: string;
    photo_url?: string;
  };
}

interface SessionData {
  id: string;
  title: string;
  session_name: string;
  description: string;
  group_id: string;
  status: string;
  created_by: string;
  created_at: string;
  backing_track_url: string | null;
  song_id?: string;
  songs?: {
    title: string;
    artist: string;
  };
}

const RehearsalSession = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  
  console.log("RehearsalSession: Component mounted", { sessionId, user: user?.id });
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [refreshTracks, setRefreshTracks] = useState(0);

  useEffect(() => {
    if (sessionId) {
      console.log("RehearsalSession: Fetching data for session:", sessionId);
      fetchSessionData();
      fetchParticipants();
    } else {
      console.error("RehearsalSession: No sessionId provided");
    }
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rehearsal_sessions")
        .select(`
          *,
          songs (
            title,
            artist
          )
        `)
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar la sesión",
        variant: "destructive",
      });
      console.error("Error fetching session:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("rehearsal_participants")
        .select(`
          *,
          profiles!rehearsal_participants_user_id_fk (
            full_name,
            photo_url
          )
        `)
        .eq("session_id", sessionId)
        .eq("invitation_status", "accepted");

      if (error) throw error;
      setParticipants(data || []);
    } catch (error: any) {
      console.error("Error fetching participants:", error);
    }
  };

  const handleRecordingComplete = () => {
    setRefreshTracks(prev => prev + 1);
    toast({
      title: "Grabación guardada",
      description: "Tu pista ha sido guardada exitosamente",
    });
  };

  // Early return if user is not loaded yet
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Verificando usuario...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Cargando sesión...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Sesión no encontrada</p>
          <Button onClick={() => navigate("/rehearsals")}>
            Volver a sesiones
          </Button>
        </div>
      </div>
    );
  }

  const isCreator = session.created_by === user?.id;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/rehearsals")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {session.session_name || session.title}
              </h1>
              {session.songs && (
                <p className="text-lg text-gray-600 mb-2">
                  {session.songs.title} - {session.songs.artist}
                </p>
              )}
              <p className="text-sm text-gray-500">
                Creado el {new Date(session.created_at).toLocaleString('es-ES')}
              </p>
            </div>
            
            <Badge variant={session.status === 'completed' ? 'default' : 'secondary'}>
              {session.status === 'draft' ? 'Borrador' : 
               session.status === 'in_progress' ? 'En Progreso' : 'Completado'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recording section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5" />
                    Tu Grabación
                  </CardTitle>
                  {!isRecording && (
                    <Button
                      size="sm"
                      onClick={() => setIsRecording(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600"
                    >
                      <Mic className="w-4 h-4 mr-2" />
                      Nueva Grabación
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isRecording ? (
                  <RehearsalRecorder
                    sessionId={sessionId!}
                    backingTrackUrl={session.backing_track_url}
                    onComplete={handleRecordingComplete}
                    onCancel={() => setIsRecording(false)}
                  />
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Haz clic en "Nueva Grabación" para empezar
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Backing track upload */}
            <BackingTrackUpload
              sessionId={sessionId!}
              existingTrackUrl={session.backing_track_url}
              onTrackUploaded={(url) => {
                setSession(prev => prev ? { ...prev, backing_track_url: url } : null);
                setRefreshTracks(prev => prev + 1);
              }}
              onTrackRemoved={() => {
                setSession(prev => prev ? { ...prev, backing_track_url: null } : null);
                setRefreshTracks(prev => prev + 1);
              }}
            />

            {/* Tracks list */}
            <Card>
              <CardHeader>
                <CardTitle>Pistas de la Sesión</CardTitle>
              </CardHeader>
              <CardContent>
                <RehearsalTracksList
                  sessionId={sessionId!}
                  refreshTrigger={refreshTracks}
                  onTrackDeleted={() => setRefreshTracks(prev => prev + 1)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Participantes</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowInviteDialog(true)}
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {participants.map((participant) => (
                    <div key={participant.id} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={participant.profiles.photo_url} />
                        <AvatarFallback>
                          {participant.profiles.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {participant.profiles.full_name}
                        </p>
                        {participant.role === 'creator' && (
                          <Badge variant="secondary" className="text-xs">
                            Creador
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {participants.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay participantes aún
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {isCreator && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Acciones</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Mezcla
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Sesión
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <InviteParticipantDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        sessionId={sessionId!}
        currentGroupId={session.group_id}
        onInviteSent={fetchParticipants}
      />
    </div>
  );
};

export default RehearsalSession;

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  Mic, 
  UserPlus, 
  Trash2,
  Play,
  Headphones,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import RehearsalRecorder from "@/components/rehearsal/RehearsalRecorder";
import InviteParticipantDialog from "@/components/rehearsal/InviteParticipantDialog";
import BackingTrackUpload from "@/components/rehearsal/BackingTrackUpload";
import MultitrackView from "@/components/rehearsal/MultitrackView";
import AudioPlayer from "@/components/rehearsal/AudioPlayer";

interface Participant {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    full_name: string;
    photo_url?: string;
  };
}

interface Track {
  id: string;
  track_name: string;
  track_type: string;
  audio_url: string;
  user_id: string;
  is_backing_track: boolean;
  volume_level: number;
  is_muted: boolean;
  profiles: {
    full_name: string;
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
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [refreshTracks, setRefreshTracks] = useState(0);
  const [triggerPlayMix, setTriggerPlayMix] = useState(false);

  useEffect(() => {
    if (sessionId) {
      console.log("RehearsalSession: Fetching data for session:", sessionId);
      fetchSessionData();
      fetchParticipants();
      fetchTracks();
    } else {
      console.error("RehearsalSession: No sessionId provided");
    }
  }, [sessionId, refreshTracks]);

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
            full_name
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

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from("rehearsal_tracks")
        .select(`
          *,
          profiles!rehearsal_tracks_user_id_fk (
            full_name
          )
        `)
        .eq("session_id", sessionId)
        .eq("is_published", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setTracks(data || []);
    } catch (error: any) {
      console.error("Error fetching tracks:", error);
    }
  };


  const handleRecordingComplete = () => {
    setIsRecording(false);
    setRefreshTracks(prev => prev + 1);
    toast({
      title: "Grabación guardada",
      description: "Tu pista ha sido guardada exitosamente",
    });
  };

  const handleTrackDelete = async (trackId: string) => {
    try {
      const { error } = await supabase
        .from("rehearsal_tracks")
        .delete()
        .eq("id", trackId);

      if (error) throw error;

      toast({
        title: "Pista eliminada",
        description: "La pista ha sido eliminada exitosamente",
      });
      setRefreshTracks(prev => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la pista",
        variant: "destructive",
      });
    }
  };

  const handleTrackUpdate = async (trackId: string, updates: Partial<Track>) => {
    try {
      const { error } = await supabase
        .from("rehearsal_tracks")
        .update(updates)
        .eq("id", trackId);

      if (error) throw error;
      setRefreshTracks(prev => prev + 1);
    } catch (error: any) {
      console.error("Error updating track:", error);
    }
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
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white pb-24">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/rehearsals?tab=sesiones")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Ensayos
          </Button>

          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {session?.session_name || session?.title}
              </h1>
              {session?.songs && (
                <p className="text-lg text-gray-600 mb-2">
                  {session.songs.title} - {session.songs.artist}
                </p>
              )}
              <Badge variant={session?.status === 'completed' ? 'default' : 'secondary'}>
                {session?.status === 'draft' ? 'Borrador' : 
                 session?.status === 'in_progress' ? 'En progreso' : 'Finalizado'}
              </Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-6">
            <Button 
              variant="default"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => setTriggerPlayMix(prev => !prev)}
            >
              <Play className="w-4 h-4 mr-2" />
              Reproducir mezcla
            </Button>
            <Button variant="outline">
              <Headphones className="w-4 h-4 mr-2" />
              Solo pista base
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsRecording(!isRecording)}
              className={isRecording ? "bg-red-50 text-red-600 border-red-600" : ""}
            >
              <Mic className="w-4 h-4 mr-2" />
              {isRecording ? "Cancelar grabación" : "Grabar nueva pista"}
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar mezcla
            </Button>
            {isCreator && (
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar sesión
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Area - 3 columns */}
          <div className="lg:col-span-3 space-y-6">
            {/* Recording Section */}
            {isRecording && (
              <Card className="border-2 border-red-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="w-5 h-5 text-red-600" />
                    Grabando nueva pista
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RehearsalRecorder
                    sessionId={sessionId!}
                    backingTrackUrl={session?.backing_track_url || null}
                    existingTracks={tracks}
                    onComplete={handleRecordingComplete}
                    onCancel={() => setIsRecording(false)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Backing Track Upload */}
            <BackingTrackUpload
              sessionId={sessionId!}
              existingTrackUrl={session?.backing_track_url || null}
              onTrackUploaded={(url) => {
                setSession(prev => prev ? { ...prev, backing_track_url: url } : null);
                setRefreshTracks(prev => prev + 1);
              }}
              onTrackRemoved={() => {
                setSession(prev => prev ? { ...prev, backing_track_url: null } : null);
                setRefreshTracks(prev => prev + 1);
              }}
            />

            {/* Multitrack View */}
            <Card>
              <CardHeader>
                <CardTitle>Vista Multipista DAW</CardTitle>
              </CardHeader>
              <CardContent>
                <MultitrackView
                  tracks={tracks}
                  backingTrackUrl={session?.backing_track_url || null}
                  onTrackDelete={handleTrackDelete}
                  onTrackUpdate={handleTrackUpdate}
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar - 1 column */}
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
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white">
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
          </div>
        </div>
      </div>

      {/* Bottom Audio Player */}
      <AudioPlayer
        tracks={tracks}
        backingTrackUrl={session?.backing_track_url || null}
        triggerPlay={triggerPlayMix}
      />

      <InviteParticipantDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        sessionId={sessionId!}
        currentGroupId={session?.group_id || "general"}
        onInviteSent={fetchParticipants}
      />
    </div>
  );
};

export default RehearsalSession;

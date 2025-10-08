import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Trash2, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Track {
  id: string;
  user_id: string;
  audio_url: string;
  duration_seconds: number;
  is_published: boolean;
  created_at: string;
  track_name: string;
  is_backing_track: boolean;
  profiles: {
    full_name: string;
    photo_url?: string;
  };
}

interface RehearsalTracksListProps {
  sessionId: string;
  refreshTrigger: number;
  onTrackDeleted: () => void;
}

const RehearsalTracksList = ({ sessionId, refreshTrigger, onTrackDeleted }: RehearsalTracksListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [volumes, setVolumes] = useState<{ [key: string]: number }>({});
  const [muted, setMuted] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchTracks();
  }, [sessionId, refreshTrigger]);

  const fetchTracks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("rehearsal_tracks")
        .select(`
          *,
          profiles!rehearsal_tracks_user_id_fk (
            full_name,
            photo_url
          )
        `)
        .eq("session_id", sessionId)
        .eq("is_published", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      setTracks(data || []);
      
      // Initialize volumes
      const initialVolumes: { [key: string]: number } = {};
      const initialMuted: { [key: string]: boolean } = {};
      data?.forEach(track => {
        initialVolumes[track.id] = 100;
        initialMuted[track.id] = false;
      });
      setVolumes(initialVolumes);
      setMuted(initialMuted);
      
    } catch (error: any) {
      console.error("Error fetching tracks:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTrack = async (trackId: string, userId: string) => {
    if (userId !== user?.id) {
      toast({
        title: "Error",
        description: "Solo puedes eliminar tus propias pistas",
        variant: "destructive",
      });
      return;
    }

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

      onTrackDeleted();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la pista",
        variant: "destructive",
      });
      console.error("Error deleting track:", error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Cargando pistas...</div>;
  }

  if (tracks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No hay pistas publicadas aún. ¡Sé el primero en grabar!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tracks.map((track) => (
        <Card key={track.id} className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={track.profiles.photo_url} />
              <AvatarFallback>
                {track.profiles.full_name.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{track.profiles.full_name}</p>
              <p className="text-sm text-gray-500">{track.track_name}</p>
              <div className="flex items-center gap-4 mt-2">
                <audio
                  id={`audio-${track.id}`}
                  src={track.audio_url}
                  onPlay={() => setPlayingTrackId(track.id)}
                  onPause={() => setPlayingTrackId(null)}
                  onEnded={() => setPlayingTrackId(null)}
                  className="hidden"
                />
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const audio = document.getElementById(`audio-${track.id}`) as HTMLAudioElement;
                    if (playingTrackId === track.id) {
                      audio.pause();
                    } else {
                      // Pause all other tracks
                      tracks.forEach(t => {
                        if (t.id !== track.id) {
                          const otherAudio = document.getElementById(`audio-${t.id}`) as HTMLAudioElement;
                          if (otherAudio) otherAudio.pause();
                        }
                      });
                      audio.play();
                    }
                  }}
                >
                  {playingTrackId === track.id ? (
                    <Pause className="w-4 h-4" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                </Button>

                <span className="text-sm text-gray-500">
                  {formatDuration(track.duration_seconds)}
                </span>

                <div className="flex items-center gap-2 flex-1 max-w-xs">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const audio = document.getElementById(`audio-${track.id}`) as HTMLAudioElement;
                      const newMuted = !muted[track.id];
                      setMuted({ ...muted, [track.id]: newMuted });
                      if (audio) audio.muted = newMuted;
                    }}
                  >
                    {muted[track.id] ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                  
                  <Slider
                    value={[volumes[track.id] || 100]}
                    max={100}
                    step={1}
                    className="w-24"
                    onValueChange={(value) => {
                      const newVolume = value[0];
                      setVolumes({ ...volumes, [track.id]: newVolume });
                      const audio = document.getElementById(`audio-${track.id}`) as HTMLAudioElement;
                      if (audio) audio.volume = newVolume / 100;
                    }}
                  />
                </div>
              </div>
            </div>

            {track.user_id === user?.id && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => deleteTrack(track.id, track.user_id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
};

export default RehearsalTracksList;

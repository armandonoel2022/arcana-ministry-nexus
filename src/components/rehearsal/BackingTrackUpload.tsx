import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Music, X, Play, Pause } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface BackingTrackUploadProps {
  sessionId: string;
  existingTrackUrl?: string | null;
  onTrackUploaded: (url: string) => void;
  onTrackRemoved: () => void;
}

const BackingTrackUpload = ({
  sessionId,
  existingTrackUrl,
  onTrackUploaded,
  onTrackRemoved,
}: BackingTrackUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      toast({
        title: "Error",
        description: "Por favor sube un archivo de audio válido (MP3, WAV, etc.)",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Sanitize file name: remove special characters and replace spaces with underscores
      const sanitizedFileName = file.name
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/\s+/g, '_');

      // Upload to storage
      const fileName = `${sessionId}/backing-track/${Date.now()}-${sanitizedFileName}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('rehearsal-media')
        .upload(fileName, file, {
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('rehearsal-media')
        .getPublicUrl(fileName);

      // Update session
      const { error: updateError } = await supabase
        .from('rehearsal_sessions')
        .update({ backing_track_url: publicUrl })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // Create track record for the backing track
      const { data: participantData } = await supabase
        .from('rehearsal_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (participantData) {
        await supabase
          .from('rehearsal_tracks')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            participant_id: participantData.id,
            audio_url: publicUrl,
            track_type: 'audio',
            track_name: 'Pista Base',
            is_published: true,
            is_backing_track: true,
          });
      }

      toast({
        title: "Pista cargada",
        description: "La pista base ha sido cargada exitosamente",
      });

      onTrackUploaded(publicUrl);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo cargar la pista base",
        variant: "destructive",
      });
      console.error("Error uploading backing track:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveTrack = async () => {
    try {
      const { error } = await supabase
        .from('rehearsal_sessions')
        .update({ backing_track_url: null })
        .eq('id', sessionId);

      if (error) throw error;

      // Remove backing track from rehearsal_tracks
      await supabase
        .from('rehearsal_tracks')
        .delete()
        .eq('session_id', sessionId)
        .eq('is_backing_track', true);

      toast({
        title: "Pista eliminada",
        description: "La pista base ha sido eliminada",
      });

      if (audioElement) {
        audioElement.pause();
        setIsPlaying(false);
      }

      onTrackRemoved();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la pista base",
        variant: "destructive",
      });
      console.error("Error removing backing track:", error);
    }
  };

  const togglePlay = () => {
    if (!existingTrackUrl) return;

    if (!audioElement) {
      const audio = new Audio(existingTrackUrl);
      audio.onended = () => setIsPlaying(false);
      setAudioElement(audio);
      audio.play();
      setIsPlaying(true);
    } else {
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
      } else {
        audioElement.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="w-5 h-5" />
          Pista Base
        </CardTitle>
        <CardDescription>
          Carga un MP3 de referencia para grabar sobre él
        </CardDescription>
      </CardHeader>
      <CardContent>
        {existingTrackUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-900">Pista base cargada</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={isPlaying ? "default" : "outline"}
                  onClick={togglePlay}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveTrack}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Esta pista se reproducirá automáticamente mientras grabas
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-3">
                Arrastra un archivo MP3 o haz clic para seleccionar
              </p>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="backing-track-upload"
                disabled={isUploading}
              />
              <label htmlFor="backing-track-upload">
                <Button
                  asChild
                  variant="outline"
                  disabled={isUploading}
                >
                  <span className="cursor-pointer">
                    {isUploading ? "Cargando..." : "Seleccionar archivo"}
                  </span>
                </Button>
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Formatos soportados: MP3, WAV, M4A
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BackingTrackUpload;

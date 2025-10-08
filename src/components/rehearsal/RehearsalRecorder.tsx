import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mic, Square, Play, Pause, Upload, X, Music } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RehearsalRecorderProps {
  sessionId: string;
  onComplete: () => void;
  onCancel: () => void;
  backingTrackUrl?: string | null;
}

const RehearsalRecorder = ({ sessionId, onComplete, onCancel, backingTrackUrl }: RehearsalRecorderProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [trackName, setTrackName] = useState("Pista principal");
  const [voiceType, setVoiceType] = useState<string>("main");
  const [isPlayingBackingTrack, setIsPlayingBackingTrack] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const backingTrackRef = useRef<HTMLAudioElement | null>(null);

  const voiceTypes = [
    { value: "main", label: "Pista Principal" },
    { value: "soprano", label: "Soprano" },
    { value: "alto", label: "Alto/Contralto" },
    { value: "tenor", label: "Tenor" },
    { value: "bajo", label: "Bajo" },
    { value: "piano", label: "Piano" },
    { value: "guitarra", label: "Guitarra" },
    { value: "bateria", label: "Batería" },
    { value: "bajo_electrico", label: "Bajo Eléctrico" },
    { value: "otro", label: "Otro" },
  ];

  const toggleBackingTrack = () => {
    if (!backingTrackUrl || !backingTrackRef.current) return;

    if (isPlayingBackingTrack) {
      backingTrackRef.current.pause();
      setIsPlayingBackingTrack(false);
    } else {
      backingTrackRef.current.play();
      setIsPlayingBackingTrack(true);
    }
  };

  const startRecording = async () => {
    try {
      // Start backing track if available
      if (backingTrackUrl && backingTrackRef.current && !isPlayingBackingTrack) {
        backingTrackRef.current.currentTime = 0;
        backingTrackRef.current.play();
        setIsPlayingBackingTrack(true);
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        
        // Stop backing track
        if (backingTrackRef.current) {
          backingTrackRef.current.pause();
          setIsPlayingBackingTrack(false);
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      setIsPaused(false);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
        variant: "destructive",
      });
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const uploadRecording = async () => {
    if (!audioURL || !user) return;

    try {
      setIsUploading(true);

      // Convert blob URL to blob
      const response = await fetch(audioURL);
      const blob = await response.blob();

      // Generate unique filename
      const fileName = `${sessionId}/${user.id}/${Date.now()}.webm`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('rehearsal-media')
        .upload(fileName, blob, {
          contentType: 'audio/webm',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('rehearsal-media')
        .getPublicUrl(fileName);

      // Get participant ID
      const { data: participantData, error: participantError } = await supabase
        .from('rehearsal_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (participantError) throw participantError;

      // Create track record
      const trackNameToSave = voiceType === "main" ? trackName : 
        voiceTypes.find(v => v.value === voiceType)?.label || trackName;

      const { error: trackError } = await supabase
        .from('rehearsal_tracks')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          participant_id: participantData.id,
          audio_url: publicUrl,
          track_type: 'audio',
          track_name: trackNameToSave,
          duration_seconds: recordingTime,
          is_published: true,
          is_backing_track: false,
        });

      if (trackError) throw trackError;

      toast({
        title: "Éxito",
        description: "Tu grabación ha sido publicada",
      });

      // Clean up
      URL.revokeObjectURL(audioURL);
      setAudioURL(null);
      setRecordingTime(0);
      onComplete();

    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo subir la grabación",
        variant: "destructive",
      });
      console.error("Error uploading recording:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Hidden audio element for backing track */}
      {backingTrackUrl && (
        <audio
          ref={backingTrackRef}
          src={backingTrackUrl}
          loop
          className="hidden"
        />
      )}

      {/* Track naming and type selection */}
      {!isRecording && !audioURL && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="voiceType">Tipo de pista</Label>
            <Select value={voiceType} onValueChange={setVoiceType}>
              <SelectTrigger id="voiceType">
                <SelectValue placeholder="Selecciona el tipo" />
              </SelectTrigger>
              <SelectContent>
                {voiceTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {voiceType === "main" && (
            <div className="space-y-2">
              <Label htmlFor="trackName">Nombre de la pista</Label>
              <Input
                id="trackName"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                placeholder="Ej: Mi grabación, Pista 1..."
              />
            </div>
          )}

          {backingTrackUrl && !isRecording && (
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-900">Pista base disponible</span>
              </div>
              <Button
                size="sm"
                variant={isPlayingBackingTrack ? "default" : "outline"}
                onClick={toggleBackingTrack}
              >
                {isPlayingBackingTrack ? "Pausar" : "Reproducir"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Recording controls */}
      {!audioURL && (
        <div className="flex flex-col items-center gap-4">
          {isRecording && (
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {formatTime(recordingTime)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-sm text-gray-600">
                  {isPaused ? 'Pausado' : 'Grabando'}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            {!isRecording ? (
              <Button
                onClick={startRecording}
                size="lg"
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                <Mic className="w-5 h-5 mr-2" />
                Iniciar Grabación
              </Button>
            ) : (
              <>
                <Button
                  onClick={pauseRecording}
                  size="lg"
                  variant="outline"
                >
                  {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                </Button>
                <Button
                  onClick={stopRecording}
                  size="lg"
                  variant="destructive"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Detener
                </Button>
              </>
            )}
            
            {!isRecording && (
              <Button onClick={onCancel} variant="ghost">
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Playback and upload */}
      {audioURL && (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg p-4">
            <audio src={audioURL} controls className="w-full" />
            <p className="text-sm text-gray-600 mt-2 text-center">
              Duración: {formatTime(recordingTime)}
            </p>
          </div>

          <div className="flex items-center gap-3 justify-center">
            <Button
              onClick={uploadRecording}
              disabled={isUploading}
              size="lg"
              className="bg-gradient-to-r from-green-600 to-green-700"
            >
              <Upload className="w-5 h-5 mr-2" />
              {isUploading ? 'Publicando...' : 'Publicar Grabación'}
            </Button>
            <Button
              onClick={() => {
                URL.revokeObjectURL(audioURL);
                setAudioURL(null);
                setRecordingTime(0);
              }}
              variant="outline"
              disabled={isUploading}
            >
              Grabar de Nuevo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RehearsalRecorder;


import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mic, MicOff, Play, Volume2 } from "lucide-react";
import { useToast } = "@/hooks/use-toast";

interface Transmission {
  id: string;
  user_id: string;
  audio_url?: string;
  duration_seconds?: number;
  transmission_type: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
}

export const WalkieTalkie = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [transmissions, setTransmissions] = useState<Transmission[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const CHANNEL_ID = "7e8f9a10-1234-5678-9abc-def012345678"; // This should match the inserted channel

  useEffect(() => {
    getCurrentUser();
    fetchTransmissions();
    setupRealtimeSubscription();
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchTransmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('walkie_talkie_transmissions')
        .select(`
          *,
          profiles:user_id (
            full_name
          )
        `)
        .eq('channel_id', CHANNEL_ID)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransmissions(data || []);
    } catch (error) {
      console.error('Error fetching transmissions:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('walkie-transmissions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'walkie_talkie_transmissions'
        },
        (payload) => {
          console.log('New transmission received:', payload);
          fetchTransmissions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      audioChunks.current = [];
      
      recorder.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        await uploadAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Grabando",
        description: "Mantén presionado para grabar tu mensaje"
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const uploadAudio = async (audioBlob: Blob) => {
    try {
      if (!currentUser) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para enviar mensajes",
          variant: "destructive"
        });
        return;
      }

      // For now, we'll simulate the audio upload by creating a transmission without audio_url
      // In a real implementation, you would upload to Supabase Storage
      const { error } = await supabase
        .from('walkie_talkie_transmissions')
        .insert({
          channel_id: CHANNEL_ID,
          user_id: currentUser.id,
          duration_seconds: recordingTime,
          transmission_type: 'voice'
        });

      if (error) throw error;

      toast({
        title: "Mensaje enviado",
        description: "Tu transmisión ha sido enviada"
      });
    } catch (error) {
      console.error('Error uploading audio:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar la transmisión",
        variant: "destructive"
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card className="bg-gradient-to-r from-arcana-gold-50 to-arcana-blue-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center">
              <Button
                size="lg"
                className={`w-20 h-20 rounded-full ${
                  isRecording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-arcana-gold-gradient hover:opacity-90'
                }`}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={!currentUser}
              >
                {isRecording ? (
                  <MicOff className="w-8 h-8 text-white" />
                ) : (
                  <Mic className="w-8 h-8 text-white" />
                )}
              </Button>
            </div>
            
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                {isRecording 
                  ? `Grabando... ${formatDuration(recordingTime)}` 
                  : 'Mantén presionado para hablar'
                }
              </p>
              {!currentUser && (
                <p className="text-xs text-red-500">
                  Debes estar autenticado para usar el walkie-talkie
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transmissions */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-arcana-gold-600" />
            Transmisiones Recientes
          </h3>
          
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {transmissions.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No hay transmisiones recientes
              </div>
            ) : (
              transmissions.map((transmission) => (
                <div
                  key={transmission.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs bg-arcana-gold-100">
                      {getInitials(transmission.profiles?.full_name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {transmission.profiles?.full_name || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatTime(transmission.created_at)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-600">
                      Duración: {formatDuration(transmission.duration_seconds || 0)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                    disabled
                  >
                    <Play className="w-3 h-3" />
                    Reproducir
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Send, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VoiceNoteRecorderProps {
  onVoiceNote: (audioUrl: string) => void;
  roomId: string;
  userId: string;
}

export const VoiceNoteRecorder = ({ onVoiceNote, roomId, userId }: VoiceNoteRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        console.log('Audio grabado:', blob.size, 'bytes');
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // Auto-stop at 2 minutes
          if (prev >= 120) {
            stopRecording();
            return 120;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error iniciando grabación:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      // Stop all audio tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  const sendAudio = async () => {
    if (!audioBlob) return;

    setUploading(true);
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${userId}/${timestamp}.webm`;
      const filePath = `${roomId}/${fileName}`;

      console.log('Subiendo audio a:', filePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error subiendo audio:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(filePath);

      console.log('Audio subido exitosamente:', publicUrl);

      // Call the callback with the audio URL
      onVoiceNote(publicUrl);

      // Reset state
      setAudioBlob(null);
      setRecordingTime(0);
      audioChunksRef.current = [];

      toast({
        title: "✅ Audio enviado",
        description: "Tu mensaje de voz ha sido enviado",
      });

    } catch (error) {
      console.error('Error enviando audio:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar el audio. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // No mostrar nada si está subiendo
  if (uploading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-muted-foreground">Enviando...</span>
      </div>
    );
  }

  // Mostrar controles de envío después de grabar
  if (audioBlob && !isRecording) {
    return (
      <div className="flex items-center gap-2 bg-primary/10 px-3 py-2 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full" />
          <span className="text-sm font-medium">
            Audio {formatTime(recordingTime)}
          </span>
        </div>
        <Button
          onClick={cancelRecording}
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Cancelar"
        >
          <X className="w-4 h-4" />
        </Button>
        <Button
          onClick={sendAudio}
          variant="default"
          size="icon"
          className="h-8 w-8 bg-primary hover:bg-primary/90"
          title="Enviar audio"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Mostrar controles de grabación
  if (isRecording) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 px-3 py-2 rounded-lg">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">
            {formatTime(recordingTime)}
          </span>
        </div>
        <Button
          onClick={stopRecording}
          variant="default"
          size="icon"
          className="bg-red-500 hover:bg-red-600"
          title="Detener grabación"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Botón inicial para grabar
  return (
    <Button
      onClick={startRecording}
      variant="ghost"
      size="icon"
      title="Grabar mensaje de voz"
    >
      <Mic className="w-4 h-4" />
    </Button>
  );
};

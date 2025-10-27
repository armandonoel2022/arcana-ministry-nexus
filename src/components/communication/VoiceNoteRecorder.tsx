import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, Square, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceNoteRecorderProps {
  onVoiceNote: (transcript: string) => void;
}

export const VoiceNoteRecorder = ({ onVoiceNote }: VoiceNoteRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Setup Web Speech API for transcription
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';
        
        recognition.onresult = (event: any) => {
          const transcript = Array.from(event.results)
            .map((result: any) => result[0].transcript)
            .join(' ');
          
          console.log('Transcripción de nota de voz:', transcript);
          
          // Send the transcription
          if (transcript.trim()) {
            onVoiceNote(transcript.trim());
            toast({
              title: "🎤 Nota de voz enviada",
              description: transcript.substring(0, 50) + (transcript.length > 50 ? '...' : ''),
            });
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Error en transcripción:', event.error);
        };

        recognitionRef.current = recognition;
        recognition.start();
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        console.log('Nota de voz grabada:', audioBlob.size, 'bytes');
        
        // Stop recognition
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "🎤 Grabando nota de voz",
        description: "Habla claramente. Se transcribirá automáticamente.",
      });

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
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          onClick={startRecording}
          variant="outline"
          size="icon"
          title="Grabar nota de voz"
        >
          <Mic className="w-4 h-4" />
        </Button>
      ) : (
        <>
          <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 px-3 py-2 rounded-lg animate-pulse">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              {formatTime(recordingTime)}
            </span>
          </div>
          <Button
            onClick={stopRecording}
            variant="destructive"
            size="icon"
            title="Detener y enviar"
          >
            <Square className="w-4 h-4" />
          </Button>
        </>
      )}
    </div>
  );
};

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VoiceRecognitionProps {
  onCommand: (command: string) => void;
  isEnabled: boolean;
}

export const VoiceRecognition = ({ onCommand, isEnabled }: VoiceRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      console.log('Web Speech API no soportada en este navegador');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'es-ES';

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      console.log('Transcripción recibida:', transcript);

      // Check if the command starts with "ARCANA"
      const lowerTranscript = transcript.toLowerCase();
      if (lowerTranscript.startsWith('arcana')) {
        const command = transcript.substring(6).trim(); // Remove "ARCANA" prefix
        if (command) {
          console.log('Comando de voz detectado:', command);
          onCommand(command);
          toast({
            title: "🎤 Comando recibido",
            description: command,
          });
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Error en reconocimiento de voz:', event.error);
      if (event.error === 'no-speech') {
        // Restart if no speech detected
        if (isListening) {
          recognition.start();
        }
      } else {
        setIsListening(false);
        toast({
          title: "Error de reconocimiento",
          description: "No se pudo procesar el audio. Intenta de nuevo.",
          variant: "destructive",
        });
      }
    };

    recognition.onend = () => {
      // Restart recognition if it should still be listening
      if (isListening && isEnabled) {
        try {
          recognition.start();
        } catch (e) {
          console.error('Error reiniciando reconocimiento:', e);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onCommand, isListening, isEnabled, toast]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      toast({
        title: "🎤 Reconocimiento detenido",
        description: "Ya no estoy escuchando",
      });
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "🎤 Reconocimiento activo",
          description: "Di 'ARCANA' seguido de tu comando",
        });
      } catch (e) {
        console.error('Error iniciando reconocimiento:', e);
        toast({
          title: "Error",
          description: "No se pudo iniciar el reconocimiento de voz",
          variant: "destructive",
        });
      }
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Button
      onClick={toggleListening}
      variant={isListening ? "destructive" : "outline"}
      size="icon"
      className={`transition-all ${isListening ? 'animate-pulse' : ''}`}
      title={isListening ? "Detener reconocimiento de voz" : "Activar reconocimiento de voz"}
    >
      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
};

import { useState, useRef } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from 'sonner';

interface VoiceMessageState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string | null;
  audioUrl: string | null;
}

/**
 * Hook para manejar grabación y transcripción de mensajes de voz
 * Integrado con edge function para STT (Speech-to-Text)
 */
export const useVoiceMessages = () => {
  const [state, setState] = useState<VoiceMessageState>({
    isRecording: false,
    isProcessing: false,
    transcript: null,
    audioUrl: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setState(prev => ({ ...prev, audioUrl, isProcessing: true }));

        // Procesar con edge function para transcripción
        await processVoiceMessage(audioBlob);
        
        // Detener el stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setState(prev => ({ ...prev, isRecording: true }));
      toast.success('🎤 Grabando mensaje de voz...');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('No se pudo acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      setState(prev => ({ ...prev, isRecording: false }));
    }
  };

  const processVoiceMessage = async (audioBlob: Blob) => {
    try {
      // Convertir audio a base64
      const reader = new FileReader();
      
      const audioBase64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.readAsDataURL(audioBlob);
      });

      // Llamar a edge function de transcripción (si existe)
      // Por ahora, simulamos la transcripción
      const transcript = await simulateSTT(audioBlob);
      
      setState(prev => ({ 
        ...prev, 
        transcript,
        isProcessing: false 
      }));

      toast.success('✅ Mensaje de voz transcrito');
      
    } catch (error) {
      console.error('Error processing voice message:', error);
      toast.error('Error al procesar el mensaje de voz');
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  };

  // Simulación de STT - En producción, usar edge function con OpenAI Whisper
  const simulateSTT = async (audioBlob: Blob): Promise<string> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('[Mensaje de voz transcrito - Integrar con Whisper API]');
      }, 1000);
    });
  };

  const resetState = () => {
    setState({
      isRecording: false,
      isProcessing: false,
      transcript: null,
      audioUrl: null
    });
  };

  return {
    ...state,
    startRecording,
    stopRecording,
    resetState
  };
};

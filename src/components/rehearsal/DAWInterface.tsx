import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, SkipBack, Mic, Volume2, VolumeX, Trash2, Upload, RotateCcw } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface Track {
  id: string;
  track_name: string;
  track_type: string;
  audio_url: string;
  user_id: string;
  is_backing_track: boolean;
  volume_level: number;
  is_muted: boolean;
  profiles: { full_name: string };
  start_offset?: number;
}

interface DAWProps {
  sessionId: string;
  tracks: Track[];
  backingTrackUrl: string | null;
  onTrackDelete: (id: string) => void;
  onTrackUpdate: (id: string, updates: Partial<Track>) => void;
  onTracksRefresh: () => void;
}

const formatTime = (s: number) => {
  if (!isFinite(s) || isNaN(s)) return "00:00";
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export default function DAWInterface({
  sessionId,
  tracks,
  backingTrackUrl,
  onTrackDelete,
  onTrackUpdate,
  onTracksRefresh,
}: DAWProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showRecordingPreview, setShowRecordingPreview] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingWavesurferRef = useRef<WaveSurfer | null>(null);
  const timerRef = useRef<number | null>(null);

  const [recordedStartOffset, setRecordedStartOffset] = useState<number>(0);

  // 🟢 Inicia grabación
  const startRecording = async () => {
    if (isRecording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setShowRecordingPreview(true);
        stream.getTracks().forEach((t) => t.stop());

        // 🎧 Visualizar forma de onda del audio grabado
        const container = document.getElementById("recording-waveform");
        if (container) {
          if (recordingWavesurferRef.current) recordingWavesurferRef.current.destroy();
          const ws = WaveSurfer.create({
            container: "#recording-waveform",
            waveColor: "hsl(var(--destructive))",
            progressColor: "hsl(var(--destructive) / 0.8)",
            cursorColor: "hsl(var(--destructive))",
            height: 100,
            backend: "WebAudio",
          });
          ws.loadBlob(blob);
          recordingWavesurferRef.current = ws;
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      timerRef.current = window.setInterval(() => setRecordingTime((t) => t + 1), 1000);
      toast({ title: "🎙️ Grabando..." });
    } catch (err) {
      toast({ title: "Error al iniciar grabación", variant: "destructive" });
      console.error(err);
    }
  };

  // 🔴 Detiene grabación
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setRecordingTime(0);
    toast({ title: "⏹️ Grabación detenida" });
  };

  // 🔄 Repetir grabación
  const discardRecording = () => {
    setRecordedBlob(null);
    setShowRecordingPreview(false);
    setRecordedStartOffset(0);
    setIsPreviewPlaying(false);
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
    recordingWavesurferRef.current?.destroy();
    recordingWavesurferRef.current = null;
    toast({ title: "Grabación descartada" });
  };

  // ▶️ Reproducir o pausar el audio grabado
  const handlePreviewPlayPause = () => {
    if (!recordedBlob) return;
    if (!previewAudioRef.current) {
      const audio = new Audio(URL.createObjectURL(recordedBlob));
      previewAudioRef.current = audio;

      audio.onended = () => setIsPreviewPlaying(false);

      audio.play();
      setIsPreviewPlaying(true);
    } else {
      const audio = previewAudioRef.current;
      if (isPreviewPlaying) {
        audio.pause();
        setIsPreviewPlaying(false);
      } else {
        audio.play();
        setIsPreviewPlaying(true);
      }
    }
  };

  // 📤 Publicar grabación
  const publishRecording = async () => {
    if (!user?.id || !recordedBlob) return;
    try {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

      const trackName = `${profile?.full_name || "Usuario"} Voz ${Date.now()}`;
      const fileName = `${sessionId}/${user.id}-${Date.now()}.webm`;

      const { error: uploadError } = await supabase.storage.from("rehearsal-tracks").upload(fileName, recordedBlob);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("rehearsal-tracks").getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("rehearsal_tracks").insert({
        session_id: sessionId,
        user_id: user.id,
        track_name: trackName,
        track_type: "voice",
        audio_url: urlData.publicUrl,
        start_offset: recordedStartOffset,
        is_backing_track: false,
        is_published: true,
      });

      if (insertError) throw insertError;

      toast({ title: "✅ Pista publicada" });
      discardRecording();
      onTracksRefresh();
    } catch (err) {
      toast({ title: "Error al publicar grabación", variant: "destructive" });
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 🎚️ Controles principales */}
      <div className="bg-card rounded-lg border p-4 flex items-center gap-4">
        {!isRecording && !showRecordingPreview && (
          <Button onClick={startRecording} variant="destructive" className="gap-2">
            <Mic /> Grabar Nueva Pista
          </Button>
        )}
        {isRecording && (
          <Button onClick={stopRecording} variant="outline" className="gap-2">
            <Square /> Detener ({formatTime(recordingTime)})
          </Button>
        )}
      </div>

      {/* 🎧 Previsualización de la grabación */}
      {showRecordingPreview && (
        <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-destructive font-semibold">📼 Grabación Lista</h3>
              <p className="text-xs text-muted-foreground">Escucha antes de publicar</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePreviewPlayPause} variant="secondary" size="sm" className="gap-1">
                {isPreviewPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPreviewPlaying ? "Pausar" : "Reproducir"}
              </Button>
              <Button onClick={discardRecording} variant="outline" size="sm">
                <RotateCcw /> Repetir
              </Button>
              <Button onClick={publishRecording} size="sm">
                <Upload /> Publicar
              </Button>
            </div>
          </div>
          <div id="recording-waveform" className="bg-card rounded" />
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  Mic,
  Volume2,
  VolumeX,
  Trash2,
} from "lucide-react";
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
  start_offset?: number; // nuevo campo
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
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
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

  // Global transport
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const recordStartTimeRef = useRef<number>(0);

  // Solo/mute
  const [soloTrack, setSoloTrack] = useState<string | null>(null);

  // Refs
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const wavesurferRefs = useRef<Record<string, WaveSurfer | null>>({});
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const LATENCY_COMPENSATION = 0.25; // 250ms de compensación estándar

  const voiceTracks = tracks.filter((t) => !t.is_backing_track);
  const allTracks = [
    ...(backingTrackUrl
      ? [
          {
            id: "backing-track",
            track_name: "Pista Base",
            track_type: "backing",
            audio_url: backingTrackUrl,
            user_id: "system",
            is_backing_track: true,
            volume_level: 1,
            is_muted: false,
            profiles: { full_name: "Sistema" },
          },
        ]
      : []),
    ...voiceTracks,
  ];

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Inicialización de WaveSurfer
  useEffect(() => {
    allTracks.forEach((track) => {
      const containerId = `waveform-${track.id}`;
      const container = document.getElementById(containerId);
      if (!container || wavesurferRefs.current[track.id]) return;

      const ws = WaveSurfer.create({
        container: `#${containerId}`,
        waveColor: "hsl(var(--muted))",
        progressColor: "hsl(var(--primary))",
        cursorColor: "hsl(var(--primary))",
        barWidth: 2,
        barRadius: 3,
        cursorWidth: 2,
        height: 80,
        barGap: 2,
        backend: "WebAudio",
        normalize: true,
        interact: true,
      });

      ws.load(track.audio_url);

      ws.on("ready", () => {
        const trackDuration = ws.getDuration();
        if (trackDuration > duration) setDuration(trackDuration);

        // Aplicar offset al cargar
        if (!track.is_backing_track && track.start_offset) {
          const offsetRatio = Math.min(
            track.start_offset / trackDuration,
            1
          );
          ws.seekTo(offsetRatio);
        }

        // Asignar audio
        const audio = ws.getMediaElement();
        if (audio && audioContextRef.current) {
          audioRefs.current[track.id] = audio;
          audio.volume = track.volume_level;
          audio.muted = track.is_muted;
        }
      });

      ws.on("interaction", () => {
        const time = ws.getCurrentTime();
        syncAllTracksTo(time);
      });

      wavesurferRefs.current[track.id] = ws;
    });

    return () => {
      Object.values(wavesurferRefs.current).forEach((ws) => ws?.destroy());
      wavesurferRefs.current = {};
    };
  }, [allTracks.length]);

  const syncAllTracksTo = (time: number) => {
    Object.values(wavesurferRefs.current).forEach((ws) => {
      if (ws) ws.seekTo(time / ws.getDuration());
    });
    setCurrentTime(time);
  };

  const handleGlobalPlay = () => {
    if (isPlaying) {
      Object.values(wavesurferRefs.current).forEach((ws) => ws?.pause());
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      Object.values(wavesurferRefs.current).forEach((ws) => ws?.play());
      setIsPlaying(true);
      updateProgress();
    }
  };

  const handleGlobalStop = () => {
    Object.values(wavesurferRefs.current).forEach((ws) => {
      ws?.stop();
      ws?.seekTo(0);
    });
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  const handleGlobalRestart = () => {
    syncAllTracksTo(0);
  };

  const updateProgress = () => {
    const firstWs = Object.values(wavesurferRefs.current)[0];
    if (firstWs) setCurrentTime(firstWs.getCurrentTime());
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  // Grabación con offset sincronizado
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 1,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      });

      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadRecording(blob, recordStartTimeRef.current);
        stream.getTracks().forEach((track) => track.stop());
      };

      // Sincronizar inicio con compensación
      recordStartTimeRef.current = Math.max(
        currentTime - LATENCY_COMPENSATION,
        0
      );

      if (!isPlaying) handleGlobalPlay();

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      timerRef.current = window.setInterval(
        () => setRecordingTime((p) => p + 1),
        1000
      );

      toast({
        title: "Grabación iniciada",
        description: "Grabando nueva pista...",
      });
    } catch (error) {
      console.error("Error al iniciar grabación:", error);
      toast({
        title: "Error",
        description: "No se pudo iniciar la grabación",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingTime(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const uploadRecording = async (blob: Blob, startOffset: number) => {
    if (!user?.id) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const userName = profile?.full_name || "Usuario";
      const userTracksCount = voiceTracks.filter(
        (t) => t.user_id === user.id
      ).length;
      const trackNumber = userTracksCount + 1;
      const autoTrackName = `${userName} Voz ${trackNumber}`;

      const fileName = `${sessionId}/${user.id}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("rehearsal-tracks")
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("rehearsal-tracks")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase
        .from("rehearsal_tracks")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          track_name: autoTrackName,
          track_type: "voice",
          audio_url: urlData.publicUrl,
          is_backing_track: false,
          start_offset: startOffset, // guardar offset en segundos
        });

      if (insertError) throw insertError;

      toast({ title: "Éxito", description: "Pista grabada y guardada" });
      onTracksRefresh();
    } catch (error) {
      console.error("Error al subir grabación:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la grabación",
        variant: "destructive",
      });
    }
  };

  const handleMuteToggle = (track: Track) => {
    const audio = audioRefs.current[track.id];
    if (audio) audio.muted = !track.is_muted;
    onTrackUpdate(track.id, { is_muted: !track.is_muted });
  };

  const handleSoloToggle = (trackId: string) => {
    if (soloTrack === trackId) {
      setSoloTrack(null);
      allTracks.forEach((t) => {
        const audio = audioRefs.current[t.id];
        if (audio) audio.muted = t.is_muted;
      });
    } else {
      setSoloTrack(trackId);
      allTracks.forEach((t) => {
        const audio = audioRefs.current[t.id];
        if (audio) audio.muted = t.id !== trackId;
      });
    }
  };

  const handleVolumeChange = (track: Track, value: number[]) => {
    const audio = audioRefs.current[track.id];
    if (audio) audio.volume = value[0];
    onTrackUpdate(track.id, { volume_level: value[0] });
  };

  return (
    <div className="space-y-6">
      {/* Controles globales */}
      <div className="bg-card rounded-lg border p-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="icon" onClick={handleGlobalRestart}>
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            variant={isPlaying ? "secondary" : "default"}
            size="icon"
            onClick={handleGlobalPlay}
            className="h-12 w-12 rounded-full"
          >
            {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
          </Button>

          <Button variant="ghost" size="icon" onClick={handleGlobalStop}>
            <Square className="h-5 w-5" />
          </Button>

          <div className="text-sm font-mono ml-4">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>

          <div className="flex-1" />

          {!isRecording ? (
            <Button onClick={startRecording} variant="destructive" className="gap-2">
              <Mic className="h-4 w-4" />
              Grabar Nueva Pista
            </Button>
          ) : (
            <Button onClick={stopRecording} variant="outline" className="gap-2">
              <Square className="h-4 w-4" />
              Detener Grabación ({formatTime(recordingTime)})
            </Button>
          )}
        </div>

        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute h-full bg-primary transition-all duration-100"
            style={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Lista de pistas */}
      <div className="space-y-4">
        {allTracks.map((track) => (
          <div key={track.id} className="bg-card rounded-lg border p-4">
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-base">{track.track_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {track.profiles.full_name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleMuteToggle(track)}
                >
                  {track.is_muted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant={soloTrack === track.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleSoloToggle(track.id)}
                >
                  S
                </Button>
                {!track.is_backing_track && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onTrackDelete(track.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div id={`waveform-${track.id}`} className="mb-3" />

            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={[track.volume_level]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(value) => handleVolumeChange(track, value)}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-12 text-right">
                {Math.round(track.volume_level * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
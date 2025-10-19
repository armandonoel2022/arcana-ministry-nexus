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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedStartOffset, setRecordedStartOffset] = useState<number>(0);
  const [showRecordingPreview, setShowRecordingPreview] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingWavesurferRef = useRef<WaveSurfer | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  const [soloTrack, setSoloTrack] = useState<string | null>(null);

  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const wavesurferRefs = useRef<Record<string, WaveSurfer | null>>({});
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const LATENCY_COMPENSATION = 0.25;

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
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      recordingWavesurferRef.current?.destroy();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      audioContextRef.current?.close();
    };
  }, []);

  // 🎧 Inicialización de WaveSurfer
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
        backend: "MediaElement",
        normalize: true,
        interact: true,
      });

      ws.load(track.audio_url);

      ws.once("ready", () => {
        const trackDuration = ws.getDuration();
        // La duración total debe ser la de la pista backing
        if (track.is_backing_track && trackDuration > duration) {
          setDuration(trackDuration);
        } else if (!track.is_backing_track) {
          // Para pistas de voz, verificar que no excedan la duración total
          const endTime = (track.start_offset || 0) + trackDuration;
          if (endTime > duration) setDuration(endTime);
        }

        const audio = ws.getMediaElement()!;
        audioRefs.current[track.id] = audio;
        audio.volume = track.volume_level;
        audio.muted = track.is_muted;
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

  const syncAllTracksTo = (globalTime: number) => {
    allTracks.forEach((track) => {
      const ws = wavesurferRefs.current[track.id];
      const audio = audioRefs.current[track.id];
      if (!ws || !audio) return;
      
      if (track.is_backing_track) {
        const seekPosition = Math.min(Math.max(globalTime / ws.getDuration(), 0), 1);
        ws.seekTo(seekPosition);
        audio.currentTime = globalTime;
      } else {
        const offset = track.start_offset || 0;
        const localTime = globalTime - offset;
        if (localTime >= 0 && localTime <= ws.getDuration()) {
          const seekPosition = Math.min(Math.max(localTime / ws.getDuration(), 0), 1);
          ws.seekTo(seekPosition);
          audio.currentTime = localTime;
        } else if (localTime < 0) {
          ws.seekTo(0);
          audio.currentTime = 0;
        }
      }
    });
    setCurrentTime(globalTime);
  };

  const handleGlobalPlay = () => {
    if (isPlaying) {
      allTracks.forEach((track) => {
        const audio = audioRefs.current[track.id];
        if (audio) audio.pause();
      });
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      const startTime = Date.now();
      const startGlobalTime = currentTime;
      
      // Primero sincronizar todas las pistas al tiempo actual
      syncAllTracksTo(currentTime);
      
      // Luego reproducir todas las pistas que deberían estar activas
      allTracks.forEach((track) => {
        const audio = audioRefs.current[track.id];
        if (!audio) return;

        if (track.is_backing_track) {
          audio.play().catch(e => console.error("Error playing backing track:", e));
        } else {
          const offset = track.start_offset || 0;
          const localTime = currentTime - offset;
          
          if (localTime >= 0) {
            // La pista ya debería estar sonando
            audio.play().catch(e => console.error("Error playing voice track:", e));
          } else {
            // La pista debe empezar después
            const delayMs = Math.abs(localTime) * 1000;
            setTimeout(() => {
              if (isPlaying) {
                audio.currentTime = 0;
                audio.play().catch(e => console.error("Error playing delayed track:", e));
              }
            }, delayMs);
          }
        }
      });
      
      setIsPlaying(true);
      updateProgress();
    }
  };

  const handleGlobalStop = () => {
    allTracks.forEach((track) => {
      const audio = audioRefs.current[track.id];
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    syncAllTracksTo(0);
  };

  const handleGlobalRestart = () => {
    syncAllTracksTo(0);
  };

  const updateProgress = () => {
    const backingAudio = audioRefs.current["backing-track"];
    if (backingAudio && !isNaN(backingAudio.currentTime) && isFinite(backingAudio.currentTime)) {
      const newTime = backingAudio.currentTime;
      setCurrentTime(newTime);
      
      // Sincronizar visualmente todas las pistas
      allTracks.forEach((track) => {
        const ws = wavesurferRefs.current[track.id];
        if (!ws) return;
        
        if (track.is_backing_track) {
          const progress = newTime / ws.getDuration();
          if (isFinite(progress)) {
            ws.seekTo(progress);
          }
        } else {
          const offset = track.start_offset || 0;
          const localTime = newTime - offset;
          if (localTime >= 0 && localTime <= ws.getDuration()) {
            const progress = localTime / ws.getDuration();
            if (isFinite(progress)) {
              ws.seekTo(progress);
            }
          }
        }
      });
      
      // Detener reproducción si llegamos al final
      if (newTime >= duration) {
        handleGlobalStop();
      }
    }
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  // 🟥 Grabación
  const startRecording = async () => {
    if (isRecording) {
      toast({ title: "Ya estás grabando", variant: "destructive" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setShowRecordingPreview(true);

        const container = document.getElementById("recording-waveform");
        if (container) {
          if (recordingWavesurferRef.current) {
            recordingWavesurferRef.current.destroy();
          }
          const ws = WaveSurfer.create({
            container: "#recording-waveform",
            waveColor: "hsl(var(--destructive))",
            progressColor: "hsl(var(--destructive) / 0.8)",
            cursorColor: "hsl(var(--destructive))",
            height: 100,
            backend: "MediaElement",
          });
          recordingWavesurferRef.current = ws;
          ws.loadBlob(blob);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      const startOffset = Math.max(currentTime - LATENCY_COMPENSATION, 0);
      setRecordedStartOffset(startOffset);

      if (!isPlaying) handleGlobalPlay();

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      timerRef.current = window.setInterval(() => setRecordingTime((t) => t + 1), 1000);

      toast({ title: "🎙️ Grabando..." });
    } catch (error) {
      toast({ title: "Error al grabar", variant: "destructive" });
      console.error(error);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    setRecordingTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    handleGlobalStop();
    toast({ title: "⏹️ Grabación detenida" });
  };

  const discardRecording = () => {
    setRecordedBlob(null);
    setShowRecordingPreview(false);
    setRecordedStartOffset(0);
    recordingWavesurferRef.current?.destroy();
    recordingWavesurferRef.current = null;
    toast({ title: "Grabación descartada" });
  };

  const publishRecording = async () => {
    if (!user?.id || !recordedBlob) return;
    try {
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

      const userName = profile?.full_name || "Usuario";
      const userTracksCount = voiceTracks.filter((t) => t.user_id === user.id).length;
      const trackName = `${userName} Voz ${userTracksCount + 1}`;

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
        is_published: true, // Publicar inmediatamente
      });
      if (insertError) throw insertError;

      toast({ title: "✅ Pista publicada" });
      setRecordedBlob(null);
      setShowRecordingPreview(false);
      recordingWavesurferRef.current?.destroy();
      onTracksRefresh();
    } catch (e) {
      console.error(e);
      toast({ title: "Error al publicar", variant: "destructive" });
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
    if (audio) {
      audio.volume = value[0];
    }
    // Actualizar en Supabase para todas las pistas (excepto backing-track que se maneja en el padre)
    onTrackUpdate(track.id, { volume_level: value[0] });
  };

  const handleExportMix = async () => {
    if (allTracks.length === 0) return;
    
    toast({ title: "🎵 Preparando mezcla..." });
    
    try {
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();
      
      const sources = await Promise.all(
        allTracks.map(async (track) => {
          const response = await fetch(track.audio_url);
          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
          
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          
          const gainNode = audioContext.createGain();
          gainNode.gain.value = track.is_muted ? 0 : track.volume_level;
          
          source.connect(gainNode);
          gainNode.connect(destination);
          
          return { source, offset: track.is_backing_track ? 0 : (track.start_offset || 0) };
        })
      );
      
      const mediaRecorder = new MediaRecorder(destination.stream);
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `mezcla-${sessionId}-${Date.now()}.webm`;
        a.click();
        toast({ title: "✅ Mezcla exportada" });
      };
      
      mediaRecorder.start();
      sources.forEach(({ source, offset }) => source.start(audioContext.currentTime + offset));
      
      setTimeout(() => {
        mediaRecorder.stop();
        sources.forEach(({ source }) => source.stop());
        audioContext.close();
      }, duration * 1000);
      
    } catch (error) {
      console.error(error);
      toast({ title: "Error al exportar", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* 🎚️ Transporte Global */}
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
            {isPlaying ? <Pause /> : <Play />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleGlobalStop}>
            <Square />
          </Button>
          <div className="ml-4 font-mono text-sm">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          <div className="flex-1" />
          {!isRecording && !showRecordingPreview ? (
            <>
              <Button onClick={handleExportMix} variant="outline" className="gap-2" disabled={allTracks.length === 0}>
                <Upload /> Exportar Mezcla
              </Button>
              <Button onClick={startRecording} variant="destructive" className="gap-2">
                <Mic /> Grabar Nueva Pista
              </Button>
            </>
          ) : isRecording ? (
            <Button onClick={stopRecording} variant="outline">
              <Square /> Detener ({formatTime(recordingTime)})
            </Button>
          ) : null}
        </div>
        <div className="relative h-2 bg-muted rounded">
          <div
            className="absolute h-full bg-primary"
            style={{
              width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      {/* Preview de grabación */}
      {showRecordingPreview && (
        <div className="bg-destructive/10 border-2 border-destructive rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-destructive font-semibold">📼 Grabación Lista</h3>
              <p className="text-xs text-muted-foreground">Revisa antes de publicar</p>
            </div>
            <div className="flex gap-2">
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

      {/* Lista de pistas */}
      {allTracks.map((track) => {
        // Calcular el ancho y posición para visualización alineada
        const startPercent = track.is_backing_track ? 0 : ((track.start_offset || 0) / duration) * 100;
        const trackDuration = wavesurferRefs.current[track.id]?.getDuration() || 0;
        const widthPercent = duration > 0 ? (trackDuration / duration) * 100 : 100;
        
        return (
          <div key={track.id} className="bg-card border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-semibold">{track.track_name}</h3>
                <p className="text-xs text-muted-foreground">{track.profiles.full_name}</p>
                {!track.is_backing_track && track.start_offset && (
                  <p className="text-xs text-muted-foreground">Offset: {track.start_offset.toFixed(2)}s</p>
                )}
              </div>
              <div className="flex gap-2 items-center">
                <Button variant="ghost" size="icon" onClick={() => handleMuteToggle(track)}>
                  {track.is_muted ? <VolumeX /> : <Volume2 />}
                </Button>
                <Button
                  variant={soloTrack === track.id ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => handleSoloToggle(track.id)}
                >
                  S
                </Button>
                {!track.is_backing_track && (
                  <Button variant="ghost" size="icon" onClick={() => onTrackDelete(track.id)}>
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Contenedor con timeline visual */}
            <div className="mb-3 relative h-20 bg-muted/20 rounded overflow-hidden">
              <div 
                id={`waveform-${track.id}`}
                className="absolute h-full"
                style={{
                  left: `${startPercent}%`,
                  width: track.is_backing_track ? '100%' : `${widthPercent}%`,
                }}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <Volume2 className="text-muted-foreground" />
              <Slider
                value={[track.volume_level]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => handleVolumeChange(track, v)}
                className="flex-1"
              />
              <span className="text-xs w-12 text-right">{Math.round(track.volume_level * 100)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

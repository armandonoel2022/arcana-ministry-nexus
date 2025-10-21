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
  const [backingTrackVolume, setBackingTrackVolume] = useState(1);
  const [backingTrackMuted, setBackingTrackMuted] = useState(false);
  const [draggingTrack, setDraggingTrack] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartOffset, setDragStartOffset] = useState(0);
  const [tempOffsets, setTempOffsets] = useState<Record<string, number>>({});
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [precisionSync, setPrecisionSync] = useState(true);
  
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
  const wavesurferRefs = useRef<Record<string, WaveSurfer | null>>({});
  const animationRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // MediaElement filter chain (existing)
  const audioNodesRef = useRef<Record<string, { source: MediaElementAudioSourceNode; filters: BiquadFilterNode[] }>>({});
  
  // WebAudio precision playback refs
  const buffersRef = useRef<Record<string, AudioBuffer | null>>({});
  const bufferNodesRef = useRef<Record<string, { gain: GainNode; filters: BiquadFilterNode[] }>>({});
  const sourcesRef = useRef<Record<string, AudioBufferSourceNode | null>>({});
  const masterStartRef = useRef<number | null>(null);
  const startAtGlobalRef = useRef<number>(0);
  
  const LATENCY_COMPENSATION = 0.25; // for recording alignment
  const LOOKAHEAD = 0.2; // schedule ahead for stable sync

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
            volume_level: backingTrackVolume,
            is_muted: backingTrackMuted,
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
      Object.values(audioNodesRef.current).forEach(({ source }) => source.disconnect());
      audioContextRef.current?.close();
    };
  }, []);

  // Aplicar filtros de audio para reducción de ruido
  const applyAudioFilters = (audio: HTMLAudioElement, trackId: string) => {
    if (!audioContextRef.current || audioNodesRef.current[trackId]) return;

    const ctx = audioContextRef.current;
    const source = ctx.createMediaElementSource(audio);
    
    // High-pass filter para eliminar ruido de baja frecuencia
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = noiseReduction ? 80 : 20;
    
    // Low-pass filter para eliminar ruido de alta frecuencia
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = noiseReduction ? 12000 : 20000;
    
    // Conectar la cadena de audio
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(ctx.destination);
    
    audioNodesRef.current[trackId] = { source, filters: [highpass, lowpass] };
  };

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
        backend: "WebAudio",
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
      });

      ws.on("interaction", () => {
        // Cuando el usuario hace clic en una forma de onda, pausar y sincronizar
        if (isPlaying) {
          stopAllScheduled();
          setIsPlaying(false);
          if (animationRef.current) cancelAnimationFrame(animationRef.current);
        }
        
        const clickedTime = ws.getCurrentTime();
        let globalTime;
        
        if (track.is_backing_track) {
          globalTime = clickedTime;
        } else {
          // Convertir tiempo local a tiempo global
          const offset = track.start_offset || 0;
          globalTime = clickedTime + offset;
        }
        
        setCurrentTime(globalTime);
        syncAllTracksTo(globalTime);
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
      if (!ws) return;
      
      if (track.is_backing_track) {
        const seekPosition = Math.min(Math.max(globalTime / ws.getDuration(), 0), 1);
        ws.seekTo(seekPosition);
      } else {
        const offset = tempOffsets[track.id] ?? track.start_offset ?? 0;
        const localTime = globalTime - offset;
        if (localTime >= 0 && localTime <= ws.getDuration()) {
          const seekPosition = Math.min(Math.max(localTime / ws.getDuration(), 0), 1);
          ws.seekTo(seekPosition);
        } else if (localTime < 0) {
          ws.seekTo(0);
        }
      }
    });
    setCurrentTime(globalTime);
  };

  // Helper: effective offset (temporal durante arrastre o persistido)
  const getEffectiveOffset = (track: Track) => (tempOffsets[track.id] ?? track.start_offset ?? 0);

  const stopAllScheduled = () => {
    Object.keys(sourcesRef.current).forEach((id) => {
      try { sourcesRef.current[id]?.stop(); } catch {}
      sourcesRef.current[id] = null;
    });
    masterStartRef.current = null;
  };

  const loadAllBuffers = async () => {
    if (!audioContextRef.current) return;
    for (const track of allTracks) {
      if (!buffersRef.current[track.id]) {
        try {
          const res = await fetch(track.audio_url);
          const ab = await res.arrayBuffer();
          const buf = await audioContextRef.current.decodeAudioData(ab);
          buffersRef.current[track.id] = buf;
        } catch (e) {
          console.warn("No se pudo decodificar buffer:", track.track_name, e);
        }
      }
    }
  };

  const schedulePrecisionPlayback = async () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;

    // Asegurar buffers cargados
    const pending = allTracks.some(t => !buffersRef.current[t.id]);
    if (pending) {
      toast({ title: "Cargando pistas…", description: "Preparando sincronización precisa" });
      await loadAllBuffers();
    }

    const globalStart = ctx.currentTime + LOOKAHEAD;
    masterStartRef.current = globalStart;
    startAtGlobalRef.current = currentTime;

    allTracks.forEach((track) => {
      const buffer = buffersRef.current[track.id];
      if (!buffer) return;

      // Crear cadena de salida (gain + filtros si aplica)
      let chain = bufferNodesRef.current[track.id];
      if (!chain) {
        const gain = ctx.createGain();
        gain.connect(ctx.destination);
        const filters: BiquadFilterNode[] = [];
        if (!track.is_backing_track) {
          const highpass = ctx.createBiquadFilter();
          highpass.type = "highpass";
          highpass.frequency.value = noiseReduction ? 80 : 20;
          const lowpass = ctx.createBiquadFilter();
          lowpass.type = "lowpass";
          lowpass.frequency.value = noiseReduction ? 12000 : 20000;
          chain = { gain, filters: [highpass, lowpass] };
        } else {
          chain = { gain, filters: [] };
        }
        bufferNodesRef.current[track.id] = chain;
      } else {
        // Actualizar parámetros de filtros si existen
        if (chain.filters[0]) chain.filters[0].frequency.value = noiseReduction ? 80 : 20;
        if (chain.filters[1]) chain.filters[1].frequency.value = noiseReduction ? 12000 : 20000;
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      // Conectar source -> filtros -> gain -> destino
      if (chain.filters.length) {
        source.connect(chain.filters[0]);
        chain.filters[0].connect(chain.filters[1]);
        chain.filters[1].connect(chain.gain);
      } else {
        source.connect(chain.gain);
      }

      chain.gain.gain.value = track.is_muted ? 0 : track.volume_level;

      const offset = getEffectiveOffset(track);
      const localTime = track.is_backing_track ? currentTime : currentTime - offset;

      let when = globalStart;
      let startOffset = Math.max(localTime, 0);

      if (!track.is_backing_track && localTime < 0) {
        when = globalStart + (-localTime);
        startOffset = 0;
      }

      try {
        source.start(when, startOffset);
        sourcesRef.current[track.id] = source;
      } catch (e) {
        console.error("Error al iniciar fuente:", e);
      }
    });
  };

  const handleGlobalPlay = async () => {
    if (isPlaying) {
      // Pausa/Detener reproducción
      stopAllScheduled();
      setIsPlaying(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      // Iniciar reproducción con sincronización precisa
      await schedulePrecisionPlayback();
      setIsPlaying(true);
      updateProgress();
    }
  };

  const handleGlobalStop = () => {
    stopAllScheduled();
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    syncAllTracksTo(0);
  };

  const handleGlobalRestart = () => {
    syncAllTracksTo(0);
  };

  const updateProgress = () => {
    if (masterStartRef.current !== null && audioContextRef.current) {
      const elapsed = Math.max(0, audioContextRef.current.currentTime - masterStartRef.current);
      const newTime = startAtGlobalRef.current + elapsed;
      setCurrentTime(Math.min(newTime, duration));
      
      // Sincronizar cursores visuales de WaveSurfer
      allTracks.forEach((track) => {
        const ws = wavesurferRefs.current[track.id];
        if (ws) {
          const offset = getEffectiveOffset(track);
          const localTime = track.is_backing_track ? newTime : Math.max(newTime - offset, 0);
          const pos = localTime / ws.getDuration();
          ws.seekTo(Math.min(Math.max(pos, 0), 1));
        }
      });
      
      if (newTime >= duration) {
        handleGlobalStop();
      }
    }
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  // 🟥 Grabación con medición de latencia real
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
            backend: "WebAudio",
          });
          recordingWavesurferRef.current = ws;
          ws.loadBlob(blob);
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      const ctx = audioContextRef.current!;
      const globalNow = ctx.currentTime;

      // 🔹 Iniciar playback bajo control preciso
      if (!isPlaying) await schedulePrecisionPlayback();

      // 🔹 Marca el tiempo real de inicio de grabación
      const recordStartCtxTime = ctx.currentTime;

      // 🔹 Iniciar grabación inmediatamente después
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      
      if (!isPlaying) {
        setIsPlaying(true);
        updateProgress();
      }

      // Calcular latencia real en segundos
      const latency = recordStartCtxTime - globalNow;
      const realStartOffset = currentTime + latency;
      setRecordedStartOffset(realStartOffset);
      setIsRecording(true);

      timerRef.current = window.setInterval(() => setRecordingTime((t) => t + 1), 1000);

      toast({ 
        title: "🎙️ Grabando...", 
        description: `Latencia compensada: ${(latency * 1000).toFixed(0)}ms` 
      });
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
    const newMuted = !track.is_muted;
    
    // Actualizar el gain node si está en reproducción
    if (bufferNodesRef.current[track.id]) {
      bufferNodesRef.current[track.id].gain.gain.value = newMuted ? 0 : track.volume_level;
    }
    
    if (track.id === "backing-track") {
      setBackingTrackMuted(newMuted);
    } else {
      onTrackUpdate(track.id, { is_muted: newMuted });
    }
  };

  const handleSoloToggle = (trackId: string) => {
    if (soloTrack === trackId) {
      setSoloTrack(null);
      allTracks.forEach((t) => {
        if (bufferNodesRef.current[t.id]) {
          bufferNodesRef.current[t.id].gain.gain.value = t.is_muted ? 0 : t.volume_level;
        }
      });
    } else {
      setSoloTrack(trackId);
      allTracks.forEach((t) => {
        if (bufferNodesRef.current[t.id]) {
          bufferNodesRef.current[t.id].gain.gain.value = t.id === trackId ? t.volume_level : 0;
        }
      });
    }
  };

  const handleVolumeChange = (track: Track, value: number[]) => {
    // Actualizar el gain node si está en reproducción
    if (bufferNodesRef.current[track.id]) {
      bufferNodesRef.current[track.id].gain.gain.value = track.is_muted ? 0 : value[0];
    }
    
    if (track.id === "backing-track") {
      setBackingTrackVolume(value[0]);
    } else {
      onTrackUpdate(track.id, { volume_level: value[0] });
    }
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
          
          // Usar el offset real (persistido) en lugar de temporal
          const realOffset = track.start_offset || 0;
          return { source, offset: track.is_backing_track ? 0 : realOffset };
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

  const handleDragStart = (e: React.MouseEvent, track: Track) => {
    if (track.is_backing_track) return;
    e.preventDefault();
    setDraggingTrack(track.id);
    setDragStartX(e.clientX);
    setDragStartOffset(track.start_offset || 0);
  };

  const handleDragMove = (e: React.MouseEvent) => {
    if (!draggingTrack || !duration) return;
    
    const container = document.getElementById(`track-container-${draggingTrack}`);
    if (!container) return;
    
    const containerWidth = container.offsetWidth;
    const deltaX = e.clientX - dragStartX;
    const deltaTime = (deltaX / containerWidth) * duration;
    const newOffset = Math.max(0, Math.min(duration, dragStartOffset + deltaTime));
    
    // Actualizar solo el estado temporal, sin refrescar componentes
    setTempOffsets(prev => ({ ...prev, [draggingTrack]: newOffset }));
  };

  const handleDragEnd = async () => {
    if (!draggingTrack || !duration) return;
    
    const newOffset = tempOffsets[draggingTrack];
    if (newOffset === undefined) {
      setDraggingTrack(null);
      return;
    }
    
    // Guardar en la base de datos sin refrescar todas las pistas
    try {
      const { error } = await supabase
        .from("rehearsal_tracks")
        .update({ start_offset: newOffset })
        .eq("id", draggingTrack);
      
      if (error) throw error;
      
      // Actualizar solo esta pista sin refrescar
      onTrackUpdate(draggingTrack, { start_offset: newOffset });
      toast({ title: "✅ Pista reposicionada" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error al reposicionar", variant: "destructive" });
    }
    
    setDraggingTrack(null);
    setTempOffsets(prev => {
      const next = { ...prev };
      delete next[draggingTrack];
      return next;
    });
  };

  return (
    <div 
      className="space-y-6"
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
    >
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
          <div className="flex items-center gap-2 mr-4">
            <label className="text-xs flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={noiseReduction}
                onChange={(e) => setNoiseReduction(e.target.checked)}
                className="rounded"
              />
              Reducción de Ruido
            </label>
          </div>
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
        // Usar offset temporal durante arrastre, sino el offset real
        const currentOffset = tempOffsets[track.id] ?? track.start_offset ?? 0;
        const startPercent = track.is_backing_track ? 0 : (currentOffset / duration) * 100;
        const trackDuration = wavesurferRefs.current[track.id]?.getDuration() || 0;
        const widthPercent = duration > 0 ? (trackDuration / duration) * 100 : 100;
        
        return (
          <div key={track.id} className="bg-card border rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="font-semibold">{track.track_name}</h3>
                <p className="text-xs text-muted-foreground">{track.profiles.full_name}</p>
                {!track.is_backing_track && (
                  <p className="text-xs text-muted-foreground">
                    Offset: {(tempOffsets[track.id] ?? track.start_offset ?? 0).toFixed(2)}s
                    <span className="ml-2 text-xs opacity-50">🔄 Arrastra para ajustar</span>
                  </p>
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
            <div 
              id={`track-container-${track.id}`}
              className="mb-3 relative h-20 bg-muted/20 rounded overflow-visible"
            >
              <div 
                className={`absolute h-full ${!track.is_backing_track ? 'cursor-move hover:opacity-80 transition-opacity' : ''}`}
                style={{
                  left: `${startPercent}%`,
                  width: track.is_backing_track ? '100%' : `${widthPercent}%`,
                }}
                onMouseDown={(e) => !track.is_backing_track && handleDragStart(e, track)}
              >
                <div 
                  id={`waveform-${track.id}`}
                  className="w-full h-full"
                />
              </div>
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

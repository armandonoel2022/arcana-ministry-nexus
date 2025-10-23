import React, { useState, useRef, useEffect } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface Track {
  id: string;
  name: string;
  audio_url: string;
  volume_level: number;
  is_muted: boolean;
  is_backing_track: boolean;
  start_offset: number;
}

interface DAWInterfaceProps {
  tracks: Track[];
  onPublish: (file: Blob) => Promise<void>;
}

const DAWInterface_enhanced: React.FC<DAWInterfaceProps> = ({ tracks, onPublish }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isReadyToPublish, setIsReadyToPublish] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const wsRefs = useRef<{ [key: string]: WaveSurfer }>({});
  const containerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // === INIT WAVESURFER ===
  useEffect(() => {
    tracks.forEach((track) => {
      const containerId = `waveform-${track.id}`;
      if (!containerRefs.current[track.id]) {
        containerRefs.current[track.id] = document.getElementById(containerId);
      }

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
        backend: "MediaElement", // 🔸 Cambiado a MediaElement
        normalize: true,
        interact: true,
      });

      ws.load(track.audio_url);
      ws.once("ready", () => {
        const mediaEl = ws.getMediaElement();
        if (mediaEl) {
          mediaEl.volume = track.volume_level;
          mediaEl.muted = track.is_muted;
        }
      });

      wsRefs.current[track.id] = ws;
    });

    return () => {
      Object.values(wsRefs.current).forEach((ws) => ws.destroy());
    };
  }, [tracks]);

  // === GLOBAL TRANSPORT ===
  const handlePlayPause = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      Object.values(wsRefs.current).forEach((ws) => {
        if (next) ws.play();
        else ws.pause();
      });
      return next;
    });
  };

  const handleStopAll = () => {
    setIsPlaying(false);
    Object.values(wsRefs.current).forEach((ws) => {
      ws.pause();
      ws.seekTo(0);
    });
  };

  // === RECORDING ===
  const handleRecord = async () => {
    if (isRecording) {
      // 🔸 Detener grabación
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);

      const dest = audioContextRef.current.createMediaStreamDestination();
      source.connect(dest);

      // Grabar
      const mediaRecorder = new MediaRecorder(dest.stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setRecordedBlob(blob);
        setIsReadyToPublish(true); // ✅ Activa botón "Publicar"
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error al iniciar grabación:", err);
    }
  };

  // === PUBLISH ===
  const handlePublish = async () => {
    if (!recordedBlob) return;
    try {
      await onPublish(recordedBlob);
      setIsReadyToPublish(false);
      setRecordedBlob(null);
      alert("🎶 Grabación publicada correctamente.");
    } catch (err) {
      console.error("Error al publicar:", err);
      alert("⚠️ No se pudo publicar la grabación.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-2">
          <div className="flex gap-2 justify-center items-center">
            <Button onClick={handlePlayPause}>{isPlaying ? "⏸️ Pausar" : "▶️ Reproducir"}</Button>
            <Button onClick={handleStopAll}>⏹️ Detener</Button>
            <Button variant={isRecording ? "destructive" : "default"} onClick={handleRecord}>
              {isRecording ? "🟥 Detener Grabación" : "🎙️ Grabar"}
            </Button>
            <Button onClick={handlePublish} disabled={!isReadyToPublish} variant="secondary">
              <Upload className="mr-2 h-4 w-4" /> Publicar
            </Button>
          </div>
        </CardContent>
      </Card>

      {tracks.map((track) => (
        <Card key={track.id}>
          <CardContent>
            <p className="font-semibold mb-2">{track.name}</p>
            <div id={`waveform-${track.id}`} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DAWInterface_enhanced;

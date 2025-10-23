import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mic, StopCircle, Upload, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface Track {
  id: string;
  url: string;
  name: string;
  created_at?: string;
}

export default function DAWInterface() {
  const [isRecording, setIsRecording] = useState(false);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [level, setLevel] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  // === LOAD EXISTING TRACKS ===
  useEffect(() => {
    const fetchTracks = async () => {
      const { data, error } = await supabase
        .from("rehearsal_tracks")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data) {
        setTracks(
          data.map((t) => ({
            id: t.id,
            url: t.audio_url,
            name: t.name || "Pista sin nombre",
          })),
        );
      }
    };
    fetchTracks();
  }, []);

  // === START RECORDING ===
  const startRecording = async () => {
    setRecordedBlob(null);
    setIsRecording(true);
    setLoading(true);

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    // 🔊 Audio meter setup
    audioContextRef.current = new AudioContext();
    const source = audioContextRef.current.createMediaStreamSource(stream);
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
    source.connect(analyserRef.current);

    const updateLevel = () => {
      if (analyserRef.current && dataArrayRef.current) {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const avg = dataArrayRef.current.reduce((a, b) => a + b) / dataArrayRef.current.length;
        setLevel(avg);
        if (isRecording) requestAnimationFrame(updateLevel);
      }
    };
    updateLevel();

    recorder.ondataavailable = (e) => chunks.push(e.data);

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setRecordedBlob(blob);
      await publishRecording(blob); // ✅ Auto-publicar al detener
      stream.getTracks().forEach((t) => t.stop());
      setIsRecording(false);
      setLoading(false);
    };

    recorder.start();
    setMediaRecorder(recorder);
  };

  // === STOP RECORDING ===
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      setLoading(true);
      mediaRecorder.stop();
    }
  };

  // === AUTO-PUBLISH ===
  const publishRecording = async (blob: Blob) => {
    if (!blob) return;
    setUploading(true);

    const fileName = `recording_${Date.now()}.webm`;
    const { data, error } = await supabase.storage.from("recordings").upload(fileName, blob, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      console.error("Upload error:", error);
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from("recordings").getPublicUrl(fileName);
    await supabase.from("rehearsal_tracks").insert({
      name: `Nueva grabación ${new Date().toLocaleTimeString()}`,
      audio_url: publicUrl.publicUrl,
    });

    setTracks((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        url: publicUrl.publicUrl,
        name: `Nueva grabación ${new Date().toLocaleTimeString()}`,
      },
    ]);

    setUploading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-black flex flex-col items-center justify-center text-white p-6">
      <Card className="bg-white/10 backdrop-blur-lg p-8 rounded-3xl border border-white/20 max-w-2xl w-full shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-8">🎙️ Estudio de Grabación ARCANA</h1>

        {/* Visual de micrófono y onda circular */}
        <div className="relative flex flex-col items-center justify-center mb-8">
          <motion.div
            className="w-48 h-48 rounded-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 shadow-lg"
            animate={isRecording ? { scale: [1, 1.15, 1], opacity: [1, 0.8, 1] } : { scale: 1 }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Mic className="w-16 h-16 text-white" />
            <motion.div
              className="absolute w-48 h-48 rounded-full border-4 border-purple-300/40"
              animate={isRecording ? { scale: [1, 1.3, 1], opacity: [0.7, 0, 0.7] } : { opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>

          {isRecording && (
            <div className="mt-6 text-center">
              <p className="text-sm text-purple-300 mb-2">Grabando...</p>
              <div className="w-64 bg-purple-800 h-3 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-purple-400"
                  style={{ width: `${Math.min(level, 100)}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Botones de control */}
        <div className="flex justify-center gap-6 mb-8">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 text-lg rounded-full"
            >
              <Mic className="w-5 h-5 mr-2" /> Grabar
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 text-lg rounded-full"
            >
              <StopCircle className="w-5 h-5 mr-2" /> Detener
            </Button>
          )}
        </div>

        {/* Estado */}
        {uploading && (
          <p className="text-center text-yellow-300 animate-pulse mb-4">⏳ Publicando pista automáticamente...</p>
        )}
        {loading && !uploading && <p className="text-center text-gray-400 mb-4">Procesando audio...</p>}

        {/* Lista de pistas */}
        <div className="space-y-4">
          {tracks.map((track) => (
            <div key={track.id} className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4">
              <Volume2 className="text-purple-400 w-6 h-6" />
              <div className="flex-1">
                <p className="font-medium">{track.name}</p>
                <audio controls src={track.url} className="w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Mic, StopCircle, UploadCloud } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { Track } from "@/types/Track";

const supabase = createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_KEY!);

export default function DAWInterface({ onPublish }: { onPublish: (track: Track) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isReadyToPublish, setIsReadyToPublish] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);
  const micRef = useRef<HTMLDivElement>(null);

  const [volume, setVolume] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let analyser: AnalyserNode;
    let dataArray: Uint8Array;
    let audioCtx: AudioContext;
    let source: MediaStreamAudioSourceNode;

    if (isRecording) {
      navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        audioCtx = new AudioContext();
        analyser = audioCtx.createAnalyser();
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length / 255;
          setVolume(avg);
          animationFrame = requestAnimationFrame(updateVolume);
        };

        updateVolume();
      });
    }

    return () => {
      cancelAnimationFrame(animationFrame);
      audioCtx?.close();
    };
  }, [isRecording]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: BlobPart[] = [];

    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setRecordedBlob(blob);
      setIsReadyToPublish(true);
    };

    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handlePublish = async () => {
    if (!recordedBlob) return;

    setUploading(true);
    const fileName = `track-${Date.now()}.webm`;

    const { data, error } = await supabase.storage.from("rehearsal-tracks").upload(fileName, recordedBlob, {
      contentType: "audio/webm",
    });

    if (error) {
      console.error("Error al subir:", error.message);
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from("rehearsal-tracks").getPublicUrl(fileName);

    const track: Track = {
      id: Date.now().toString(),
      name: fileName,
      url: publicUrlData.publicUrl,
      duration: 0,
    };

    onPublish(track);
    setUploading(false);
    setIsReadyToPublish(false);
    setRecordedBlob(null);
  };

  return (
    <Card className="bg-slate-900 text-white p-6 w-full max-w-md mx-auto rounded-2xl shadow-2xl">
      <CardContent className="flex flex-col items-center gap-6">
        <motion.div
          ref={micRef}
          className="w-40 h-40 rounded-full bg-slate-700 flex items-center justify-center"
          animate={{
            scale: isRecording ? 1 + volume * 0.5 : 1,
            backgroundColor: isRecording ? "#ef4444" : "#334155",
          }}
          transition={{ type: "spring", stiffness: 120 }}
        >
          {isRecording ? <StopCircle className="w-16 h-16 text-white" /> : <Mic className="w-16 h-16 text-white" />}
        </motion.div>

        {!isRecording && !isReadyToPublish && (
          <Button onClick={startRecording} size="lg" className="w-full bg-green-600">
            Iniciar Grabación
          </Button>
        )}

        {isRecording && (
          <Button onClick={stopRecording} size="lg" className="w-full bg-red-600">
            Detener Grabación
          </Button>
        )}

        {isReadyToPublish && (
          <div className="flex flex-col gap-4 w-full">
            <Button onClick={handlePublish} size="lg" disabled={uploading} className="w-full bg-blue-600">
              {uploading ? "Subiendo..." : "Publicar"}
            </Button>
            <Button
              onClick={() => {
                setRecordedBlob(null);
                setIsReadyToPublish(false);
              }}
              variant="outline"
              className="w-full border-gray-400 text-gray-300"
            >
              Repetir
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

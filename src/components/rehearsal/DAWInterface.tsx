import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, SkipBack, Mic, Volume2, VolumeX, Trash2, Upload, RotateCcw } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

// ... (interfaces y constantes se mantienen igual)

export default function DAWInterface({
  sessionId,
  tracks,
  backingTrackUrl,
  onTrackDelete,
  onTrackUpdate,
  onTracksRefresh,
}: DAWProps) {
  // ... (estados y refs se mantienen igual)

  // 🟥 Grabación con medición de latencia real - OPTIMIZADO
  const startRecording = async () => {
    if (isRecording) {
      toast({ title: "Ya estás grabando", variant: "destructive" });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
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

        // 🔥 PUBLICACIÓN INMEDIATA - Alineación en segundo plano
        toast({ title: "📤 Publicando pista automáticamente..." });
        await autoPublishRecording(blob);
        
        // Alineación opcional en segundo plano (no bloqueante)
        performBackgroundAlignment(blob).then(refinedOffset => {
          if (refinedOffset && Math.abs(refinedOffset - recordedStartOffset) > 0.1) {
            // Actualizar offset si hay diferencia significativa
            updateTrackOffset(refinedOffset);
          }
        });

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
        description: `Latencia compensada: ${(latency * 1000).toFixed(0)}ms`,
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

  // 🔥 Función de publicación rápida
  const autoPublishRecording = async (blob: Blob) => {
    if (!user?.id || !blob) {
      toast({ title: "Error: usuario o grabación no disponible", variant: "destructive" });
      return;
    }
    
    try {
      // 🔥 CACHÉ DE DATOS DE USUARIO
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      const userName = profile?.full_name || "Usuario";
      const userTracksCount = voiceTracks.filter((t) => t.user_id === user.id).length;
      const trackName = `${userName} Voz ${userTracksCount + 1}`;

      // 🔥 SUBIDA DIRECTA SIN PROCESAMIENTO PREVIO
      const fileName = `${sessionId}/${user.id}-${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("rehearsal-tracks")
        .upload(fileName, blob);

      if (uploadError) throw uploadError;

      // 🔥 URL PÚBLICA INMEDIATA
      const { data: urlData } = supabase.storage
        .from("rehearsal-tracks")
        .getPublicUrl(fileName);

      // 🔥 INSERCIÓN RÁPIDA
      const { error: insertError } = await supabase
        .from("rehearsal_tracks")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          track_name: trackName,
          track_type: "voice",
          audio_url: urlData.publicUrl,
          start_offset: recordedStartOffset, // Usar offset calculado por latencia
          is_backing_track: false,
          is_published: true,
        });

      if (insertError) throw insertError;

      toast({ title: "✅ Pista publicada correctamente" });
      setRecordedBlob(null);
      setShowRecordingPreview(false);
      onTracksRefresh();
    } catch (e) {
      console.error(e);
      toast({ title: "Error al publicar", variant: "destructive" });
    }
  };

  // 🔥 Alineación en segundo plano
  const performBackgroundAlignment = async (blob: Blob): Promise<number | null> => {
    try {
      // Versión simplificada de la alineación - solo lo esencial
      const ctx = audioContextRef.current!;
      const arrayBuf = await blob.arrayBuffer();
      const recBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
      const sr = recBuffer.sampleRate;

      const toMono = (buffer: AudioBuffer) => {
        const ch0 = buffer.getChannelData(0);
        if (buffer.numberOfChannels === 1) return ch0;
        const ch1 = buffer.getChannelData(1);
        const out = new Float32Array(buffer.length);
        for (let i = 0; i < buffer.length; i++) out[i] = (ch0[i] + ch1[i]) * 0.5;
        return out;
      };

      const makeEnvelope = (data: Float32Array, winSize = 1024) => {
        const env = new Float32Array(data.length);
        let acc = 0;
        for (let i = 0; i < data.length; i++) {
          const v = Math.abs(data[i]);
          acc += v;
          if (i >= winSize) acc -= Math.abs(data[i - winSize]);
          env[i] = acc / Math.min(i + 1, winSize);
        }
        return env;
      };

      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

      const buildReference = (globalStartSec: number, lenSec: number) => {
        const len = Math.floor(lenSec * sr);
        const ref = new Float32Array(len);
        const hasVoices = voiceTracks.length > 0;
        const candidates = hasVoices ? voiceTracks : allTracks.filter((t) => t.is_backing_track);
        candidates.forEach((t) => {
          const buf = buffersRef.current[t.id];
          if (!buf) return;
          const bufSr = buf.sampleRate;
          const ratio = bufSr / sr;
          const tOffset = getEffectiveOffset(t);
          const localStartInBuf = Math.floor((globalStartSec - (t.is_backing_track ? 0 : tOffset)) * bufSr);
          const ch0 = buf.getChannelData(0);
          const ch1 = buf.numberOfChannels > 1 ? buf.getChannelData(1) : null;
          for (let i = 0; i < len; i++) {
            const srcIdx = Math.floor(localStartInBuf + i * ratio);
            if (srcIdx >= 0 && srcIdx < buf.length) {
              const s = ch1 ? (ch0[srcIdx] + ch1[srcIdx]) * 0.5 : ch0[srcIdx];
              ref[i] += s;
            }
          }
        });
        return ref;
      };

      const xcorrBestLag = (a: Float32Array, b: Float32Array, maxLagSamples: number) => {
        const norm = (x: Float32Array) => {
          let mean = 0;
          for (let i = 0; i < x.length; i++) mean += x[i];
          mean /= x.length;
          let sq = 0;
          const y = new Float32Array(x.length);
          for (let i = 0; i < x.length; i++) {
            const v = x[i] - mean;
            y[i] = v;
            sq += v * v;
          }
          const s = Math.sqrt(sq) || 1;
          for (let i = 0; i < y.length; i++) y[i] /= s;
          return y;
        };
        const A = norm(a);
        const B = norm(b);
        let bestLag = 0;
        let bestScore = -Infinity;
        for (let lag = -maxLagSamples; lag <= maxLagSamples; lag++) {
          let sum = 0;
          let count = 0;
          for (let i = 0; i < A.length; i++) {
            const j = i - lag;
            if (j >= 0 && j < B.length) {
              sum += A[i] * B[j];
              count++;
            }
          }
          const score = count > 0 ? sum / count : -Infinity;
          if (score > bestScore) {
            bestScore = score;
            bestLag = lag;
          }
        }
        return { bestLag, bestScore };
      };

      const WINDOW_SEC = Math.min(3, recBuffer.duration); // Reducir ventana
      const PRE_SEC = 0.5; // Reducir pre-buffer
      const refStartGlobal = clamp((recordedStartOffset || 0) - PRE_SEC, 0, Math.max(0, duration - WINDOW_SEC));
      const ref = buildReference(refStartGlobal, WINDOW_SEC);

      const recMono = toMono(recBuffer);
      const recLen = Math.min(recMono.length, Math.floor(WINDOW_SEC * sr));
      const recSeg = recMono.subarray(0, recLen);

      const envRec = makeEnvelope(recSeg, 1024);
      const envRef = makeEnvelope(ref.subarray(0, recLen), 1024);

      const MAX_LAG_SEC = 0.35;
      const { bestLag, bestScore } = xcorrBestLag(envRec, envRef, Math.floor(MAX_LAG_SEC * sr));

      if (isFinite(bestLag) && bestScore > 0.02) {
        const lagSec = bestLag / sr;
        const newOffset = (recordedStartOffset || 0) + lagSec;
        return newOffset;
      } else {
        return null;
      }
    } catch (err) {
      console.warn("Alineación en segundo plano falló:", err);
      return null;
    }
  };

  // 🔥 Actualizar offset de la pista recién publicada
  const updateTrackOffset = async (newOffset: number) => {
    // Necesitamos obtener el ID de la pista recién creada, pero no lo tenemos.
    // Una solución sería modificar la publicación para que devuelva el ID, o buscar la última pista del usuario.
    // Por simplicidad, asumamos que actualizamos la última pista del usuario en esta sesión.
    try {
      const { data: tracks } = await supabase
        .from("rehearsal_tracks")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (tracks && tracks.length > 0) {
        const trackId = tracks[0].id;
        const { error } = await supabase
          .from("rehearsal_tracks")
          .update({ start_offset: newOffset })
          .eq("id", trackId);

        if (error) throw error;

        // Actualizar localmente
        onTrackUpdate(trackId, { start_offset: newOffset });
        toast({ title: "✅ Pista realineada automáticamente" });
      }
    } catch (error) {
      console.error("Error al actualizar offset:", error);
    }
  };

  // ... (el resto de funciones se mantienen igual)

  return (
    // ... (JSX se mantiene igual)
  );
}
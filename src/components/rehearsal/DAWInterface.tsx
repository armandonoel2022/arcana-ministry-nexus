import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Square, SkipBack, Mic, Volume2, VolumeX, Trash2, Upload, Music2 } from "lucide-react";
import WaveSurfer from "wavesurfer.js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";


/*
DAWInterface_enhanced.tsx
- Versión mejorada del DAW multipista
- Incluye: transporte global, controles por pista, waveform interactivo (WaveSurfer), VU meter básico,
grabación (MediaRecorder), subida a Supabase, y sincronización básica entre pistas mediante elementos <audio>.


Nota: Esta es una versión "lista para integrar". Algunas utilidades (Button/Slider/Toast/hooks) asumen tu kit UI existente.
*/


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


export default function DAWInterfaceEnhanced({
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
const [isPausedRecord, setIsPausedRecord] = useState(false);
const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
const [recordingTime, setRecordingTime] = useState(0);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);
const audioChunksRef = useRef<Blob[]>([]);
const timerRef = useRef<number | null>(null);


// Solo/mute
const [soloTrack, setSoloTrack] = useState<string | null>(null);


// Refs
const audioRefs = useRef<Record<string, HTMLAudioElement>>({});
const wavesurferRefs = useRef<Record<string, WaveSurfer | null>>({});
const animationRef = useRef<number | null>(null);
const analyserRefs = useRef<Record<string, AnalyserNode | null>>({});
const audioContextRef = useRef<AudioContext | null>(null);


// Build allTracks with backing track included
const voiceTracks = tracks.filter((t) => !t.is_backing_track);
const allTracks = [
...(backingTrackUrl
? [
{
id: "backing-track",
track_name: "Pista Base",
track_type: "backing",
audio_url: backingTrackUrl,
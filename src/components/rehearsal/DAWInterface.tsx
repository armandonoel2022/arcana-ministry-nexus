import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Play,
  Pause,
  Square,
  SkipBack,
  Mic,
  Volume2,
  VolumeX,
  Trash2,
  Upload,
  Music2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import WaveSurfer from "wavesurfer.js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Track {
  id: string;
  track_name: string;
  track_type: string;
  audio_url: string;
  user_id: string;
  is_backing_track: boolean;
  volume_level: number;
  is_muted: boolean;
  profiles: {
    full_name: string;
  };
}

interface DAWInterfaceProps {
  sessionId: string;
  tracks: Track[];
  backingTrackUrl: string | null;
  onTrackDelete: (trackId: string) => void;
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
  onTracksRefresh: () => void;
}

const DAWInterface = ({
  sessionId,
  tracks,
  backingTrackUrl,
  onTrackDelete,
  onTrackUpdate,
  onTracksRefresh,
}: DAWInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Solo state
  const [soloTrack, setSoloTrack] = useState<string | null>(null);

  // Refs
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const waveformRefs = useRef<{ [key: string]: WaveSurfer | null }>({});
  const animationFrameRef = useRef<number>();
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Get user's profile for auto-naming
  const [userProfile, setUserProfile] = useState<{ full_name: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, [user]);

  // Filter out backing tracks from database to avoid duplicates
  const voiceTracks = tracks.filter(track => !track.is_backing_track);
  
  const allTracks = [
    ...(backingTrackUrl
      ? [
          {
            id: "backing-track",
            track_name: "Pista Base",
            track_type: "backing",
            audio_url: backingTrackUrl,
            user_id: "",
            is_backing_track: true,
            volume_level: 1,
            is_muted: false,
            profiles: { full_name: "Sistema" },
          },
        ]
      : []),
    ...voiceTracks,
  ];

  // Initialize audio elements
  useEffect(() => {
    allTracks.forEach((track) => {
      if (!audioRefs.current[track.id]) {
        const audio = new Audio(track.audio_url);
        audio.volume = track.volume_level;
        audio.muted = track.is_muted;
        audioRefs.current[track.id] = audio;

        audio.addEventListener("loadedmetadata", () => {
          setDuration(Math.max(duration, audio.duration));
        });

        audio.addEventListener("ended", () => {
          if (Object.values(audioRefs.current).every((a) => a.ended)) {
            setIsPlaying(false);
            handleStop();
          }
        });
      }
    });

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      Object.values(waveformRefs.current).forEach((ws) => ws?.destroy());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [allTracks.length]);

  // Update volume and mute for tracks
  useEffect(() => {
    allTracks.forEach((track) => {
      const audio = audioRefs.current[track.id];
      if (audio) {
        audio.volume = track.volume_level;
        const isSoloed = soloTrack && soloTrack !== track.id;
        audio.muted = track.is_muted || isSoloed;
      }
    });
  }, [tracks, soloTrack]);

  // Update time
  const updateTime = () => {
    const audios = Object.values(audioRefs.current);
    if (audios.length > 0 && audios[0]) {
      setCurrentTime(audios[0].currentTime);
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    }
  };

  const handlePlay = () => {
    const audios = Object.values(audioRefs.current);
    audios.forEach((audio) => audio.play());
    setIsPlaying(true);
    animationFrameRef.current = requestAnimationFrame(updateTime);
  };

  const handlePause = () => {
    const audios = Object.values(audioRefs.current);
    audios.forEach((audio) => audio.pause());
    setIsPlaying(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleStop = () => {
    const audios = Object.values(audioRefs.current);
    audios.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
    setIsPlaying(false);
    setCurrentTime(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleRestart = () => {
    handleStop();
    handlePlay();
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    Object.values(audioRefs.current).forEach((audio) => {
      audio.currentTime = newTime;
    });
    setCurrentTime(newTime);
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10);
    Object.values(audioRefs.current).forEach((audio) => {
      audio.currentTime = newTime;
    });
    setCurrentTime(newTime);
  };

  // Recording functions
  const startRecording = async () => {
    try {
      // Capture current time before starting
      const startTime = currentTime;
      
      // If not playing, start from current position
      if (!isPlaying) {
        handlePlay();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1, // Mono recording
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsPaused(false);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo acceder al micrófono",
        variant: "destructive",
      });
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      handlePause();

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        handlePlay();
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        handlePause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const uploadRecording = async () => {
    if (!recordedBlob || !user || !userProfile) return;

    try {
      setIsUploading(true);

      const fileName = `${sessionId}/${user.id}/${Date.now()}.webm`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("rehearsal-media")
        .upload(fileName, recordedBlob, {
          contentType: "audio/webm",
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("rehearsal-media").getPublicUrl(fileName);

      const { data: participantData } = await supabase
        .from("rehearsal_participants")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .maybeSingle();

      // Count existing tracks by this user
      const { data: existingTracks } = await supabase
        .from("rehearsal_tracks")
        .select("id")
        .eq("session_id", sessionId)
        .eq("user_id", user.id)
        .eq("is_backing_track", false);

      const trackNumber = (existingTracks?.length || 0) + 1;
      const autoTrackName = `${userProfile.full_name} Voz ${trackNumber}`;

      const { error: trackError } = await supabase
        .from("rehearsal_tracks")
        .insert({
          session_id: sessionId,
          user_id: user.id,
          participant_id: participantData?.id ?? null,
          audio_url: publicUrl,
          track_type: "audio",
          track_name: autoTrackName,
          duration_seconds: recordingTime,
          is_published: true,
          is_backing_track: false,
        });

      if (trackError) throw trackError;

      toast({
        title: "Éxito",
        description: "Tu grabación ha sido publicada",
      });

      setRecordedBlob(null);
      setRecordingTime(0);
      onTracksRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "No se pudo subir la grabación",
        variant: "destructive",
      });
      console.error("Error uploading recording:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelRecording = () => {
    setRecordedBlob(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const initWaveform = (containerId: string, audioUrl: string, isBackingTrack: boolean = false) => {
    const container = document.getElementById(containerId);
    if (!container || waveformRefs.current[containerId]) return;

    const wavesurfer = WaveSurfer.create({
      container: `#${containerId}`,
      waveColor: "hsl(var(--muted-foreground) / 0.3)",
      progressColor: "hsl(var(--primary))",
      cursorColor: "hsl(var(--primary))",
      barWidth: 2,
      barRadius: 3,
      height: 60,
      normalize: true,
      backend: "WebAudio",
    });

    wavesurfer.load(audioUrl);
    waveformRefs.current[containerId] = wavesurfer;
  };

  return (
    <div className="space-y-6">
      {/* Transport Controls */}
      <div className="bg-card border rounded-lg p-4 sticky top-0 z-10 shadow-md">
        <div className="flex flex-col gap-4">
          {/* Top Row: Main Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSkipBack}
                disabled={isRecording}
              >
                <SkipBack className="w-4 h-4" />
              </Button>

              {!isPlaying ? (
                <Button
                  size="lg"
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-blue-600"
                  onClick={handlePlay}
                  disabled={isRecording}
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="w-12 h-12 rounded-full"
                  variant="outline"
                  onClick={handlePause}
                >
                  <Pause className="w-5 h-5" />
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleStop}
                disabled={isRecording}
              >
                <Square className="w-4 h-4" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleRestart}
                disabled={isRecording}
              >
                Reiniciar
              </Button>
            </div>

            {/* Time display */}
            <div className="flex items-center gap-2 text-sm font-mono">
              <span>{formatTime(currentTime)}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{formatTime(duration)}</span>
            </div>

            {/* Timeline */}
            <div className="flex-1">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
                disabled={isRecording}
              />
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full">
                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                <span className="text-sm font-medium">{formatTime(recordingTime)}</span>
              </div>
            )}
          </div>

          {/* Bottom Row: Recording Controls */}
          {!recordedBlob && (
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                {!isRecording ? (
                  <Button
                    onClick={startRecording}
                    variant="default"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Mic className="w-4 h-4 mr-2" />
                    Grabar Nueva Pista
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={pauseRecording}
                      variant="outline"
                      size="sm"
                    >
                      {isPaused ? (
                        <Play className="w-4 h-4" />
                      ) : (
                        <Pause className="w-4 h-4" />
                      )}
                    </Button>
                    <Button onClick={stopRecording} variant="destructive" size="sm">
                      <Square className="w-4 h-4 mr-2" />
                      Detener
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Recording ready to upload */}
          {recordedBlob && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <Music2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-900">
                Grabación lista ({formatTime(recordingTime)})
              </span>
              <div className="flex-1" />
              <Button
                onClick={uploadRecording}
                size="sm"
                disabled={isUploading}
                className="bg-green-600 hover:bg-green-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? "Subiendo..." : "Publicar"}
              </Button>
              <Button
                onClick={cancelRecording}
                size="sm"
                variant="outline"
                disabled={isUploading}
              >
                Cancelar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tracks */}
      <div className="space-y-3">
        {allTracks.length === 0 ? (
          <div className="text-center py-12 bg-muted/50 rounded-xl">
            <p className="text-muted-foreground">
              No hay pistas aún. Graba la primera pista.
            </p>
          </div>
        ) : (
          allTracks.map((track) => {
            const isBackingTrack = track.is_backing_track;
            const isMuted = soloTrack ? soloTrack !== track.id : track.is_muted;
            const isSolo = soloTrack === track.id;

            return (
              <div
                key={track.id}
                className={`bg-card border rounded-lg p-4 transition-all ${
                  isMuted ? "opacity-50" : ""
                } ${isSolo ? "ring-2 ring-primary" : ""}`}
              >
                <div className="flex items-start gap-4">
                  {/* Track Controls */}
                  <div className="flex flex-col gap-2 w-48 flex-shrink-0">
                    <div className="font-medium text-sm truncate">
                      {track.track_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {track.profiles.full_name}
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        variant={track.is_muted ? "default" : "outline"}
                        className="w-10 h-8 p-0 text-xs"
                        onClick={() =>
                          !isBackingTrack &&
                          onTrackUpdate(track.id, { is_muted: !track.is_muted })
                        }
                        disabled={isBackingTrack}
                      >
                        M
                      </Button>

                      <Button
                        size="sm"
                        variant={isSolo ? "default" : "outline"}
                        className="w-10 h-8 p-0 text-xs"
                        onClick={() =>
                          setSoloTrack(soloTrack === track.id ? null : track.id)
                        }
                      >
                        S
                      </Button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0"
                        onClick={() =>
                          !isBackingTrack &&
                          onTrackUpdate(track.id, { is_muted: !track.is_muted })
                        }
                        disabled={isBackingTrack}
                      >
                        {track.is_muted ? (
                          <VolumeX className="w-4 h-4" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </Button>
                      <Slider
                        value={[track.volume_level]}
                        max={1}
                        step={0.1}
                        className="flex-1"
                        onValueChange={(value) =>
                          !isBackingTrack &&
                          onTrackUpdate(track.id, { volume_level: value[0] })
                        }
                        disabled={isBackingTrack}
                      />
                    </div>

                    {!isBackingTrack && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive mt-2"
                        onClick={() => onTrackDelete(track.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    )}
                  </div>

                  {/* Waveform */}
                  <div className="flex-1">
                    <div
                      id={`waveform-${track.id}`}
                      className="bg-muted/30 rounded-md min-h-[60px]"
                      ref={(el) => {
                        if (el && track.audio_url) {
                          setTimeout(
                            () =>
                              initWaveform(`waveform-${track.id}`, track.audio_url, isBackingTrack),
                            100
                          );
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DAWInterface;

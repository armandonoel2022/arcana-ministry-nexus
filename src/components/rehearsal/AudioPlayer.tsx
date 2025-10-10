import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, Volume2, VolumeX, SkipBack, SkipForward } from "lucide-react";

interface AudioPlayerProps {
  tracks: Array<{
    id: string;
    audio_url: string;
    volume_level: number;
    is_muted: boolean;
  }>;
  backingTrackUrl: string | null;
  triggerPlay?: boolean;
}

const AudioPlayer = ({ tracks, backingTrackUrl, triggerPlay }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const animationFrameRef = useRef<number>();

  const allTracks = [
    ...(backingTrackUrl ? [{ id: 'backing', audio_url: backingTrackUrl, volume_level: 1, is_muted: false }] : []),
    ...tracks
  ];

  useEffect(() => {
    // Create audio elements
    allTracks.forEach(track => {
      if (!audioRefs.current[track.id]) {
        const audio = new Audio(track.audio_url);
        audio.volume = track.volume_level * volume;
        audio.muted = track.is_muted || isMuted;
        audioRefs.current[track.id] = audio;

        audio.addEventListener('loadedmetadata', () => {
          setDuration(Math.max(duration, audio.duration));
        });
      }
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        audio.pause();
        audio.src = '';
      });
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [allTracks.length]);

  useEffect(() => {
    // Update volume for all tracks
    Object.entries(audioRefs.current).forEach(([id, audio]) => {
      const track = allTracks.find(t => t.id === id);
      if (track) {
        audio.volume = track.volume_level * volume;
        audio.muted = track.is_muted || isMuted;
      }
    });
  }, [volume, isMuted, tracks]);

  useEffect(() => {
    // Trigger play when triggerPlay changes
    if (triggerPlay !== undefined && Object.keys(audioRefs.current).length > 0) {
      handlePlayPause();
    }
  }, [triggerPlay]);

  const updateTime = () => {
    const audios = Object.values(audioRefs.current);
    if (audios.length > 0) {
      setCurrentTime(audios[0].currentTime);
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    }
  };

  const handlePlayPause = () => {
    const audios = Object.values(audioRefs.current);
    
    if (isPlaying) {
      audios.forEach(audio => audio.pause());
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      audios.forEach(audio => audio.play());
      animationFrameRef.current = requestAnimationFrame(updateTime);
    }
    
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const newTime = value[0];
    Object.values(audioRefs.current).forEach(audio => {
      audio.currentTime = newTime;
    });
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const handleSkipBack = () => {
    const newTime = Math.max(0, currentTime - 10);
    Object.values(audioRefs.current).forEach(audio => {
      audio.currentTime = newTime;
    });
    setCurrentTime(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    Object.values(audioRefs.current).forEach(audio => {
      audio.currentTime = newTime;
    });
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (allTracks.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-2xl z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={handleSkipBack}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button
              size="lg"
              variant="ghost"
              className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 text-white"
              onClick={handlePlayPause}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={handleSkipForward}
            >
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Time display */}
          <div className="text-sm font-medium min-w-[80px]">
            {formatTime(currentTime)}
          </div>

          {/* Progress bar */}
          <div className="flex-1">
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
          </div>

          {/* Duration */}
          <div className="text-sm font-medium min-w-[80px] text-right">
            {formatTime(duration)}
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 min-w-[140px]">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20 w-8 h-8 p-0"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <Slider
              value={[volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;

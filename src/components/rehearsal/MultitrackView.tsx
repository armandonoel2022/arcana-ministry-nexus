import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Volume2, VolumeX, Edit2, Trash2, Lock } from "lucide-react";
import WaveSurfer from "wavesurfer.js";

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

interface MultitrackViewProps {
  tracks: Track[];
  backingTrackUrl: string | null;
  onTrackDelete: (trackId: string) => void;
  onTrackUpdate: (trackId: string, updates: Partial<Track>) => void;
}

const MultitrackView = ({ tracks, backingTrackUrl, onTrackDelete, onTrackUpdate }: MultitrackViewProps) => {
  const waveformRefs = useRef<{ [key: string]: WaveSurfer | null }>({});
  const [soloTrack, setSoloTrack] = useState<string | null>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      Object.values(waveformRefs.current).forEach(ws => ws?.destroy());
    };
  }, []);

  const initWaveform = (containerId: string, audioUrl: string) => {
    const container = document.getElementById(containerId);
    if (!container || waveformRefs.current[containerId]) return;

    const wavesurfer = WaveSurfer.create({
      container: `#${containerId}`,
      waveColor: 'hsl(212, 100%, 87%)',
      progressColor: 'hsl(212, 100%, 47%)',
      cursorColor: 'hsl(212, 100%, 47%)',
      barWidth: 2,
      barRadius: 3,
      height: 60,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurfer.load(audioUrl);
    waveformRefs.current[containerId] = wavesurfer;
  };

  const handleMuteToggle = (trackId: string, currentMuted: boolean) => {
    onTrackUpdate(trackId, { is_muted: !currentMuted });
  };

  const handleSoloToggle = (trackId: string) => {
    setSoloTrack(soloTrack === trackId ? null : trackId);
  };

  const handleVolumeChange = (trackId: string, value: number[]) => {
    onTrackUpdate(trackId, { volume_level: value[0] });
  };

  const allTracks = [
    ...(backingTrackUrl ? [{
      id: 'backing-track',
      track_name: 'Pista Base',
      track_type: 'backing',
      audio_url: backingTrackUrl,
      user_id: '',
      is_backing_track: true,
      volume_level: 1,
      is_muted: false,
      profiles: { full_name: 'Sistema' }
    }] : []),
    ...tracks
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
          <span className="text-white text-xs font-bold">🎹</span>
        </div>
        <h3 className="text-lg font-semibold">Pistas Multipista</h3>
      </div>

      {allTracks.length === 0 ? (
        <div className="text-center py-12 bg-muted/50 rounded-xl">
          <p className="text-muted-foreground">No hay pistas aún. Sé el primero en grabar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {allTracks.map((track) => {
            const isBackingTrack = track.is_backing_track;
            const isMuted = soloTrack ? soloTrack !== track.id : track.is_muted;
            const isSolo = soloTrack === track.id;
            
            return (
              <div 
                key={track.id}
                className={`bg-card border rounded-lg p-4 transition-all ${
                  isMuted ? 'opacity-50' : ''
                } ${isSolo ? 'ring-2 ring-primary' : ''}`}
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex-shrink-0 w-16 text-sm font-medium truncate">
                    {track.track_name}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Mute button */}
                    <Button
                      size="sm"
                      variant={track.is_muted ? "default" : "outline"}
                      className="w-8 h-8 p-0"
                      onClick={() => !isBackingTrack && handleMuteToggle(track.id, track.is_muted)}
                      disabled={isBackingTrack}
                    >
                      M
                    </Button>
                    
                    {/* Solo button */}
                    <Button
                      size="sm"
                      variant={isSolo ? "default" : "outline"}
                      className="w-8 h-8 p-0"
                      onClick={() => handleSoloToggle(track.id)}
                    >
                      S
                    </Button>
                    
                    {/* Volume control */}
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0"
                        onClick={() => !isBackingTrack && handleMuteToggle(track.id, track.is_muted)}
                        disabled={isBackingTrack}
                      >
                        {track.is_muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      <Slider
                        value={[track.volume_level]}
                        max={1}
                        step={0.1}
                        className="w-20"
                        onValueChange={(value) => !isBackingTrack && handleVolumeChange(track.id, value)}
                        disabled={isBackingTrack}
                      />
                    </div>

                    {!isBackingTrack && (
                      <>
                        <Button size="sm" variant="ghost" className="w-8 h-8 p-0">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="w-8 h-8 p-0 text-destructive hover:text-destructive"
                          onClick={() => onTrackDelete(track.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}

                    {isBackingTrack && (
                      <Lock className="w-4 h-4 text-muted-foreground ml-2" />
                    )}
                  </div>
                </div>

                {/* Waveform */}
                <div 
                  id={`waveform-${track.id}`}
                  className="bg-muted/30 rounded-md"
                  ref={(el) => {
                    if (el && track.audio_url) {
                      setTimeout(() => initWaveform(`waveform-${track.id}`, track.audio_url), 100);
                    }
                  }}
                />

                <div className="mt-2 text-xs text-muted-foreground">
                  {track.profiles.full_name} • {track.track_type}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MultitrackView;

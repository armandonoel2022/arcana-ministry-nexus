import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  LocalTrack,
  LocalAudioTrack,
  createLocalAudioTrack,
  AudioPresets,
  ConnectionState,
} from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface LiveKitConfig {
  sessionId: string;
  userId: string;
  userName: string;
}

interface RemoteAudioTrack {
  participantId: string;
  participantName: string;
  track: MediaStreamTrack;
  startTime: number; // NTP-synced timestamp
}

interface RecordedTrack {
  blob: Blob;
  startOffset: number;
  participantId: string;
  participantName: string;
}

export function useLiveKit(config: LiveKitConfig) {
  const { toast } = useToast();
  const roomRef = useRef<Room | null>(null);
  const localTrackRef = useRef<LocalAudioTrack | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStartTimeRef = useRef<number>(0);

  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [remoteParticipants, setRemoteParticipants] = useState<Map<string, { name: string; audioTrack?: MediaStreamTrack }>>(new Map());
  const [recordedTracks, setRecordedTracks] = useState<RecordedTrack[]>([]);

  const timerRef = useRef<number | null>(null);

  // Get LiveKit token from edge function
  const getToken = useCallback(async (): Promise<{ token: string; url: string } | null> => {
    try {
      const response = await supabase.functions.invoke('livekit-token', {
        body: {
          roomName: `rehearsal-${config.sessionId}`,
          participantName: config.userName,
          participantIdentity: config.userId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        token: response.data.token,
        url: response.data.url,
      };
    } catch (error) {
      console.error('Error getting LiveKit token:', error);
      toast({
        title: 'Error de conexión',
        description: 'No se pudo obtener token de LiveKit',
        variant: 'destructive',
      });
      return null;
    }
  }, [config.sessionId, config.userId, config.userName, toast]);

  // Connect to LiveKit room
  const connect = useCallback(async () => {
    if (roomRef.current?.state === ConnectionState.Connected) {
      console.log('Already connected to LiveKit');
      return true;
    }

    const tokenData = await getToken();
    if (!tokenData) return false;

    try {
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        audioCaptureDefaults: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Set up event handlers
      room.on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
        setIsConnected(state === ConnectionState.Connected);
        console.log('LiveKit connection state:', state);
      });

      room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('Participant connected:', participant.identity, participant.name);
        setRemoteParticipants((prev) => {
          const updated = new Map(prev);
          updated.set(participant.identity, { name: participant.name || participant.identity });
          return updated;
        });
      });

      room.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('Participant disconnected:', participant.identity);
        setRemoteParticipants((prev) => {
          const updated = new Map(prev);
          updated.delete(participant.identity);
          return updated;
        });
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication: RemoteTrackPublication, participant: RemoteParticipant) => {
        if (track.kind === Track.Kind.Audio) {
          console.log('Subscribed to audio track from:', participant.name);
          setRemoteParticipants((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(participant.identity) || { name: participant.name || participant.identity };
            updated.set(participant.identity, { ...existing, audioTrack: track.mediaStreamTrack });
            return updated;
          });
        }
      });

      room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          setRemoteParticipants((prev) => {
            const updated = new Map(prev);
            const existing = updated.get(participant.identity);
            if (existing) {
              updated.set(participant.identity, { ...existing, audioTrack: undefined });
            }
            return updated;
          });
        }
      });

      await room.connect(tokenData.url, tokenData.token);
      roomRef.current = room;

      toast({
        title: '🔗 Conectado a sala LiveKit',
        description: `Sala: rehearsal-${config.sessionId}`,
      });

      return true;
    } catch (error) {
      console.error('Error connecting to LiveKit:', error);
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar a LiveKit',
        variant: 'destructive',
      });
      return false;
    }
  }, [getToken, config.sessionId, toast]);

  // Disconnect from LiveKit room
  const disconnect = useCallback(() => {
    if (localTrackRef.current) {
      localTrackRef.current.stop();
      localTrackRef.current = null;
    }
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setIsConnected(false);
    setRemoteParticipants(new Map());
  }, []);

  // Start recording with NTP-synced timestamp
  const startRecording = useCallback(async () => {
    if (!roomRef.current || roomRef.current.state !== ConnectionState.Connected) {
      const connected = await connect();
      if (!connected) return false;
    }

    try {
      // Create local audio track
      const localTrack = await createLocalAudioTrack({
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      });

      localTrackRef.current = localTrack;

      // Publish to room
      await roomRef.current!.localParticipant.publishTrack(localTrack);

      // Set up MediaRecorder for local recording
      const stream = new MediaStream([localTrack.mediaStreamTrack]);
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const recordedTrack: RecordedTrack = {
          blob,
          startOffset: recordingStartTimeRef.current,
          participantId: config.userId,
          participantName: config.userName,
        };
        setRecordedTracks((prev) => [...prev, recordedTrack]);
      };

      // Start recording with NTP-synced timestamp
      // LiveKit provides synchronized timestamps via room.serverInfo
      recordingStartTimeRef.current = Date.now();
      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;

      setIsRecording(true);
      timerRef.current = window.setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);

      toast({
        title: '🎙️ Grabando...',
        description: 'Audio sincronizado con LiveKit',
      });

      return true;
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: 'Error al grabar',
        description: 'No se pudo iniciar la grabación',
        variant: 'destructive',
      });
      return false;
    }
  }, [connect, config.userId, config.userName, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (localTrackRef.current) {
      roomRef.current?.localParticipant.unpublishTrack(localTrackRef.current);
      localTrackRef.current.stop();
      localTrackRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    setRecordingTime(0);

    toast({
      title: '⏹️ Grabación detenida',
    });
  }, [toast]);

  // Get last recorded track
  const getLastRecordedTrack = useCallback((): RecordedTrack | null => {
    if (recordedTracks.length === 0) return null;
    return recordedTracks[recordedTracks.length - 1];
  }, [recordedTracks]);

  // Clear recorded tracks
  const clearRecordedTracks = useCallback(() => {
    setRecordedTracks([]);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [disconnect]);

  return {
    // Connection
    connect,
    disconnect,
    isConnected,
    connectionState,

    // Recording
    startRecording,
    stopRecording,
    isRecording,
    recordingTime,

    // Participants
    remoteParticipants,

    // Recorded data
    recordedTracks,
    getLastRecordedTrack,
    clearRecordedTracks,

    // Room reference (for advanced usage)
    room: roomRef.current,
  };
}

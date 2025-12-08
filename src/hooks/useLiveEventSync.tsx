import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProgramItem {
  id: string;
  title: string;
  duration_minutes: number;
  time_slot: string;
  responsible_person?: string;
  notes?: string;
  highlight_color?: string;
}

interface LiveSession {
  id: string;
  event_id: string;
  current_item_index: number;
  elapsed_seconds: number;
  preparation_seconds: number;
  is_running: boolean;
  is_paused: boolean;
  is_preparation_phase: boolean;
  completed_items: number[];
  item_actual_times: Record<string, number>;
  event_start_time: string | null;
  event_end_time: string | null;
  last_updated_at: string;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentItemIndex: number;
  elapsedSeconds: number;
  preparationSeconds: number;
  isPreparationPhase: boolean;
  completedItems: string[];
  itemActualTimes: Record<string, number>;
  eventStartTime: Date | null;
  eventEndTime: Date | null;
}

export const useLiveEventSync = (eventId: string | null, programItems: ProgramItem[]) => {
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    currentItemIndex: 0,
    elapsedSeconds: 0,
    preparationSeconds: 0,
    isPreparationPhase: false,
    completedItems: [],
    itemActualTimes: {},
    eventStartTime: null,
    eventEndTime: null,
  });
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);

  // Format time as MM:SS or HH:MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Sync state to database
  const syncToDatabase = useCallback(async (state: TimerState) => {
    if (!eventId || !sessionId) return;
    
    // Throttle syncs to every 2 seconds
    const now = Date.now();
    if (now - lastSyncRef.current < 2000) return;
    lastSyncRef.current = now;

    try {
      await supabase
        .from('live_event_sessions')
        .update({
          current_item_index: state.currentItemIndex,
          elapsed_seconds: state.elapsedSeconds,
          preparation_seconds: state.preparationSeconds,
          is_running: state.isRunning,
          is_paused: state.isPaused,
          is_preparation_phase: state.isPreparationPhase,
          completed_items: state.completedItems.map((id, idx) => idx),
          item_actual_times: state.itemActualTimes,
          event_start_time: state.eventStartTime?.toISOString() || null,
          event_end_time: state.eventEndTime?.toISOString() || null,
          last_updated_at: new Date().toISOString(),
        })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error syncing to database:', error);
    }
  }, [eventId, sessionId]);

  // Load or create session
  useEffect(() => {
    if (!eventId) {
      setIsLoading(false);
      return;
    }

    const loadSession = async () => {
      setIsLoading(true);
      try {
        // Check for existing session
        const { data: existing, error: fetchError } = await supabase
          .from('live_event_sessions')
          .select('*')
          .eq('event_id', eventId)
          .is('event_end_time', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existing && !fetchError) {
          // Load existing session
          setSessionId(existing.id);
          setTimerState({
            isRunning: existing.is_running,
            isPaused: existing.is_paused,
            currentItemIndex: existing.current_item_index,
            elapsedSeconds: existing.elapsed_seconds,
            preparationSeconds: existing.preparation_seconds,
            isPreparationPhase: existing.is_preparation_phase,
            completedItems: programItems.slice(0, existing.completed_items.length).map(p => p.id),
            itemActualTimes: (existing.item_actual_times as Record<string, number>) || {},
            eventStartTime: existing.event_start_time ? new Date(existing.event_start_time) : null,
            eventEndTime: existing.event_end_time ? new Date(existing.event_end_time) : null,
          });
        } else {
          // Create new session
          const { data: newSession, error: createError } = await supabase
            .from('live_event_sessions')
            .insert({
              event_id: eventId,
              current_item_index: 0,
              elapsed_seconds: 0,
              preparation_seconds: 0,
              is_running: false,
              is_paused: false,
              is_preparation_phase: false,
              completed_items: [],
              item_actual_times: {},
            })
            .select()
            .single();

          if (createError) throw createError;
          setSessionId(newSession.id);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [eventId, programItems]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`live_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'live_event_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const data = payload.new as LiveSession;
          
          setTimerState(prev => ({
            isRunning: data.is_running,
            isPaused: data.is_paused,
            currentItemIndex: data.current_item_index,
            elapsedSeconds: data.elapsed_seconds,
            preparationSeconds: data.preparation_seconds,
            isPreparationPhase: data.is_preparation_phase,
            completedItems: programItems.slice(0, data.completed_items.length).map(p => p.id),
            itemActualTimes: (data.item_actual_times as Record<string, number>) || {},
            eventStartTime: data.event_start_time ? new Date(data.event_start_time) : null,
            eventEndTime: data.event_end_time ? new Date(data.event_end_time) : null,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, programItems]);

  // Start the timer for current section
  const startTimer = useCallback(() => {
    if (timerState.isRunning && !timerState.isPaused) return;

    const newState: TimerState = {
      ...timerState,
      isRunning: true,
      isPaused: false,
      isPreparationPhase: false,
      preparationSeconds: 0,
      eventStartTime: timerState.eventStartTime || new Date(),
    };
    
    setTimerState(newState);
    syncToDatabase(newState);
  }, [timerState, syncToDatabase]);

  // Stop the current section and enter preparation phase
  const stopSection = useCallback(() => {
    if (!timerState.isRunning || timerState.isPreparationPhase) return;

    const currentItem = programItems[timerState.currentItemIndex];
    if (!currentItem) return;

    const newState: TimerState = {
      ...timerState,
      isPreparationPhase: true,
      completedItems: [...timerState.completedItems, currentItem.id],
      itemActualTimes: {
        ...timerState.itemActualTimes,
        [currentItem.id]: timerState.elapsedSeconds,
      },
    };
    
    setTimerState(newState);
    syncToDatabase(newState);
  }, [timerState, programItems, syncToDatabase]);

  // Move to next section
  const nextSection = useCallback(() => {
    const nextIndex = timerState.currentItemIndex + 1;
    
    if (nextIndex >= programItems.length) {
      // Event finished
      const newState: TimerState = {
        ...timerState,
        isRunning: false,
        isPaused: false,
        isPreparationPhase: false,
        eventEndTime: new Date(),
      };
      setTimerState(newState);
      syncToDatabase(newState);
      return;
    }

    const newState: TimerState = {
      ...timerState,
      currentItemIndex: nextIndex,
      elapsedSeconds: 0,
      preparationSeconds: 0,
      isPreparationPhase: false,
      isRunning: false,
    };
    
    setTimerState(newState);
    syncToDatabase(newState);
  }, [timerState, programItems.length, syncToDatabase]);

  // Skip to a specific section
  const skipToSection = useCallback((index: number) => {
    if (index < 0 || index >= programItems.length) return;

    const newState: TimerState = {
      ...timerState,
      currentItemIndex: index,
      elapsedSeconds: 0,
      preparationSeconds: 0,
      isPreparationPhase: false,
      isRunning: false,
      isPaused: false,
    };
    
    setTimerState(newState);
    syncToDatabase(newState);
  }, [timerState, programItems.length, syncToDatabase]);

  // Restore a completed section (go back)
  const restoreSection = useCallback((itemId: string) => {
    const itemIndex = programItems.findIndex(p => p.id === itemId);
    if (itemIndex === -1) return;

    // Remove from completed items
    const newCompletedItems = timerState.completedItems.filter(id => id !== itemId);
    const newItemActualTimes = { ...timerState.itemActualTimes };
    const previousTime = newItemActualTimes[itemId] || 0;
    delete newItemActualTimes[itemId];

    const newState: TimerState = {
      ...timerState,
      currentItemIndex: itemIndex,
      elapsedSeconds: previousTime, // Restore previous time
      preparationSeconds: 0,
      isPreparationPhase: false,
      isRunning: false,
      isPaused: false,
      completedItems: newCompletedItems,
      itemActualTimes: newItemActualTimes,
    };
    
    setTimerState(newState);
    syncToDatabase(newState);
    toast.success('Sección restaurada');
  }, [timerState, programItems, syncToDatabase]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    const newState: TimerState = {
      ...timerState,
      isPaused: !timerState.isPaused,
    };
    
    setTimerState(newState);
    syncToDatabase(newState);
  }, [timerState, syncToDatabase]);

  // Reset entire event
  const resetEvent = useCallback(async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    const newState: TimerState = {
      isRunning: false,
      isPaused: false,
      currentItemIndex: 0,
      elapsedSeconds: 0,
      preparationSeconds: 0,
      isPreparationPhase: false,
      completedItems: [],
      itemActualTimes: {},
      eventStartTime: null,
      eventEndTime: null,
    };
    
    setTimerState(newState);
    
    // Create new session
    if (eventId) {
      const { data: newSession } = await supabase
        .from('live_event_sessions')
        .insert({
          event_id: eventId,
          current_item_index: 0,
          elapsed_seconds: 0,
          preparation_seconds: 0,
          is_running: false,
          is_paused: false,
          is_preparation_phase: false,
          completed_items: [],
          item_actual_times: {},
        })
        .select()
        .single();

      if (newSession) {
        setSessionId(newSession.id);
      }
    }
  }, [eventId]);

  // Save statistics when event ends
  const saveStatistics = useCallback(async () => {
    if (!eventId) return;

    const totalPlannedSeconds = programItems.reduce(
      (sum, item) => sum + (item.duration_minutes || 0) * 60,
      0
    );

    const totalActualSeconds = Object.values(timerState.itemActualTimes).reduce(
      (sum, seconds) => sum + seconds,
      0
    );

    const totalPreparationTime = timerState.preparationSeconds;

    const itemStats = programItems.map(item => ({
      id: item.id,
      title: item.title,
      plannedSeconds: (item.duration_minutes || 0) * 60,
      actualSeconds: timerState.itemActualTimes[item.id] || 0,
      completed: timerState.completedItems.includes(item.id),
    }));

    const recommendations: string[] = [];
    itemStats.forEach(item => {
      const diff = item.actualSeconds - item.plannedSeconds;
      if (Math.abs(diff) > 120 && item.completed) {
        if (diff > 0) {
          recommendations.push(`"${item.title}": Excedido por ${formatTime(diff)}. Considerar más tiempo.`);
        } else {
          recommendations.push(`"${item.title}": Terminó ${formatTime(Math.abs(diff))} antes. Reducir tiempo asignado.`);
        }
      }
    });

    try {
      await supabase.from('event_statistics').insert({
        event_id: eventId,
        total_planned_duration: totalPlannedSeconds,
        total_actual_duration: totalActualSeconds,
        total_preparation_time: totalPreparationTime,
        item_stats: itemStats,
        recommendations,
      });
    } catch (error) {
      console.error('Error saving statistics:', error);
    }
  }, [eventId, programItems, timerState, formatTime]);

  // Timer effect
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          const newState = prev.isPreparationPhase
            ? { ...prev, preparationSeconds: prev.preparationSeconds + 1 }
            : { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
          
          // Sync every 5 seconds
          if ((newState.elapsedSeconds + newState.preparationSeconds) % 5 === 0) {
            syncToDatabase(newState);
          }
          
          return newState;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timerState.isRunning, timerState.isPaused, syncToDatabase]);

  // Calculate statistics
  const getStatistics = useCallback(() => {
    const totalPlannedSeconds = programItems.reduce(
      (sum, item) => sum + (item.duration_minutes || 0) * 60,
      0
    );

    const totalActualSeconds = Object.values(timerState.itemActualTimes).reduce(
      (sum, seconds) => sum + seconds,
      0
    );

    const difference = totalActualSeconds - totalPlannedSeconds;
    const isAhead = difference < 0;

    const itemStats = programItems.map(item => {
      const planned = (item.duration_minutes || 0) * 60;
      const actual = timerState.itemActualTimes[item.id] || 0;
      const diff = actual - planned;
      return {
        id: item.id,
        title: item.title,
        plannedSeconds: planned,
        actualSeconds: actual,
        difference: diff,
        completed: timerState.completedItems.includes(item.id),
      };
    });

    return {
      totalPlannedSeconds,
      totalActualSeconds,
      difference: Math.abs(difference),
      isAhead,
      itemStats,
      eventStartTime: timerState.eventStartTime,
      eventEndTime: timerState.eventEndTime,
    };
  }, [programItems, timerState.itemActualTimes, timerState.completedItems, timerState.eventStartTime, timerState.eventEndTime]);

  // Get current item
  const currentItem = programItems[timerState.currentItemIndex] || null;
  const nextItem = programItems[timerState.currentItemIndex + 1] || null;
  const plannedSeconds = currentItem ? (currentItem.duration_minutes || 0) * 60 : 0;
  const timeRemaining = plannedSeconds - timerState.elapsedSeconds;
  const isOvertime = timeRemaining < 0;

  // Completed items list (for restoration)
  const completedItemsList = timerState.completedItems
    .map(id => programItems.find(p => p.id === id))
    .filter(Boolean) as ProgramItem[];

  return {
    timerState,
    currentItem,
    nextItem,
    plannedSeconds,
    timeRemaining: Math.abs(timeRemaining),
    isOvertime,
    formatTime,
    startTimer,
    stopSection,
    nextSection,
    skipToSection,
    restoreSection,
    togglePause,
    resetEvent,
    getStatistics,
    saveStatistics,
    pendingItems: programItems.filter(item => !timerState.completedItems.includes(item.id)),
    completedItemsList,
    isLoading,
    sessionId,
  };
};
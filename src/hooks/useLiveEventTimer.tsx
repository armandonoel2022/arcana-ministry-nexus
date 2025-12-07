import { useState, useEffect, useRef, useCallback } from 'react';

interface ProgramItem {
  id: string;
  title: string;
  duration_minutes: number;
  time_slot: string;
  responsible_person?: string;
  completed?: boolean;
  actualDuration?: number;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentItemIndex: number;
  elapsedSeconds: number;
  preparationSeconds: number;
  isPreparationPhase: boolean;
  completedItems: string[];
  itemActualTimes: Record<string, number>; // itemId -> actual seconds
  eventStartTime: Date | null;
  eventEndTime: Date | null;
}

export const useLiveEventTimer = (programItems: ProgramItem[]) => {
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

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Start the timer for current section
  const startTimer = useCallback(() => {
    if (timerState.isRunning && !timerState.isPaused) return;

    setTimerState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      isPreparationPhase: false,
      preparationSeconds: 0,
      eventStartTime: prev.eventStartTime || new Date(),
    }));
  }, [timerState.isRunning, timerState.isPaused]);

  // Stop the current section and enter preparation phase
  const stopSection = useCallback(() => {
    if (!timerState.isRunning) return;

    const currentItem = programItems[timerState.currentItemIndex];
    if (!currentItem) return;

    setTimerState(prev => ({
      ...prev,
      isPreparationPhase: true,
      completedItems: [...prev.completedItems, currentItem.id],
      itemActualTimes: {
        ...prev.itemActualTimes,
        [currentItem.id]: prev.elapsedSeconds,
      },
    }));
  }, [timerState.isRunning, timerState.currentItemIndex, programItems]);

  // Move to next section
  const nextSection = useCallback(() => {
    const nextIndex = timerState.currentItemIndex + 1;
    
    if (nextIndex >= programItems.length) {
      // Event finished
      setTimerState(prev => ({
        ...prev,
        isRunning: false,
        isPaused: false,
        isPreparationPhase: false,
        eventEndTime: new Date(),
      }));
      return;
    }

    setTimerState(prev => ({
      ...prev,
      currentItemIndex: nextIndex,
      elapsedSeconds: 0,
      preparationSeconds: 0,
      isPreparationPhase: false,
      isRunning: false,
    }));
  }, [timerState.currentItemIndex, programItems.length]);

  // Skip to a specific section
  const skipToSection = useCallback((index: number) => {
    if (index < 0 || index >= programItems.length) return;

    setTimerState(prev => ({
      ...prev,
      currentItemIndex: index,
      elapsedSeconds: 0,
      preparationSeconds: 0,
      isPreparationPhase: false,
      isRunning: false,
      isPaused: false,
    }));
  }, [programItems.length]);

  // Pause/Resume
  const togglePause = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  }, []);

  // Reset entire event
  const resetEvent = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setTimerState({
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
  }, []);

  // Timer effect
  useEffect(() => {
    if (timerState.isRunning && !timerState.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.isPreparationPhase) {
            return { ...prev, preparationSeconds: prev.preparationSeconds + 1 };
          }
          return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
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
  }, [timerState.isRunning, timerState.isPaused]);

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
  const plannedSeconds = currentItem ? (currentItem.duration_minutes || 0) * 60 : 0;
  const timeRemaining = plannedSeconds - timerState.elapsedSeconds;
  const isOvertime = timeRemaining < 0;

  return {
    timerState,
    currentItem,
    plannedSeconds,
    timeRemaining: Math.abs(timeRemaining),
    isOvertime,
    formatTime,
    startTimer,
    stopSection,
    nextSection,
    skipToSection,
    togglePause,
    resetEvent,
    getStatistics,
    pendingItems: programItems.filter(item => !timerState.completedItems.includes(item.id)),
  };
};

import { useState, useEffect, useRef, useCallback } from 'react';

// Maximum work day duration: 8 hours in milliseconds
const WORK_DAY_DURATION = 8 * 60 * 60 * 1000;

export const useTimer = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const lastResumedAtRef = useRef(null);
  const accumulatedRef = useRef(0);

  // Converts milliseconds to { hours, minutes, seconds } strings
  const formatTime = useCallback((ms) => {
    const safeMs = Math.max(0, ms || 0);
    const totalSeconds = Math.floor(safeMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(seconds).padStart(2, '0'),
    };
  }, []);

  const progress = useCallback(() => {
    const percentage = timeElapsed / WORK_DAY_DURATION;
    return Math.min(10, Math.max(0, Math.ceil(percentage * 10)));
  }, [timeElapsed]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  const startInterval = useCallback(() => {
    if (!lastResumedAtRef.current) {
      return;
    }

    intervalRef.current = setInterval(() => {
      const elapsed = accumulatedRef.current + Math.max(0, Date.now() - lastResumedAtRef.current);
      setTimeElapsed(elapsed);
    }, 1000);
  }, []);

  const sync = useCallback((shift) => {
    clearTimer();

    if (!shift) {
      accumulatedRef.current = 0;
      lastResumedAtRef.current = null;
      setTimeElapsed(0);
      setIsRunning(false);
      setIsPaused(false);
      return;
    }

    const baseDuration = Math.max(0, shift.storedDurationMs ?? shift.durationMs ?? 0);
    accumulatedRef.current = baseDuration;

    if (shift.status === 'active' && shift.lastResumedAt) {
      // The backend already returns effective elapsed time for active shifts.
      // Continue ticking from that local snapshot to avoid negative values when
      // the device clock is slightly behind the server clock.
      accumulatedRef.current = Math.max(0, shift.durationMs ?? baseDuration);
      lastResumedAtRef.current = Date.now();
      setIsRunning(true);
      setIsPaused(false);
      setTimeElapsed(accumulatedRef.current);
      startInterval();
      return;
    }

    lastResumedAtRef.current = null;
    setTimeElapsed(Math.max(0, shift.durationMs ?? baseDuration));
    setIsRunning(false);
    setIsPaused(shift.status === 'paused');
  }, [clearTimer, startInterval]);

  const start = useCallback((shift) => {
    sync(shift);
  }, [sync]);

  const pause = useCallback((shift) => {
    sync(shift);
  }, [sync]);

  const reset = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setIsPaused(false);
    setTimeElapsed(0);
    accumulatedRef.current = 0;
    lastResumedAtRef.current = null;
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    timeElapsed,
    formattedTime: formatTime(timeElapsed),
    isRunning,
    isPaused,
    progress: progress(),
    start,
    pause,
    sync,
    reset,
  };
};
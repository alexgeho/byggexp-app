import { useState, useEffect, useRef, useCallback } from 'react';

const WORK_DAY_DURATION = 8 * 60 * 60 * 1000;

export const useTimer = () => {
  const [timeRemaining, setTimeRemaining] = useState(WORK_DAY_DURATION);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const endTimeRef = useRef(null);

  const formatTime = useCallback((ms) => {
    const totalSeconds = Math.floor(ms / 1000);
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
    const elapsed = WORK_DAY_DURATION - timeRemaining;
    const percentage = elapsed / WORK_DAY_DURATION;
    return Math.min(10, Math.max(0, Math.ceil(percentage * 10)));
  }, [timeRemaining]);

  const start = useCallback(() => {
    if (isPaused) {
      setIsPaused(false);
      setIsRunning(true);
      return;
    }

    setIsRunning(true);
    setIsPaused(false);
    endTimeRef.current = Date.now() + timeRemaining;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const remaining = endTimeRef.current - now;

      if (remaining <= 0) {
        setTimeRemaining(0);
        setIsRunning(false);
        setIsPaused(false);
        clearInterval(intervalRef.current);
      } else {
        setTimeRemaining(remaining);
      }
    }, 1000);
  }, [isPaused, timeRemaining]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsPaused(true);
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(WORK_DAY_DURATION);
    endTimeRef.current = undefined;
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const formattedTime = formatTime(timeRemaining);

  return {
    timeRemaining,
    formattedTime,
    isRunning,
    isPaused,
    progress: progress(),
    start,
    pause,
    reset,
  };
};

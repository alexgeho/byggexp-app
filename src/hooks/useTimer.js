import { useState, useEffect, useRef, useCallback } from 'react';

// Maximum work day duration: 8 hours in milliseconds
const WORK_DAY_DURATION = 8 * 60 * 60 * 1000;

export const useTimer = () => {
  // Total elapsed time in milliseconds
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // Whether the timer is actively counting
  const [isRunning, setIsRunning] = useState(false);
  
  // Whether the timer is paused (started but stopped temporarily)
  const [isPaused, setIsPaused] = useState(false);
  
  // Reference to the interval so we can clear it
  const intervalRef = useRef(null);
  
  // Timestamp when the current run segment started
  const startTimeRef = useRef(null);
  
  // Total time accumulated from previous run segments (before pauses)
  const accumulatedRef = useRef(0);

  // Converts milliseconds to { hours, minutes, seconds } strings
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

  // Returns a progress value from 0 to 10 based on elapsed vs work day duration
  const progress = useCallback(() => {
    const percentage = timeElapsed / WORK_DAY_DURATION;
    return Math.min(10, Math.max(0, Math.ceil(percentage * 10)));
  }, [timeElapsed]);

  // Starts or resumes the timer
  const start = useCallback(() => {
    if (isRunning) return;

    setIsRunning(true);
    setIsPaused(false);
    
    // Record when this segment started
    startTimeRef.current = Date.now();

    // Tick every second: elapsed = accumulated + current segment duration
    intervalRef.current = setInterval(() => {
      const elapsed = accumulatedRef.current + (Date.now() - startTimeRef.current);
      setTimeElapsed(elapsed);
    }, 1000);
  }, [isRunning]);

  // Pauses the timer and saves accumulated time
  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    
    // Save how much time has passed in this segment
    accumulatedRef.current += Date.now() - startTimeRef.current;
    setIsPaused(true);
    setIsRunning(false);
  }, []);

  // Resets the timer to zero
  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
    setIsRunning(false);
    setIsPaused(false);
    setTimeElapsed(0);
    accumulatedRef.current = 0;
    startTimeRef.current = null;
  }, []);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeElapsed,
    formattedTime: formatTime(timeElapsed),
    isRunning,
    isPaused,
    progress: progress(),
    start,
    pause,
    reset,
  };
};
import { useEffect, useRef } from "react";
import {
  subscribeToShiftAutoCompleted,
  subscribeToShiftAutoPaused,
  subscribeToShiftAutoResumed,
  subscribeToShiftAutoStarted,
  subscribeToShiftLocationCheckError,
} from "../utils/shiftExitAutoCompleteEvents";

const getShiftId = (shift) => shift?.id || shift?._id;
const getProjectId = (project) => project?._id || project?.id;

export const useShiftGeofenceSync = ({
  currentShift,
  selectedProject,
  onShiftAutoCompleted,
  onShiftAutoStarted,
  onShiftAutoResumed,
  onShiftAutoPaused,
  onCheckError,
}) => {
  const handledShiftIdRef = useRef(null);
  const callbacksRef = useRef({
    onShiftAutoCompleted,
    onShiftAutoStarted,
    onShiftAutoResumed,
    onShiftAutoPaused,
    onCheckError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onShiftAutoCompleted,
      onShiftAutoStarted,
      onShiftAutoResumed,
      onShiftAutoPaused,
      onCheckError,
    };
  }, [
    onShiftAutoCompleted,
    onShiftAutoStarted,
    onShiftAutoResumed,
    onShiftAutoPaused,
    onCheckError,
  ]);

  useEffect(() => {
    const shiftId = getShiftId(currentShift);
    const selectedProjectId = getProjectId(selectedProject);

    const unsubscribeAutoCompleted = subscribeToShiftAutoCompleted(
      async (completedShift, meta) => {
        const completedShiftId = getShiftId(completedShift);

        if (!shiftId || shiftId !== completedShiftId) {
          return;
        }

        if (handledShiftIdRef.current === completedShiftId) {
          return;
        }

        handledShiftIdRef.current = completedShiftId;
        await callbacksRef.current.onShiftAutoCompleted?.(completedShift, meta);
      },
    );

    const unsubscribeAutoStarted = subscribeToShiftAutoStarted(
      async (startedShift) => {
        const startedProjectId = startedShift?.projectId;
        const startedShiftId = getShiftId(startedShift);

        if (
          selectedProjectId &&
          startedProjectId &&
          selectedProjectId !== startedProjectId
        ) {
          return;
        }

        if (shiftId && startedShiftId && shiftId === startedShiftId) {
          return;
        }

        await callbacksRef.current.onShiftAutoStarted?.(startedShift);
      },
    );

    // A resume can arrive while the screen has no shift loaded yet (the app was
    // reopened after a background transition), so match on the project as well
    // as on the shift id rather than requiring a local shift to already exist.
    const unsubscribeAutoResumed = subscribeToShiftAutoResumed(
      async (resumedShift) => {
        const resumedShiftId = getShiftId(resumedShift);
        const resumedProjectId = resumedShift?.projectId;

        if (shiftId && resumedShiftId && shiftId !== resumedShiftId) {
          return;
        }

        if (
          !shiftId &&
          selectedProjectId &&
          resumedProjectId &&
          selectedProjectId !== resumedProjectId
        ) {
          return;
        }

        handledShiftIdRef.current = null;
        await callbacksRef.current.onShiftAutoResumed?.(resumedShift);
      },
    );

    const unsubscribeAutoPaused = subscribeToShiftAutoPaused(
      async (pausedShift) => {
        const pausedShiftId = getShiftId(pausedShift);

        if (!shiftId || !pausedShiftId || shiftId !== pausedShiftId) {
          return;
        }

        await callbacksRef.current.onShiftAutoPaused?.(pausedShift);
      },
    );

    const unsubscribeCheckError = subscribeToShiftLocationCheckError(
      async (error) => {
        await callbacksRef.current.onCheckError?.(error);
      },
    );

    return () => {
      unsubscribeAutoCompleted();
      unsubscribeAutoStarted();
      unsubscribeAutoResumed();
      unsubscribeAutoPaused();
      unsubscribeCheckError();
    };
  }, [currentShift, selectedProject]);
};

export const useShiftExitAutoComplete = (options) =>
  useShiftGeofenceSync(options);

export default useShiftGeofenceSync;

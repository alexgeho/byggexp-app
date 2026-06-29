import { useEffect, useRef } from "react";
import {
  subscribeToShiftAutoCompleted,
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
  onCheckError,
}) => {
  const handledShiftIdRef = useRef(null);
  const callbacksRef = useRef({
    onShiftAutoCompleted,
    onShiftAutoStarted,
    onShiftAutoResumed,
    onCheckError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onShiftAutoCompleted,
      onShiftAutoStarted,
      onShiftAutoResumed,
      onCheckError,
    };
  }, [
    onShiftAutoCompleted,
    onShiftAutoStarted,
    onShiftAutoResumed,
    onCheckError,
  ]);

  useEffect(() => {
    const shiftId = getShiftId(currentShift);
    const selectedProjectId = getProjectId(selectedProject);

    const unsubscribeAutoCompleted = subscribeToShiftAutoCompleted(
      async (completedShift) => {
        const completedShiftId = getShiftId(completedShift);

        if (!shiftId || shiftId !== completedShiftId) {
          return;
        }

        if (handledShiftIdRef.current === completedShiftId) {
          return;
        }

        handledShiftIdRef.current = completedShiftId;
        await callbacksRef.current.onShiftAutoCompleted?.(completedShift);
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

    const unsubscribeAutoResumed = subscribeToShiftAutoResumed(
      async (resumedShift) => {
        const resumedShiftId = getShiftId(resumedShift);

        if (!shiftId || shiftId !== resumedShiftId) {
          return;
        }

        await callbacksRef.current.onShiftAutoResumed?.(resumedShift);
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
      unsubscribeCheckError();
    };
  }, [currentShift, selectedProject]);
};

export const useShiftExitAutoComplete = (options) =>
  useShiftGeofenceSync(options);

export default useShiftGeofenceSync;

import { useEffect, useRef } from "react";

import { shiftLocationPolicy } from "../config/shiftLocationPolicy";
import { projectService, shiftService } from "../services";
import { isWithinProjectLocation } from "../utils/shiftLocationGuard";

const MONITORED_SHIFT_STATUSES = new Set(["active", "paused"]);

const getProjectId = (project) => project?._id || project?.id;
const getShiftId = (shift) => shift?.id || shift?._id;

export const useShiftExitAutoComplete = ({
  currentShift,
  selectedProject,
  onShiftAutoCompleted,
  onCheckError,
}) => {
  const isCheckingRef = useRef(false);
  const completedShiftIdRef = useRef(null);
  const projectCacheRef = useRef(new Map());
  const callbacksRef = useRef({
    onShiftAutoCompleted,
    onCheckError,
  });

  useEffect(() => {
    callbacksRef.current = {
      onShiftAutoCompleted,
      onCheckError,
    };
  }, [onShiftAutoCompleted, onCheckError]);

  useEffect(() => {
    const shiftId = getShiftId(currentShift);
    const selectedProjectId = getProjectId(selectedProject);

    if (
      !shiftLocationPolicy.enabled ||
      !shiftId ||
      !MONITORED_SHIFT_STATUSES.has(currentShift?.status)
    ) {
      return undefined;
    }

    let cancelled = false;

    const getShiftProject = async () => {
      if (selectedProjectId === currentShift.projectId && selectedProject) {
        return selectedProject;
      }

      const cachedProject = projectCacheRef.current.get(currentShift.projectId);
      if (cachedProject) {
        return cachedProject;
      }

      const loadedProject = await projectService.getById(currentShift.projectId);
      projectCacheRef.current.set(currentShift.projectId, loadedProject);

      return loadedProject;
    };

    const verifyShiftLocation = async () => {
      if (
        cancelled ||
        isCheckingRef.current ||
        completedShiftIdRef.current === shiftId
      ) {
        return;
      }

      isCheckingRef.current = true;

      try {
        const project = await getShiftProject().catch(() => null);
        const isWithinBounds = await isWithinProjectLocation({
          project,
          fallbackProjectLocation: currentShift.location,
        });

        if (cancelled || isWithinBounds) {
          return;
        }

        const completedShift = await shiftService.complete(shiftId, {
          reason: 'outside_project_area',
          source: 'mobile_location_guard',
          notifyUser: true,
        });
        completedShiftIdRef.current = shiftId;

        if (!cancelled) {
          await callbacksRef.current.onShiftAutoCompleted?.(completedShift);
        }
      } catch (error) {
        if (!cancelled) {
          callbacksRef.current.onCheckError?.(error);
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    verifyShiftLocation();

    const intervalId = setInterval(
      verifyShiftLocation,
      shiftLocationPolicy.checkIntervalMs,
    );

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [currentShift, selectedProject]);
};

export default useShiftExitAutoComplete;

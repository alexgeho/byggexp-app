import React, { useCallback, useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";

import AuthContext from "../contexts/AuthContext";
import { projectService, shiftService } from "../services";
import { shiftLocationPolicy } from "../config/shiftLocationPolicy";
import { isWithinProjectLocation } from "../utils/shiftLocationGuard";
import {
  emitShiftAutoCompleted,
  emitShiftLocationCheckError,
} from "../utils/shiftExitAutoCompleteEvents";

const MONITORED_SHIFT_STATUSES = new Set(["active", "paused"]);

const getProjectId = (project) => project?._id || project?.id;
const getShiftId = (shift) => shift?.id || shift?._id;

export default function ShiftLocationMonitor() {
  const { isAuthenticated, selectedProject } = useContext(AuthContext);
  const isCheckingRef = useRef(false);
  const completedShiftIdRef = useRef(null);
  const projectCacheRef = useRef(new Map());
  const selectedProjectRef = useRef(selectedProject);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;
  }, [selectedProject]);

  const getShiftProject = useCallback(async (shift) => {
    const currentSelectedProject = selectedProjectRef.current;
    const selectedProjectId = getProjectId(currentSelectedProject);

    if (
      selectedProjectId &&
      selectedProjectId === shift.projectId &&
      currentSelectedProject
    ) {
      return currentSelectedProject;
    }

    const cachedProject = projectCacheRef.current.get(shift.projectId);
    if (cachedProject) {
      return cachedProject;
    }

    const loadedProject = await projectService.getById(shift.projectId);
    projectCacheRef.current.set(shift.projectId, loadedProject);

    return loadedProject;
  }, []);

  const verifyActiveShiftLocation = useCallback(async () => {
    if (
      !isAuthenticated ||
      !shiftLocationPolicy.enabled ||
      isCheckingRef.current
    ) {
      return;
    }

    isCheckingRef.current = true;

    try {
      const currentShift = await shiftService.getCurrent();
      const shiftId = getShiftId(currentShift);

      if (
        !shiftId ||
        !MONITORED_SHIFT_STATUSES.has(currentShift?.status)
      ) {
        completedShiftIdRef.current = null;
        return;
      }

      if (completedShiftIdRef.current === shiftId) {
        return;
      }

      const project = await getShiftProject(currentShift).catch(() => null);
      const isWithinBounds = await isWithinProjectLocation({
        project,
        fallbackProjectLocation: currentShift.location,
      });

      if (isWithinBounds) {
        return;
      }

      const completedShift = await shiftService.complete(shiftId, {
        reason: "outside_project_area",
        source: "mobile_location_guard",
        notifyUser: true,
      });
      completedShiftIdRef.current = shiftId;
      await emitShiftAutoCompleted(completedShift);
    } catch (error) {
      await emitShiftLocationCheckError(error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [getShiftProject, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !shiftLocationPolicy.enabled) {
      return undefined;
    }

    verifyActiveShiftLocation();

    const intervalId = setInterval(
      verifyActiveShiftLocation,
      shiftLocationPolicy.checkIntervalMs,
    );

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        verifyActiveShiftLocation();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [isAuthenticated, verifyActiveShiftLocation]);

  return null;
}

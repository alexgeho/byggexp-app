import { useCallback, useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Device from "expo-device";

import AuthContext from "../contexts/AuthContext";
import { projectService, shiftService } from "../services";
import { shiftLocationPolicy } from "../config/shiftLocationPolicy";
import {
  getShiftLocationCheck,
  isWithinProjectLocation,
  startShiftWithLocationGuard,
} from "../utils/shiftLocationGuard";
import {
  emitShiftAutoCompleted,
  emitShiftAutoStarted,
  emitShiftLocationCheckError,
} from "../utils/shiftExitAutoCompleteEvents";
import {
  hasBackgroundLocationPermission,
  isBackgroundGeofencingSupported,
  stopShiftGeofencing,
  syncShiftGeofenceForProject,
} from "../utils/backgroundGeofence";

const MONITORED_SHIFT_STATUSES = new Set(["active", "paused"]);

const getProjectId = (project) => project?._id || project?.id;
const getShiftId = (shift) => shift?.id || shift?._id;

export default function ShiftLocationMonitor() {
  const { isAuthenticated, selectedProject } = useContext(AuthContext);
  const isCheckingRef = useRef(false);
  const completedShiftIdRef = useRef(null);
  const startedProjectIdRef = useRef(null);
  const shiftGeofenceInsideRef = useRef(null);
  const selectedGeofenceInsideRef = useRef(null);
  const projectCacheRef = useRef(new Map());
  const selectedProjectRef = useRef(selectedProject);
  // When the OS-level geofence is active it handles auto start/stop even while
  // the app is closed, so the foreground timer must NOT also fire (that would
  // double check-in/out). These refs track what we've registered with the OS.
  const backgroundActiveRef = useRef(false);
  const geofencedProjectIdRef = useRef(null);

  useEffect(() => {
    selectedProjectRef.current = selectedProject;
    selectedGeofenceInsideRef.current = null;
    startedProjectIdRef.current = null;
  }, [selectedProject]);

  // Register (or refresh) the OS geofence for the given project. Returns true
  // when a background geofence is now active for it, meaning the foreground
  // loop should stand down for this cycle.
  const syncBackgroundGeofence = useCallback(
    async (project, fallbackProjectLocation) => {
      if (!isBackgroundGeofencingSupported()) {
        return false;
      }

      if (!(await hasBackgroundLocationPermission())) {
        backgroundActiveRef.current = false;
        geofencedProjectIdRef.current = null;
        return false;
      }

      const projectId = getProjectId(project) || null;
      if (
        backgroundActiveRef.current &&
        geofencedProjectIdRef.current === projectId
      ) {
        return true;
      }

      const active = await syncShiftGeofenceForProject({
        project,
        fallbackProjectLocation,
      }).catch(() => false);

      backgroundActiveRef.current = active;
      geofencedProjectIdRef.current = active ? projectId : null;
      return active;
    },
    [],
  );

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

  const getSelectedProject = useCallback(async () => {
    const currentSelectedProject = selectedProjectRef.current;
    const selectedProjectId = getProjectId(currentSelectedProject);

    if (!selectedProjectId) {
      return null;
    }

    if (
      currentSelectedProject?.locationLatitude != null &&
      currentSelectedProject?.locationLongitude != null
    ) {
      return currentSelectedProject;
    }

    const cachedProject = projectCacheRef.current.get(selectedProjectId);
    if (cachedProject) {
      return cachedProject;
    }

    const loadedProject = await projectService.getById(selectedProjectId);
    projectCacheRef.current.set(selectedProjectId, loadedProject);

    return loadedProject;
  }, []);

  const completeShiftOutsideArea = useCallback(async (shiftId) => {
    if (completedShiftIdRef.current === shiftId) {
      return;
    }

    const completedShift = await shiftService.complete(shiftId, {
      reason: "outside_project_area",
      source: "mobile_geofence_checkout",
      notifyUser: true,
    });

    completedShiftIdRef.current = shiftId;
    startedProjectIdRef.current = null;
    await emitShiftAutoCompleted(completedShift);
  }, []);

  const verifyOpenShiftGeofence = useCallback(
    async (currentShift) => {
      const shiftId = getShiftId(currentShift);
      const project = await getShiftProject(currentShift).catch(() => null);
      const isWithinBounds = await isWithinProjectLocation({
        project,
        fallbackProjectLocation: currentShift.location,
      });

      if (!isWithinBounds) {
        if (
          shiftLocationPolicy.autoCheckOutEnabled &&
          completedShiftIdRef.current !== shiftId
        ) {
          await completeShiftOutsideArea(shiftId);
        }

        shiftGeofenceInsideRef.current = false;
        return;
      }

      shiftGeofenceInsideRef.current = true;
      completedShiftIdRef.current = null;
    },
    [completeShiftOutsideArea, getShiftProject],
  );

  const verifySelectedProjectCheckIn = useCallback(async () => {
    if (!shiftLocationPolicy.autoCheckInEnabled) {
      return;
    }

    // Simulators/emulators have no real GPS (location is faked to a fixed
    // coordinate), so auto check-in would fire spuriously. Only run on
    // physical devices.
    if (!Device.isDevice) {
      return;
    }

    const project = await getSelectedProject().catch(() => null);
    const projectId = getProjectId(project);

    if (!projectId) {
      selectedGeofenceInsideRef.current = null;
      return;
    }

    let locationCheck;
    try {
      locationCheck = await getShiftLocationCheck({
        project,
        fallbackProjectLocation: project?.location,
      });
    } catch {
      // Can't verify the location (e.g. the address won't geocode) — never
      // auto-start a shift when we're unsure.
      selectedGeofenceInsideRef.current = false;
      startedProjectIdRef.current = null;
      return;
    }

    // Only auto check-in when the project has a real geofence AND we're inside
    // it. A project without saved coordinates/address must NOT auto-start a
    // shift (previously "no geofence" was treated as "always inside").
    const isWithinBounds =
      locationCheck.enforced &&
      locationCheck.distanceMeters <= locationCheck.maxDistanceMeters;

    if (!isWithinBounds) {
      selectedGeofenceInsideRef.current = false;
      startedProjectIdRef.current = null;
      return;
    }

    const enteredProjectArea = selectedGeofenceInsideRef.current !== true;
    selectedGeofenceInsideRef.current = true;

    if (!enteredProjectArea || startedProjectIdRef.current === projectId) {
      return;
    }

    try {
      const startedShift = await startShiftWithLocationGuard({
        projectId,
        project,
        fallbackProjectLocation: project?.location,
        skipLocationCheck: true,
      });

      startedProjectIdRef.current = projectId;
      completedShiftIdRef.current = null;
      shiftGeofenceInsideRef.current = true;
      await emitShiftAutoStarted(startedShift);
    } catch (error) {
      await emitShiftLocationCheckError(error);
    }
  }, [getSelectedProject]);

  const verifyGeofence = useCallback(async () => {
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

      if (shiftId && MONITORED_SHIFT_STATUSES.has(currentShift?.status)) {
        // Monitor the running shift's project for exit. If the OS geofence is
        // active it handles auto-checkout in the background; stand down here.
        const shiftProject = await getShiftProject(currentShift).catch(
          () => null,
        );
        const backgroundActive = await syncBackgroundGeofence(
          shiftProject,
          currentShift.location,
        );
        if (backgroundActive) {
          return;
        }

        await verifyOpenShiftGeofence(currentShift);
        return;
      }

      shiftGeofenceInsideRef.current = null;
      completedShiftIdRef.current = null;

      // No open shift: watch the selected project for entry. If the OS geofence
      // is active it handles auto-checkin in the background; stand down here.
      const selectedProjectForGeofence = await getSelectedProject().catch(
        () => null,
      );
      const backgroundActive = await syncBackgroundGeofence(
        selectedProjectForGeofence,
      );
      if (backgroundActive) {
        return;
      }

      await verifySelectedProjectCheckIn();
    } catch (error) {
      await emitShiftLocationCheckError(error);
    } finally {
      isCheckingRef.current = false;
    }
  }, [
    isAuthenticated,
    verifyOpenShiftGeofence,
    verifySelectedProjectCheckIn,
    getShiftProject,
    getSelectedProject,
    syncBackgroundGeofence,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !shiftLocationPolicy.enabled) {
      // Signed out or disabled: tear down any OS geofence so the background
      // task can't fire shift calls without a valid session.
      backgroundActiveRef.current = false;
      geofencedProjectIdRef.current = null;
      void stopShiftGeofencing();
      return undefined;
    }

    verifyGeofence();

    const intervalId = setInterval(
      verifyGeofence,
      shiftLocationPolicy.checkIntervalMs,
    );

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        verifyGeofence();
      }
    });

    return () => {
      clearInterval(intervalId);
      subscription.remove();
    };
  }, [isAuthenticated, verifyGeofence]);

  return null;
}

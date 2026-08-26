import { useCallback, useContext, useEffect, useRef } from "react";
import { AppState } from "react-native";
import * as Device from "expo-device";
import * as Location from "expo-location";

import AuthContext from "../contexts/AuthContext";
import { projectService, shiftService } from "../services";
import { shiftLocationPolicy } from "../config/shiftLocationPolicy";
import { getShiftLocationCheck } from "../utils/shiftLocationGuard";
import { emitShiftLocationCheckError } from "../utils/shiftExitAutoCompleteEvents";
import { runGeofenceObservation } from "../utils/geofenceRunner";
import { GEOFENCE_INSIDE, GEOFENCE_OUTSIDE } from "../utils/geofenceEvaluation";
import {
  hasLocationTaskPermission,
  isBackgroundGeofencingSupported,
  isBackgroundMonitorStale,
  stopShiftGeofencing,
  syncShiftGeofenceForProject,
} from "../utils/backgroundGeofence";

const MONITORED_SHIFT_STATUSES = new Set(["active", "paused"]);

const getProjectId = (project) => project?._id || project?.id;

// Identifies the area a project currently resolves to. Any change to it means
// the registered geofence is stale and has to be re-registered.
const getGeofenceSignature = (project, fallbackProjectLocation) =>
  [
    getProjectId(project) || "",
    project?.locationLatitude ?? "",
    project?.locationLongitude ?? "",
    project?.locationRadiusMeters ?? "",
    project?.location ?? fallbackProjectLocation ?? "",
  ].join("|");
const getShiftId = (shift) => shift?.id || shift?._id;

export default function ShiftLocationMonitor() {
  const { isAuthenticated, selectedProject } = useContext(AuthContext);
  const isCheckingRef = useRef(false);
  const pausedShiftIdRef = useRef(null);
  const startedProjectIdRef = useRef(null);
  const shiftGeofenceInsideRef = useRef(null);
  const selectedGeofenceInsideRef = useRef(null);
  const projectCacheRef = useRef(new Map());
  const selectedProjectRef = useRef(selectedProject);
  // When the OS-level geofence is active it handles auto start/stop even while
  // the app is closed, so the foreground timer must NOT also fire (that would
  // double check-in/out). These refs track what we've registered with the OS.
  const backgroundActiveRef = useRef(false);
  const geofenceSignatureRef = useRef(null);

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

      if (!(await hasLocationTaskPermission())) {
        backgroundActiveRef.current = false;
        geofenceSignatureRef.current = null;
        return false;
      }

      // Keyed on the area, not just the project: editing a project's address,
      // coordinates or radius moves its geofence, and skipping the refresh on
      // a matching id alone left the monitor watching the previous location.
      const signature = getGeofenceSignature(project, fallbackProjectLocation);
      if (
        backgroundActiveRef.current &&
        geofenceSignatureRef.current === signature
      ) {
        return true;
      }

      const active = await syncShiftGeofenceForProject({
        project,
        fallbackProjectLocation,
      }).catch(() => false);

      backgroundActiveRef.current = active;
      geofenceSignatureRef.current = active ? signature : null;
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

  // Same evaluation the background task runs, against the same persisted state:
  // one accuracy band, one hysteresis margin, one confirmation counter. A
  // high-accuracy fix is requested here because this path only runs when the
  // app is open, and a Balanced reading is too coarse for the strict band.
  const verifyOpenShiftGeofence = useCallback(
    async (currentShift) => {
      const project = await getShiftProject(currentShift).catch(() => null);
      const locationCheck = await getShiftLocationCheck({
        project,
        fallbackProjectLocation: currentShift.location,
        accuracy: Location.Accuracy.High,
      });

      if (!locationCheck.enforced) {
        return;
      }

      const { verdict } = await runGeofenceObservation({
        distanceMeters: locationCheck.distanceMeters,
        accuracyMeters: locationCheck.accuracyMeters,
        radiusMeters: locationCheck.maxDistanceMeters,
        projectId: currentShift.projectId,
      });

      if (verdict === GEOFENCE_OUTSIDE) {
        shiftGeofenceInsideRef.current = false;
        pausedShiftIdRef.current = getShiftId(currentShift);
        startedProjectIdRef.current = null;
        return;
      }

      if (verdict === GEOFENCE_INSIDE) {
        shiftGeofenceInsideRef.current = true;
        pausedShiftIdRef.current = null;
        startedProjectIdRef.current = currentShift.projectId;
      }
    },
    [getShiftProject],
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
        accuracy: Location.Accuracy.High,
      });
    } catch {
      // Can't verify the location (e.g. the address won't geocode) — never
      // auto-start a shift when we're unsure.
      selectedGeofenceInsideRef.current = false;
      startedProjectIdRef.current = null;
      return;
    }

    // Only auto check-in when the project has a real geofence. A project
    // without saved coordinates or a resolvable address must NOT auto-start a
    // shift (previously "no geofence" was treated as "always inside").
    if (!locationCheck.enforced) {
      selectedGeofenceInsideRef.current = false;
      startedProjectIdRef.current = null;
      return;
    }

    const { verdict } = await runGeofenceObservation({
      distanceMeters: locationCheck.distanceMeters,
      accuracyMeters: locationCheck.accuracyMeters,
      radiusMeters: locationCheck.maxDistanceMeters,
      projectId,
    });

    if (verdict === GEOFENCE_INSIDE) {
      selectedGeofenceInsideRef.current = true;
      startedProjectIdRef.current = projectId;
      pausedShiftIdRef.current = null;
      shiftGeofenceInsideRef.current = true;
      return;
    }

    if (verdict === GEOFENCE_OUTSIDE) {
      selectedGeofenceInsideRef.current = false;
      startedProjectIdRef.current = null;
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
        // Only stand down while the background monitor is actually reporting.
        // A silenced service (Doze, battery optimisation, OEM task killer) stays
        // registered, and deferring to it left the shift running even with the
        // app open and a usable fix available.
        if (backgroundActive && !(await isBackgroundMonitorStale())) {
          return;
        }

        await verifyOpenShiftGeofence(currentShift);
        return;
      }

      shiftGeofenceInsideRef.current = null;
      pausedShiftIdRef.current = null;

      // No open shift: watch the selected project for entry. If the OS geofence
      // is active it handles auto-checkin in the background; stand down here.
      const selectedProjectForGeofence = await getSelectedProject().catch(
        () => null,
      );
      const backgroundActive = await syncBackgroundGeofence(
        selectedProjectForGeofence,
      );
      if (backgroundActive && !(await isBackgroundMonitorStale())) {
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
      geofenceSignatureRef.current = null;
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

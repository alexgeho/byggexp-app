import * as Device from "expo-device";
import * as Location from "expo-location";

import projectService from "../services/project.service";
import { shiftService } from "../services";
import { shiftLocationPolicy } from "../config/shiftLocationPolicy";
import {
  findExistingShiftForProject,
  isShiftAlreadyExistsError,
  isShiftNotActiveError,
  isShiftNotPausedError,
  reportUnrecoverableShiftConflict,
} from "./shiftConflict";
import { runExclusive } from "./shiftTransitionQueue";
import {
  getShiftScheduleWindow,
  getStartWindowErrorMessage,
} from "./shiftSchedule";

const DEFAULT_EMULATOR_COORDINATE = {
  latitude: 59.3293,
  longitude: 18.0686,
};

const ensureLocationPermission = async () => {
  const currentPermission = await Location.getForegroundPermissionsAsync();
  if (currentPermission.status === "granted") {
    return;
  }

  const requestedPermission =
    await Location.requestForegroundPermissionsAsync();
  if (requestedPermission.status !== "granted") {
    throw new Error(
      "Location permission is required to start a shift at this project.",
    );
  }
};

const getCurrentShiftCoordinate = async (accuracy) => {
  if (!Device.isDevice) {
    return { ...DEFAULT_EMULATOR_COORDINATE, accuracyMeters: null };
  }

  await ensureLocationPermission();

  const currentPosition = await Location.getCurrentPositionAsync({
    accuracy: accuracy ?? Location.Accuracy.Balanced,
    timeout: 15000,
  });

  return {
    latitude: currentPosition.coords.latitude,
    longitude: currentPosition.coords.longitude,
    // Carried through so automatic decisions can weigh the fix the same way the
    // background task does. The manual guard ignores it on purpose.
    accuracyMeters: currentPosition.coords.accuracy ?? null,
  };
};

const geocodeProjectLocation = async (address) => {
  const normalizedAddress = address?.trim();
  if (!normalizedAddress) {
    return null;
  }

  try {
    const matches = await Location.geocodeAsync(normalizedAddress);
    if (matches.length > 0) {
      return {
        latitude: matches[0].latitude,
        longitude: matches[0].longitude,
      };
    }
  } catch {}

  try {
    const data = await projectService.searchAddressSuggestions(
      normalizedAddress,
      1,
    );
    const firstMatch = Array.isArray(data) ? data[0] : null;

    if (!firstMatch?.latitude || !firstMatch?.longitude) {
      return null;
    }

    return {
      latitude: Number(firstMatch.latitude),
      longitude: Number(firstMatch.longitude),
    };
  } catch {}

  return null;
};

const hasValidCoordinate = (value) =>
  typeof value === "number" && Number.isFinite(value);

const getProjectMaxDistanceMeters = (project) => {
  const radius = Number(project?.locationRadiusMeters);

  if (Number.isFinite(radius) && radius > 0) {
    return radius;
  }

  return shiftLocationPolicy.maxDistanceMeters;
};

const getSavedProjectCoordinate = (project) => {
  const latitude = project?.locationLatitude;
  const longitude = project?.locationLongitude;

  if (!hasValidCoordinate(latitude) || !hasValidCoordinate(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const toRadians = (value) => (value * Math.PI) / 180;

export const calculateDistanceMeters = (
  sourceLatitude,
  sourceLongitude,
  targetLatitude,
  targetLongitude,
) => {
  const earthRadiusMeters = 6371000;
  const latitudeDelta = toRadians(targetLatitude - sourceLatitude);
  const longitudeDelta = toRadians(targetLongitude - sourceLongitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(sourceLatitude)) *
      Math.cos(toRadians(targetLatitude)) *
      Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const resolveProjectCoordinate = async ({
  project,
  fallbackProjectLocation,
}) => {
  const projectLocation =
    project?.location?.trim?.() || fallbackProjectLocation?.trim?.() || "";
  const savedProjectCoordinate = getSavedProjectCoordinate(project);

  if (
    !shiftLocationPolicy.enabled ||
    (!projectLocation && !savedProjectCoordinate)
  ) {
    return {
      enforced: false,
      projectCoordinate: null,
    };
  }

  const geocodedProjectCoordinate = savedProjectCoordinate
    ? null
    : await geocodeProjectLocation(projectLocation);
  const projectCoordinate = savedProjectCoordinate || geocodedProjectCoordinate;

  if (!projectCoordinate) {
    throw new Error(
      "Unable to verify the project location. Save project coordinates or update the project address before starting a shift.",
    );
  }

  return {
    enforced: true,
    projectCoordinate,
  };
};

export const getShiftLocationCheck = async ({
  project,
  fallbackProjectLocation,
  accuracy,
}) => {
  const maxDistanceMeters = getProjectMaxDistanceMeters(project);
  const resolvedProjectCoordinate = await resolveProjectCoordinate({
    project,
    fallbackProjectLocation,
  });

  if (!resolvedProjectCoordinate.enforced) {
    return {
      enforced: false,
      distanceMeters: 0,
      maxDistanceMeters,
      accuracyMeters: null,
    };
  }

  const currentCoordinate = await getCurrentShiftCoordinate(accuracy);
  const distanceMeters = calculateDistanceMeters(
    currentCoordinate.latitude,
    currentCoordinate.longitude,
    resolvedProjectCoordinate.projectCoordinate.latitude,
    resolvedProjectCoordinate.projectCoordinate.longitude,
  );

  return {
    enforced: true,
    accuracyMeters: currentCoordinate.accuracyMeters,
    distanceMeters,
    maxDistanceMeters,
  };
};

// Resolve a native geofencing region for a project: its coordinate (saved or
// geocoded) and radius. Returns null when the project has no usable location,
// so callers can decide not to register a geofence. Used by the OS-level
// background geofence (expo-location + expo-task-manager).
export const resolveProjectGeofenceRegion = async ({
  project,
  fallbackProjectLocation,
} = {}) => {
  const identifier = project?._id || project?.id;
  if (!identifier) {
    return null;
  }

  let resolved;
  try {
    resolved = await resolveProjectCoordinate({
      project,
      fallbackProjectLocation,
    });
  } catch {
    // Address won't geocode / no coordinates — no reliable geofence.
    return null;
  }

  if (!resolved.enforced || !resolved.projectCoordinate) {
    return null;
  }

  return {
    identifier: String(identifier),
    latitude: resolved.projectCoordinate.latitude,
    longitude: resolved.projectCoordinate.longitude,
    radius: getProjectMaxDistanceMeters(project),
  };
};

export const isWithinProjectLocation = async (options) => {
  const locationCheck = await getShiftLocationCheck(options);

  return (
    !locationCheck.enforced ||
    locationCheck.distanceMeters <= locationCheck.maxDistanceMeters
  );
};

export const assertShiftScheduleAllowsStart = (project) => {
  const window = getShiftScheduleWindow(project?.shiftSchedule);

  if (window.enforced && !window.canStart) {
    throw new Error(getStartWindowErrorMessage(window));
  }
};

// The single gate for "may this worker begin logging time on this project right
// now" — schedule window + on-site geofence. Throws with a user-facing message
// when either check fails. Shared by starting/resuming a shift AND by manual
// hours entry, so logging by hand can never bypass the on-site requirement.
export const assertShiftStartAllowed = async ({
  project,
  fallbackProjectLocation,
  skipLocationCheck = false,
} = {}) => {
  assertShiftScheduleAllowsStart(project);

  if (skipLocationCheck) {
    return;
  }

  const locationCheck = await getShiftLocationCheck({
    project,
    fallbackProjectLocation,
  });

  if (
    locationCheck.enforced &&
    locationCheck.distanceMeters > locationCheck.maxDistanceMeters
  ) {
    throw new Error(
      `You are not at the project location. Move within ${locationCheck.maxDistanceMeters} meters of the project to start a shift.`,
    );
  }
};

export const startShiftWithLocationGuard = async ({
  projectId,
  project,
  fallbackProjectLocation,
  skipLocationCheck = false,
}) => {
  if (!projectId) {
    throw new Error("Project is required to start a shift.");
  }

  await assertShiftStartAllowed({
    project,
    fallbackProjectLocation,
    skipLocationCheck,
  });

  // The start and its conflict recovery run as one queued operation, so an
  // automatic transition cannot slip between them and leave the recovery acting
  // on a shift state it never observed.
  return runExclusive(async () => {
    try {
      return await shiftService.start(projectId);
    } catch (error) {
      if (!isShiftAlreadyExistsError(error)) {
        throw error;
      }

      // Today's shift for this project already exists. The location and
      // schedule checks above have already passed, so resume it instead of
      // showing the backend's "Resume it instead" message as an error.
      const existingShift = await findExistingShiftForProject(projectId);
      const existingShiftId = existingShift?.id || existingShift?._id;

      if (!existingShiftId) {
        reportUnrecoverableShiftConflict(projectId, error);
        throw error;
      }

      if (existingShift.status === "active") {
        return existingShift;
      }

      return shiftService.resume(existingShiftId);
    }
  });
};

export const resumeShiftWithGuards = async ({
  shiftId,
  project,
  skipLocationCheck = false,
}) => {
  if (!shiftId) {
    throw new Error("Shift is required to resume.");
  }

  await assertShiftStartAllowed({
    project,
    fallbackProjectLocation: project?.location,
    skipLocationCheck,
  });

  return runExclusive(async () => {
    try {
      return await shiftService.resume(shiftId);
    } catch (error) {
      if (!isShiftNotPausedError(error)) {
        throw error;
      }

      // The shift stopped being paused between the screen reading its state
      // and this call — the geofence monitor resumes a shift on its own as soon
      // as the worker is back inside the area. Pressing Play wanted it running,
      // and it is, so reconcile with the server instead of reporting a state
      // error the worker can do nothing about.
      const currentShift = await findExistingShiftForProject(
        project?._id || project?.id,
      );

      if (currentShift?.status === "active") {
        return currentShift;
      }

      throw error;
    }
  });
};

// Manual Pause, serialized and reconciled the same way as Play. The geofence
// monitor pauses a shift on its own when the worker leaves the area, so a tap
// that started from a "running" screen can reach the backend after the shift is
// already paused.
export const pauseShiftSerialized = ({ shiftId, projectId }) => {
  if (!shiftId) {
    throw new Error("Shift is required to pause.");
  }

  return runExclusive(async () => {
    try {
      return await shiftService.pause(shiftId);
    } catch (error) {
      if (!isShiftNotActiveError(error)) {
        throw error;
      }

      const currentShift = await findExistingShiftForProject(projectId);

      if (currentShift?.status === "paused") {
        return currentShift;
      }

      throw error;
    }
  });
};

// Completing a shift outside the queue could overlap a geofence pause that is
// still in flight, so manual stops go through the same slot.
export const completeShiftSerialized = (shiftId, payload) => {
  if (!shiftId) {
    throw new Error("Shift is required to complete.");
  }

  return runExclusive(() => shiftService.complete(shiftId, payload));
};

import * as Device from "expo-device";
import * as Location from "expo-location";

import { shiftService } from "../services";
import { shiftLocationPolicy } from "../config/shiftLocationPolicy";

const GEOCODER_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en",
};

const DEFAULT_EMULATOR_COORDINATE = {
  latitude: 59.3293,
  longitude: 18.0686,
};

const ensureLocationPermission = async () => {
  const currentPermission = await Location.getForegroundPermissionsAsync();
  if (currentPermission.status === "granted") {
    return;
  }

  const requestedPermission = await Location.requestForegroundPermissionsAsync();
  if (requestedPermission.status !== "granted") {
    throw new Error(
      "Location permission is required to start a shift at this project.",
    );
  }
};

const getCurrentShiftCoordinate = async () => {
  if (!Device.isDevice) {
    return DEFAULT_EMULATOR_COORDINATE;
  }

  await ensureLocationPermission();

  const currentPosition = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: currentPosition.coords.latitude,
    longitude: currentPosition.coords.longitude,
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
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(normalizedAddress)}`,
      {
        headers: GEOCODER_HEADERS,
      },
    );

    if (!response.ok) {
      throw new Error(`Address search failed with status ${response.status}`);
    }

    const data = await response.json();
    const firstMatch = Array.isArray(data) ? data[0] : null;

    if (!firstMatch?.lat || !firstMatch?.lon) {
      return null;
    }

    return {
      latitude: Number(firstMatch.lat),
      longitude: Number(firstMatch.lon),
    };
  } catch {}

  return null;
};

const hasValidCoordinate = (value) =>
  typeof value === "number" && Number.isFinite(value);

const getSavedProjectCoordinate = (project) => {
  const latitude = project?.locationLatitude;
  const longitude = project?.locationLongitude;

  if (!hasValidCoordinate(latitude) || !hasValidCoordinate(longitude)) {
    return null;
  }

  return { latitude, longitude };
};

const toRadians = (value) => (value * Math.PI) / 180;

const calculateDistanceMeters = (
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
}) => {
  const resolvedProjectCoordinate = await resolveProjectCoordinate({
    project,
    fallbackProjectLocation,
  });

  if (!resolvedProjectCoordinate.enforced) {
    return {
      enforced: false,
      distanceMeters: 0,
      maxDistanceMeters: shiftLocationPolicy.maxDistanceMeters,
    };
  }

  const currentCoordinate = await getCurrentShiftCoordinate();
  const distanceMeters = calculateDistanceMeters(
    currentCoordinate.latitude,
    currentCoordinate.longitude,
    resolvedProjectCoordinate.projectCoordinate.latitude,
    resolvedProjectCoordinate.projectCoordinate.longitude,
  );

  return {
    enforced: true,
    distanceMeters,
    maxDistanceMeters: shiftLocationPolicy.maxDistanceMeters,
  };
};

export const isWithinProjectLocation = async (options) => {
  const locationCheck = await getShiftLocationCheck(options);

  return (
    !locationCheck.enforced ||
    locationCheck.distanceMeters <= locationCheck.maxDistanceMeters
  );
};

export const startShiftWithLocationGuard = async ({
  projectId,
  project,
  fallbackProjectLocation,
}) => {
  if (!projectId) {
    throw new Error("Project is required to start a shift.");
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
      `You are not at the project location. Move within ${shiftLocationPolicy.maxDistanceMeters} meters of the project to start a shift.`,
    );
  }

  return shiftService.start(projectId);
};

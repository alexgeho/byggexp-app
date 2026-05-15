import * as Location from "expo-location";

import { shiftService } from "../services";
import { shiftLocationPolicy } from "../config/shiftLocationPolicy";

const GEOCODER_HEADERS = {
  Accept: "application/json",
  "Accept-Language": "en",
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

export const startShiftWithLocationGuard = async ({
  projectId,
  project,
  fallbackProjectLocation,
}) => {
  if (!projectId) {
    throw new Error("Project is required to start a shift.");
  }

  const projectLocation =
    project?.location?.trim?.() || fallbackProjectLocation?.trim?.() || "";

  if (!shiftLocationPolicy.enabled || !projectLocation) {
    return shiftService.start(projectId);
  }

  await ensureLocationPermission();

  const [currentPosition, projectCoordinate] = await Promise.all([
    Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    }),
    geocodeProjectLocation(projectLocation),
  ]);

  if (!projectCoordinate) {
    throw new Error(
      "Unable to verify the project location. Update the project address or disable shift location enforcement in code.",
    );
  }

  const distanceMeters = calculateDistanceMeters(
    currentPosition.coords.latitude,
    currentPosition.coords.longitude,
    projectCoordinate.latitude,
    projectCoordinate.longitude,
  );

  if (distanceMeters > shiftLocationPolicy.maxDistanceMeters) {
    throw new Error(
      `You are not at the project location. Move within ${shiftLocationPolicy.maxDistanceMeters} meters of the project to start a shift.`,
    );
  }

  return shiftService.start(projectId);
};

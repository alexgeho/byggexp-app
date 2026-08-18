import { useCallback, useRef } from "react";
import * as Location from "expo-location";
import {
  formatResolvedAddress,
  getCoordinateCacheKey,
  reverseGeocodeWithNominatim,
} from "../utils/projectLocationSearch";

const REVERSE_GEOCODE_MIN_INTERVAL_MS = 1200;

// Turns a coordinate into a human address, with a per-coordinate cache and a
// min-interval throttle so we never hammer the geocoders. Tries the native
// reverse geocoder first, then falls back to Nominatim. Returns null when both
// fail (the caller can then show the raw lat/lng).
export const useReverseGeocode = () => {
  const lastAtRef = useRef(0);
  const cacheRef = useRef(new Map());

  const resolveAddress = useCallback(async (latitude, longitude) => {
    const cacheKey = getCoordinateCacheKey(latitude, longitude);
    const cachedAddress = cacheRef.current.get(cacheKey);

    if (cachedAddress) {
      return cachedAddress;
    }

    const elapsed = Date.now() - lastAtRef.current;
    if (elapsed < REVERSE_GEOCODE_MIN_INTERVAL_MS) {
      await new Promise((resolve) =>
        setTimeout(resolve, REVERSE_GEOCODE_MIN_INTERVAL_MS - elapsed),
      );
    }

    try {
      lastAtRef.current = Date.now();
      const [resolvedAddress] = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const formattedAddress = formatResolvedAddress(resolvedAddress);

      if (formattedAddress) {
        cacheRef.current.set(cacheKey, formattedAddress);
        return formattedAddress;
      }
    } catch {}

    try {
      const nominatimAddress = await reverseGeocodeWithNominatim(
        latitude,
        longitude,
      );
      if (nominatimAddress) {
        cacheRef.current.set(cacheKey, nominatimAddress);
        return nominatimAddress;
      }
    } catch {}

    return null;
  }, []);

  // Prime the cache with an address the caller already resolved elsewhere.
  const cacheAddress = useCallback((latitude, longitude, address) => {
    cacheRef.current.set(getCoordinateCacheKey(latitude, longitude), address);
  }, []);

  return { resolveAddress, cacheAddress };
};

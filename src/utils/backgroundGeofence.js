import { AppState, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Location from "expo-location";

import { shiftLocationPolicy } from "../config/shiftLocationPolicy";
import { SHIFT_GEOFENCE_TASK } from "../tasks/shiftGeofenceTask";
import {
  SHIFT_LOCATION_TASK,
  SHIFT_LOCATION_TARGET_KEY,
  SHIFT_LOCATION_INSIDE_KEY,
} from "../tasks/shiftLocationUpdatesTask";
import { resolveProjectGeofenceRegion } from "./shiftLocationGuard";
import {
  logGeofenceTarget,
  reportBackgroundMonitorStale,
} from "./shiftGeofenceDebug";
import { parseGeofenceState } from "./geofenceEvaluation";

// AsyncStorage key: timestamp of when we last showed the consent priming
// screen, so it is offered at most once automatically.
export const LOCATION_CONSENT_PROMPTED_KEY = "shiftGeofenceConsentPromptedAt";

const isAndroid = Platform.OS === "android";

// Whether the Android location stream has been (re)started while the app was
// foregrounded in THIS process — i.e. whether its foreground service is up.
//
// expo-location only starts the foreground service when startLocationUpdatesAsync
// runs with the app in the foreground (LocationTaskConsumer.maybeStartForegroundService
// bails in the background). But task registrations persist across process death,
// so after the OS restarts the app in the background (overnight, low memory,
// reboot) the persisted task re-registers WITHOUT a foreground service and
// location is delivered via JobScheduler instead — which Doze freezes, so the
// shift never auto-pauses while the phone is asleep. We track this so the next
// foreground sync can re-register and promote the stream back to a foreground
// service. Module scope resets on process restart, which is exactly the signal
// we want (a fresh process has no foreground service yet).
let androidForegroundServiceStarted = false;

const ANDROID_LOCATION_STREAM_OPTIONS = {
  accuracy: Location.Accuracy.High,
  // Fixed cadence, no distance gate, and no deferral so Doze/battery
  // optimisation can't batch updates until the screen wakes — otherwise the
  // enter/exit only fires when the app is reopened.
  timeInterval: 15000,
  distanceInterval: 0,
  deferredUpdatesInterval: 0,
  deferredUpdatesDistance: 0,
  pausesUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: false,
  foregroundService: {
    notificationTitle: "Shift location active",
    notificationBody:
      "ByggExp checks you in and out as you arrive at and leave the project site.",
    notificationColor: "#052D50",
    killServiceOnDestroy: false,
  },
};

// Start the location stream and remember whether its foreground service could
// have started (only possible while foregrounded, see above).
const startAndroidLocationStream = async () => {
  await Location.startLocationUpdatesAsync(
    SHIFT_LOCATION_TASK,
    ANDROID_LOCATION_STREAM_OPTIONS,
  );
  androidForegroundServiceStarted = AppState.currentState === "active";
};

// Background auto start/stop is supported on both platforms, but via different
// mechanisms: iOS uses OS-level region monitoring (startGeofencingAsync);
// Android uses a foreground-service location stream (startLocationUpdatesAsync)
// because strict Android builds reject Play-Services geofencing. Both need
// "Always"/background location granted and a physical device.
export const isBackgroundGeofencingSupported = () =>
  (Platform.OS === "ios" || Platform.OS === "android") &&
  shiftLocationPolicy.enabled &&
  shiftLocationPolicy.backgroundGeofencingEnabled &&
  Device.isDevice;

export const hasBackgroundLocationPermission = async () => {
  if (!isBackgroundGeofencingSupported()) {
    return false;
  }

  const { status } = await Location.getBackgroundPermissionsAsync();
  return status === "granted";
};

// Returns true when the location task CAN be started: on Android this requires
// only foreground ("while using") permission because the foreground service
// keeps running while the app is open or backgrounded; on iOS we need the full
// "always" grant for OS-level region monitoring.
export const hasLocationTaskPermission = async () => {
  if (!isBackgroundGeofencingSupported()) {
    return false;
  }

  if (isAndroid) {
    const { status } = await Location.getForegroundPermissionsAsync().catch(
      () => ({ status: "denied" }),
    );
    return status === "granted";
  }

  return hasBackgroundLocationPermission();
};

// "granted" | "denied" | "undetermined". Used to decide whether to show the
// consent priming screen (only when we can still raise the OS dialog).
export const getBackgroundPermissionStatus = async () => {
  if (!isBackgroundGeofencingSupported()) {
    return "unsupported";
  }

  const { status } = await Location.getBackgroundPermissionsAsync();
  return status;
};

// Request foreground first (required before background can be granted), then
// background ("Always"). Returns true only when background is granted.
export const requestBackgroundLocationPermission = async () => {
  if (!isBackgroundGeofencingSupported()) {
    return false;
  }

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    return false;
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  return background.status === "granted";
};

const clampRadius = (radius) => {
  const min = shiftLocationPolicy.minBackgroundRadiusMeters || 0;
  const value = Number(radius);
  if (!Number.isFinite(value) || value <= 0) {
    return min || shiftLocationPolicy.maxDistanceMeters;
  }
  return Math.max(value, min);
};

const clearAndroidState = async () => {
  androidForegroundServiceStarted = false;
  await AsyncStorage.removeItem(SHIFT_LOCATION_TARGET_KEY).catch(() => {});
  await AsyncStorage.removeItem(SHIFT_LOCATION_INSIDE_KEY).catch(() => {});
};

// Stop whichever background monitor is running on this platform.
const stopIfRunning = async () => {
  if (isAndroid) {
    const updating = await Location.hasStartedLocationUpdatesAsync(
      SHIFT_LOCATION_TASK,
    ).catch(() => false);
    if (updating) {
      await Location.stopLocationUpdatesAsync(SHIFT_LOCATION_TASK).catch(
        () => {},
      );
    }
    await clearAndroidState();
    return;
  }

  const geofencing = await Location.hasStartedGeofencingAsync(
    SHIFT_GEOFENCE_TASK,
  ).catch(() => false);
  if (geofencing) {
    await Location.stopGeofencingAsync(SHIFT_GEOFENCE_TASK).catch(() => {});
  }
};

export const stopShiftGeofencing = async () => {
  await stopIfRunning();
};

// A registered background monitor is only worth deferring to while it is
// actually producing readings. Doze, battery optimisation or an OEM task killer
// can silence the Android foreground service without unregistering it, and the
// foreground check used to stand down anyway — leaving a shift running with the
// app open and a perfectly good GPS fix available.
//
// iOS is exempt: region monitoring is event-driven, so it reports nothing while
// the worker stays put and silence there is expected.
export const BACKGROUND_MONITOR_MAX_SILENCE_MS = 3 * 60 * 1000;

export const isBackgroundMonitorStale = async () => {
  if (!isAndroid) {
    return false;
  }

  const raw = await AsyncStorage.getItem(SHIFT_LOCATION_INSIDE_KEY).catch(
    () => null,
  );
  // Measured against the last *usable* fix, not against any callback. A service
  // that keeps firing every 15 s while Doze leaves it with cell-tower accuracy
  // is running but blind: it decides nothing, and treating it as alive kept the
  // foreground check standing down for the whole shift.
  const { lastUsableFixAt } = parseGeofenceState(raw);

  if (!lastUsableFixAt) {
    reportBackgroundMonitorStale({ silentForMs: null });
    return true;
  }

  const silentForMs = Date.now() - lastUsableFixAt;
  if (silentForMs > BACKGROUND_MONITOR_MAX_SILENCE_MS) {
    reportBackgroundMonitorStale({ silentForMs });
    return true;
  }

  return false;
};

// Android: start (or keep) a foreground-service location stream for the given
// project region. The task in shiftLocationUpdatesTask computes enter/exit from
// the stream. Idempotent — a stream already running for the same project is
// left untouched so its inside/outside state is preserved.
const syncAndroidLocationUpdates = async (region) => {
  const target = {
    projectId: region.identifier,
    latitude: region.latitude,
    longitude: region.longitude,
    radius: clampRadius(region.radius),
  };

  const alreadyRunning = await Location.hasStartedLocationUpdatesAsync(
    SHIFT_LOCATION_TASK,
  ).catch(() => false);

  if (alreadyRunning) {
    const raw = await AsyncStorage.getItem(SHIFT_LOCATION_TARGET_KEY).catch(
      () => null,
    );
    const existing = raw ? JSON.parse(raw) : null;
    // Compare the whole region, not just the project id: editing a project's
    // address or radius moves the geofence, and the running task would
    // otherwise keep measuring against the coordinates it was started with.
    if (
      existing?.projectId === target.projectId &&
      existing?.latitude === target.latitude &&
      existing?.longitude === target.longitude &&
      existing?.radius === target.radius
    ) {
      // Region unchanged. If we started the stream in the foreground this
      // process its foreground service is up — nothing to do. Otherwise the
      // stream is running without one (persisted task revived in the
      // background), so re-register now while foregrounded to promote it to a
      // foreground service. Preserve the inside/outside state so the transition
      // detector isn't reset while the target is unchanged.
      if (
        androidForegroundServiceStarted ||
        AppState.currentState !== "active"
      ) {
        return true;
      }
      await Location.stopLocationUpdatesAsync(SHIFT_LOCATION_TASK).catch(
        () => {},
      );
      await AsyncStorage.setItem(
        SHIFT_LOCATION_TARGET_KEY,
        JSON.stringify(target),
      );
      await startAndroidLocationStream();
      return true;
    }
    // Different project, or the same project's area moved: stop and
    // re-register with fresh state.
    await Location.stopLocationUpdatesAsync(SHIFT_LOCATION_TASK).catch(
      () => {},
    );
  }

  await AsyncStorage.removeItem(SHIFT_LOCATION_INSIDE_KEY).catch(() => {});
  await AsyncStorage.setItem(SHIFT_LOCATION_TARGET_KEY, JSON.stringify(target));
  logGeofenceTarget(target);

  await startAndroidLocationStream();

  return true;
};

// Register (or refresh) background auto start/stop for a single project. Returns
// true when monitoring is now active for it, false otherwise (unsupported, no
// permission, or the project has no usable location).
export const syncShiftGeofenceForProject = async ({
  project,
  fallbackProjectLocation,
} = {}) => {
  if (!isBackgroundGeofencingSupported()) {
    return false;
  }

  // Android: startLocationUpdatesAsync with a foreground service works with
  // foreground ("while using") permission — the service stays alive while the
  // app is open or backgrounded. With "Always" it also survives app destroy.
  // Do NOT gate on background permission here so at least foreground tracking
  // is active even when the user has only granted "while using".
  if (isAndroid) {
    const { status: fgStatus } =
      await Location.getForegroundPermissionsAsync().catch(() => ({
        status: "denied",
      }));
    if (fgStatus !== "granted") {
      await stopIfRunning();
      return false;
    }
  } else if (!(await hasBackgroundLocationPermission())) {
    await stopIfRunning();
    return false;
  }

  const region = await resolveProjectGeofenceRegion({
    project,
    fallbackProjectLocation,
  });

  if (!region) {
    await stopIfRunning();
    return false;
  }

  try {
    if (isAndroid) {
      return await syncAndroidLocationUpdates(region);
    }

    await Location.startGeofencingAsync(SHIFT_GEOFENCE_TASK, [
      {
        identifier: region.identifier,
        latitude: region.latitude,
        longitude: region.longitude,
        radius: clampRadius(region.radius),
        notifyOnEnter: true,
        notifyOnExit: true,
      },
    ]);
    return true;
  } catch {
    await stopIfRunning();
    return false;
  }
};

export const shiftLocationPolicy = {
  // Toggle this in code to enable/disable shift location enforcement.
  enabled: true,
  maxDistanceMeters: 500,
  checkIntervalMs: 15 * 1000,
  autoCheckInEnabled: true,
  autoCheckOutEnabled: true,
  // OS-level background geofencing (expo-location + expo-task-manager). When
  // active, the OS wakes the app on enter/exit even while it is closed or the
  // phone is asleep, so shifts auto start/stop without a foreground timer.
  backgroundGeofencingEnabled: true,
  // iOS region monitoring is unreliable below ~150-200 m: Apple applies a
  // built-in ~200 m boundary hysteresis + 20 s dwell before reporting a
  // crossing, so a tighter region silently drops enter/exit events. Clamp small
  // custom radii up to this floor so the OS actually fires (default projects use
  // maxDistanceMeters=500, well clear of it). Trade-off: a larger site radius
  // means a worker has to walk a bit further out before the shift auto-pauses,
  // which is the accepted norm for OS-level geofencing (competitors default to
  // "several hundred metres" for the same reason).
  minBackgroundRadiusMeters: 180,
  // Prints one line per location fix (distance, accuracy, verdict, resulting
  // transition) so on-device behaviour can be followed with `adb logcat`.
  // Geofence problems are impossible to diagnose from a bug report alone.
  debugLoggingEnabled: true,
};

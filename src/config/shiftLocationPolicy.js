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
  // iOS region monitoring is unreliable below ~100 m; clamp small radii up so
  // the OS actually reports enter/exit events.
  minBackgroundRadiusMeters: 120,
};

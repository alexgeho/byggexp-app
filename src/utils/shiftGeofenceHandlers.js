import { Alert, InteractionManager } from "react-native";

export const createShiftGeofenceHandlers = ({
  applyShiftState,
  reset,
  setCurrentShift,
  start,
}) => ({
  onShiftAutoCompleted: () => {
    InteractionManager.runAfterInteractions(() => {
      setCurrentShift(null);
      reset();

      Alert.alert(
        "Shift completed",
        "You left the project area, so your current shift was ended automatically.",
      );
    });
  },
  onShiftAutoStarted: (shift) => {
    InteractionManager.runAfterInteractions(() => {
      applyShiftState(shift);
      start(shift);

      Alert.alert(
        "Shift started",
        "You entered the project area, so your shift started automatically.",
      );
    });
  },
  onShiftAutoResumed: (shift) => {
    InteractionManager.runAfterInteractions(() => {
      applyShiftState(shift);
      start(shift);

      Alert.alert(
        "Shift resumed",
        "You entered the project area, so your shift resumed automatically.",
      );
    });
  },
  onCheckError: (error) => {
    console.error("Failed to verify shift geofence:", error);
  },
});

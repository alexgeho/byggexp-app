import { InteractionManager } from "react-native";

import i18n from "../i18n";
import { enqueueShiftAlert } from "./shiftAlertQueue";
import { isAppInForeground } from "./shiftAutoAnnounce";

// In-app reaction to an automatic shift transition.
//
// State is always applied so the timer stays in sync. The message is only
// shown while the app is in the foreground — when it is backgrounded the user
// gets a single OS notification instead (see shiftAutoAnnounce). Showing both
// was what put a notification banner on top of an in-app dialog.
//
// Alerts go through enqueueShiftAlert rather than Alert.alert directly so two
// transitions arriving together cannot present two UIAlertControllers in the
// same frame, which on iOS leaves an orphaned, clipped alert in the corner.

const showMessage = (key, titleKey, bodyKey, fallbackTitle, fallbackBody) => {
  if (!isAppInForeground()) {
    return;
  }

  enqueueShiftAlert({
    key,
    title: i18n.t(titleKey, { defaultValue: fallbackTitle }),
    message: i18n.t(bodyKey, { defaultValue: fallbackBody }),
    confirmLabel: i18n.t("common.ok", { defaultValue: "OK" }),
  });
};

export const createShiftGeofenceHandlers = ({
  applyShiftState,
  reset,
  setCurrentShift,
  start,
}) => ({
  onShiftAutoCompleted: (_shift, meta) => {
    InteractionManager.runAfterInteractions(() => {
      setCurrentShift(null);
      reset();

      // A completion triggered by switching project must not read as if the
      // worker left the site — geofence exits pause the shift, they don't
      // complete it.
      if (meta?.reason === "project_switched") {
        showMessage(
          "shift-project-switched",
          "shiftGeofence.projectSwitchedTitle",
          "shiftGeofence.projectSwitchedBody",
          "Project switched",
          "You switched to another project, so your previous shift was closed.",
        );
        return;
      }

      showMessage(
        "shift-auto-completed",
        "shiftGeofence.autoCompletedTitle",
        "shiftGeofence.autoCompletedBody",
        "Shift ended",
        "You left the project area, so your shift was ended automatically.",
      );
    });
  },
  onShiftAutoPaused: (shift) => {
    InteractionManager.runAfterInteractions(() => {
      applyShiftState(shift);

      showMessage(
        "shift-auto-paused",
        "shiftGeofence.autoPausedTitle",
        "shiftGeofence.autoPausedBody",
        "Shift paused",
        "You left the project area, so time tracking was paused. It resumes automatically when you return.",
      );
    });
  },
  onShiftAutoStarted: (shift) => {
    InteractionManager.runAfterInteractions(() => {
      applyShiftState(shift);
      start(shift);

      showMessage(
        "shift-auto-started",
        "shiftGeofence.autoStartedTitle",
        "shiftGeofence.autoStartedBody",
        "Shift started",
        "You entered the project area, so your shift started automatically.",
      );
    });
  },
  onShiftAutoResumed: (shift) => {
    InteractionManager.runAfterInteractions(() => {
      applyShiftState(shift);
      start(shift);

      showMessage(
        "shift-auto-resumed",
        "shiftGeofence.autoResumedTitle",
        "shiftGeofence.autoResumedBody",
        "Shift resumed",
        "You are back in the project area, so your shift resumed automatically.",
      );
    });
  },
  onCheckError: (error) => {
    console.error("Failed to verify shift geofence:", error);
  },
});

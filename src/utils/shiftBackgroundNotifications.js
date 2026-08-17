import * as Notifications from "expo-notifications";

import i18n from "../i18n";

// Local notifications for automatic shift transitions.
//
// These are only posted while the app is NOT in the foreground — see
// shiftAutoAnnounce, which routes a transition either to an in-app alert or to
// one of these. Posting both at once is what produced a notification banner on
// top of an in-app dialog after an automatic check-out.
//
// Best-effort: never throw from a background task.
const postLocalNotification = async (title, body, data) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title, body, data, sound: true },
      trigger: null,
    });
  } catch (error) {
    console.warn("Failed to post shift geofence notification:", error);
  }
};

const getShiftId = (shift) => shift?.id || shift?._id || null;

export const notifyShiftAutoCompleted = (shift, meta) => {
  const switched = meta?.reason === "project_switched";
  return postLocalNotification(
    i18n.t(
      switched
        ? "shiftGeofence.projectSwitchedTitle"
        : "shiftGeofence.autoCompletedTitle",
      {
        defaultValue: switched ? "Project switched" : "Shift ended",
      },
    ),
    i18n.t(
      switched
        ? "shiftGeofence.projectSwitchedBody"
        : "shiftGeofence.autoCompletedBody",
      {
        defaultValue: switched
          ? "You switched to another project, so your previous shift was closed."
          : "You left the project area, so your shift was ended automatically.",
      },
    ),
    { screen: "Shifts", shiftId: getShiftId(shift) },
  );
};

export const notifyShiftAutoPaused = (shift) =>
  postLocalNotification(
    i18n.t("shiftGeofence.autoPausedTitle", {
      defaultValue: "Shift paused",
    }),
    i18n.t("shiftGeofence.autoPausedBody", {
      defaultValue:
        "You left the project area, so time tracking was paused. It resumes automatically when you return.",
    }),
    { screen: "Shifts", shiftId: getShiftId(shift) },
  );

export const notifyShiftAutoStarted = (shift) =>
  postLocalNotification(
    i18n.t("shiftGeofence.autoStartedTitle", {
      defaultValue: "Shift started",
    }),
    i18n.t("shiftGeofence.autoStartedBody", {
      defaultValue:
        "You entered the project area, so your shift started automatically.",
    }),
    { screen: "Shifts", shiftId: getShiftId(shift) },
  );

export const notifyShiftAutoResumed = (shift) =>
  postLocalNotification(
    i18n.t("shiftGeofence.autoResumedTitle", {
      defaultValue: "Shift resumed",
    }),
    i18n.t("shiftGeofence.autoResumedBody", {
      defaultValue:
        "You are back in the project area, so your shift resumed automatically.",
    }),
    { screen: "Shifts", shiftId: getShiftId(shift) },
  );

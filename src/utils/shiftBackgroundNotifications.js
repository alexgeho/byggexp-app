import * as Notifications from "expo-notifications";

import i18n from "../i18n";

// When a shift is auto started/ended from the background geofence task, the app
// is usually closed or asleep, so an in-app Alert would never be seen. Post a
// local notification instead. Best-effort: never throw from the geofence task.
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

export const notifyShiftAutoCompleted = (shift) =>
  postLocalNotification(
    i18n.t("shiftGeofence.autoCompletedTitle", {
      defaultValue: "Shift ended",
    }),
    i18n.t("shiftGeofence.autoCompletedBody", {
      defaultValue:
        "You left the project area, so your shift was ended automatically.",
    }),
    { screen: "Shifts", shiftId: shift?.id || shift?._id || null },
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
    { screen: "Shifts", shiftId: shift?.id || shift?._id || null },
  );

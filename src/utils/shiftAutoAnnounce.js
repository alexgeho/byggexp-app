import { AppState } from "react-native";

import {
  emitShiftAutoCompleted,
  emitShiftAutoPaused,
  emitShiftAutoResumed,
  emitShiftAutoStarted,
} from "./shiftExitAutoCompleteEvents";
import {
  notifyShiftAutoCompleted,
  notifyShiftAutoPaused,
  notifyShiftAutoResumed,
  notifyShiftAutoStarted,
} from "./shiftBackgroundNotifications";

// Decides where the user is told about an automatic shift transition.
//
// The in-app event is always emitted, because subscribers use it to keep the
// timer and the current-shift state in sync. Only the *message* is routed:
// foreground shows one in-app alert, background posts one OS notification.
// Emitting both was why a local notification banner and an Alert appeared at
// the same time after an automatic check-out.

export const isAppInForeground = () => AppState.currentState === "active";

const announce = async ({ emit, notify, shift, meta }) => {
  await emit(shift, meta);

  if (!isAppInForeground()) {
    await notify(shift, meta);
  }
};

export const announceShiftAutoStarted = (shift) =>
  announce({
    emit: emitShiftAutoStarted,
    notify: notifyShiftAutoStarted,
    shift,
  });

export const announceShiftAutoResumed = (shift) =>
  announce({
    emit: emitShiftAutoResumed,
    notify: notifyShiftAutoResumed,
    shift,
  });

export const announceShiftAutoPaused = (shift) =>
  announce({
    emit: emitShiftAutoPaused,
    notify: notifyShiftAutoPaused,
    shift,
  });

export const announceShiftAutoCompleted = (shift, meta) =>
  announce({
    emit: emitShiftAutoCompleted,
    notify: notifyShiftAutoCompleted,
    shift,
    meta,
  });

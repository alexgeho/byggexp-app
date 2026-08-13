import { Alert } from "react-native";

// Presents shift alerts one at a time.
//
// On iOS an Alert is a UIAlertController presented on the root view
// controller. Presenting a second one while the first is still running its
// present/dismiss transition aborts the presentation and leaves an orphaned
// alert view in the window hierarchy — it renders as a clipped fragment pinned
// to the top-left corner instead of a centred dialog. Auto check-out could
// trigger exactly that, because the background task and the foreground monitor
// could both surface a "shift ended" alert within the same animation frame.
//
// Alerts are also de-duplicated by key, so the same message queued twice is
// shown once.

const pending = [];
const queuedKeys = new Set();

let isPresenting = false;

const presentNext = () => {
  if (isPresenting) {
    return;
  }

  const next = pending.shift();
  if (!next) {
    return;
  }

  isPresenting = true;

  // The key stays reserved until the alert is dismissed, so a transition
  // reported by two paths at once cannot queue the same dialog behind itself.
  const onFinished = () => {
    queuedKeys.delete(next.key);
    isPresenting = false;
    presentNext();
  };

  Alert.alert(
    next.title,
    next.message,
    [{ text: next.confirmLabel, onPress: onFinished }],
    { cancelable: false, onDismiss: onFinished },
  );
};

export const enqueueShiftAlert = ({ key, title, message, confirmLabel }) => {
  if (!title && !message) {
    return;
  }

  const alertKey = key || `${title}:${message}`;
  if (queuedKeys.has(alertKey)) {
    return;
  }

  queuedKeys.add(alertKey);
  pending.push({
    key: alertKey,
    title,
    message,
    confirmLabel: confirmLabel || "OK",
  });

  presentNext();
};

// Test seam.
export const resetShiftAlertQueue = () => {
  pending.length = 0;
  queuedKeys.clear();
  isPresenting = false;
};

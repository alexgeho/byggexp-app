import { AppState } from "react-native";

import {
  announceShiftAutoCompleted,
  announceShiftAutoPaused,
  announceShiftAutoResumed,
  announceShiftAutoStarted,
  isAppInForeground,
} from "../shiftAutoAnnounce";
import {
  emitShiftAutoCompleted,
  emitShiftAutoPaused,
  emitShiftAutoResumed,
  emitShiftAutoStarted,
} from "../shiftExitAutoCompleteEvents";
import {
  notifyShiftAutoCompleted,
  notifyShiftAutoPaused,
  notifyShiftAutoResumed,
  notifyShiftAutoStarted,
} from "../shiftBackgroundNotifications";

jest.mock("react-native", () => ({
  AppState: { currentState: "active" },
}));

jest.mock("../shiftExitAutoCompleteEvents", () => ({
  emitShiftAutoStarted: jest.fn().mockResolvedValue(undefined),
  emitShiftAutoResumed: jest.fn().mockResolvedValue(undefined),
  emitShiftAutoPaused: jest.fn().mockResolvedValue(undefined),
  emitShiftAutoCompleted: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../shiftBackgroundNotifications", () => ({
  notifyShiftAutoStarted: jest.fn().mockResolvedValue(undefined),
  notifyShiftAutoResumed: jest.fn().mockResolvedValue(undefined),
  notifyShiftAutoPaused: jest.fn().mockResolvedValue(undefined),
  notifyShiftAutoCompleted: jest.fn().mockResolvedValue(undefined),
}));

const SHIFT = { id: "shift-a", projectId: "project-a" };

const CHANNELS = [
  [
    "started",
    announceShiftAutoStarted,
    emitShiftAutoStarted,
    notifyShiftAutoStarted,
  ],
  [
    "resumed",
    announceShiftAutoResumed,
    emitShiftAutoResumed,
    notifyShiftAutoResumed,
  ],
  [
    "paused",
    announceShiftAutoPaused,
    emitShiftAutoPaused,
    notifyShiftAutoPaused,
  ],
  [
    "completed",
    announceShiftAutoCompleted,
    emitShiftAutoCompleted,
    notifyShiftAutoCompleted,
  ],
];

beforeEach(() => {
  jest.clearAllMocks();
  AppState.currentState = "active";
});

describe("foreground app", () => {
  it.each(CHANNELS)(
    "%s: emits in-app state only, never an OS notification",
    async (_name, announce, emit, notify) => {
      AppState.currentState = "active";

      await announce(SHIFT);

      expect(emit).toHaveBeenCalledTimes(1);
      expect(notify).not.toHaveBeenCalled();
    },
  );
});

describe("backgrounded app", () => {
  it.each(CHANNELS)(
    "%s: posts exactly one OS notification alongside the state sync",
    async (_name, announce, emit, notify) => {
      AppState.currentState = "background";

      await announce(SHIFT);

      expect(emit).toHaveBeenCalledTimes(1);
      expect(notify).toHaveBeenCalledTimes(1);
    },
  );

  it("treats 'inactive' (iOS transition state) as not foreground", async () => {
    AppState.currentState = "inactive";

    await announceShiftAutoPaused(SHIFT);

    expect(notifyShiftAutoPaused).toHaveBeenCalledTimes(1);
  });
});

describe("isAppInForeground", () => {
  it("is true only for the active state", () => {
    AppState.currentState = "active";
    expect(isAppInForeground()).toBe(true);

    AppState.currentState = "background";
    expect(isAppInForeground()).toBe(false);

    AppState.currentState = "inactive";
    expect(isAppInForeground()).toBe(false);
  });
});

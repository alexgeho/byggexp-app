import { createShiftGeofenceHandlers } from "../shiftGeofenceHandlers";
import { enqueueShiftAlert } from "../shiftAlertQueue";
import { isAppInForeground } from "../shiftAutoAnnounce";

// An automatic transition must surface exactly one message. While the app is
// in the foreground that is the in-app alert; while it is backgrounded the OS
// notification is the only channel (see shiftAutoAnnounce). Showing both at
// once is what stacked a notification banner on top of an in-app dialog.

jest.mock("react-native", () => ({
  InteractionManager: {
    runAfterInteractions: jest.fn((callback) => {
      callback();
      return { cancel: jest.fn() };
    }),
  },
}));

jest.mock("../shiftAlertQueue", () => ({
  enqueueShiftAlert: jest.fn(),
}));

jest.mock("../shiftAutoAnnounce", () => ({
  isAppInForeground: jest.fn(() => true),
}));

jest.mock("../../i18n", () => ({
  t: jest.fn((key, options) => options?.defaultValue ?? key),
}));

const SHIFT = { id: "shift-a", projectId: "project-a", status: "paused" };

const createHandlers = () => {
  const applyShiftState = jest.fn();
  const reset = jest.fn();
  const setCurrentShift = jest.fn();
  const start = jest.fn();

  return {
    applyShiftState,
    reset,
    setCurrentShift,
    start,
    handlers: createShiftGeofenceHandlers({
      applyShiftState,
      reset,
      setCurrentShift,
      start,
    }),
  };
};

beforeEach(() => {
  jest.clearAllMocks();
  isAppInForeground.mockReturnValue(true);
});

describe("app in the foreground", () => {
  it("shows a single in-app message when a shift is auto-paused", () => {
    const { handlers, applyShiftState } = createHandlers();

    handlers.onShiftAutoPaused(SHIFT);

    expect(applyShiftState).toHaveBeenCalledWith(SHIFT);
    expect(enqueueShiftAlert).toHaveBeenCalledTimes(1);
    expect(enqueueShiftAlert).toHaveBeenCalledWith(
      expect.objectContaining({ key: "shift-auto-paused" }),
    );
  });

  it("shows a single in-app message when a shift is auto-resumed", () => {
    const { handlers, start } = createHandlers();

    handlers.onShiftAutoResumed(SHIFT);

    expect(start).toHaveBeenCalledWith(SHIFT);
    expect(enqueueShiftAlert).toHaveBeenCalledTimes(1);
  });
});

describe("app in the background", () => {
  it("still syncs state but shows no in-app alert, leaving the OS notification as the only message", () => {
    isAppInForeground.mockReturnValue(false);
    const { handlers, applyShiftState } = createHandlers();

    handlers.onShiftAutoPaused(SHIFT);

    expect(applyShiftState).toHaveBeenCalledWith(SHIFT);
    expect(enqueueShiftAlert).not.toHaveBeenCalled();
  });

  it("clears the shift on auto-complete without an in-app alert", () => {
    isAppInForeground.mockReturnValue(false);
    const { handlers, setCurrentShift, reset } = createHandlers();

    handlers.onShiftAutoCompleted(SHIFT);

    expect(setCurrentShift).toHaveBeenCalledWith(null);
    expect(reset).toHaveBeenCalledTimes(1);
    expect(enqueueShiftAlert).not.toHaveBeenCalled();
  });
});

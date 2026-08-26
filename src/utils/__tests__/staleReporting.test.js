import {
  noteBackgroundMonitorHealthy,
  reportBackgroundMonitorStale,
  resetStaleReporting,
} from "../shiftGeofenceDebug";
import { captureMessage } from "../sentry";

// Breadcrumbs never ship on their own — they ride along with an event. A stale
// takeover throws nothing, so without an explicit message the whole episode is
// invisible and Sentry stays empty, which is exactly how the previous build
// ended up with no geofence telemetry at all.
//
// One message per episode, then at most one per interval, so a device stuck in
// Doze does not flood the project.

jest.mock("../sentry", () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

jest.mock("../../config/shiftLocationPolicy", () => ({
  shiftLocationPolicy: { debugLoggingEnabled: false },
}));

const THRESHOLD = 3 * 60 * 1000;
const REPORT_INTERVAL = 5 * 60 * 1000;

const stale = ({ callbackAgeMs = 5_000, usableFixAgeMs = THRESHOLD + 1000 }) =>
  reportBackgroundMonitorStale({
    callbackAgeMs,
    usableFixAgeMs,
    silenceThresholdMs: THRESHOLD,
  });

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
  jest.setSystemTime(1_700_000_000_000);
  resetStaleReporting();
});

afterEach(() => {
  jest.useRealTimers();
});

it("sends one message when an episode starts", () => {
  stale({});

  expect(captureMessage).toHaveBeenCalledTimes(1);
  expect(captureMessage).toHaveBeenCalledWith(
    "geofence background monitor stale",
    expect.objectContaining({ reason: "geofence_monitor_stale" }),
  );
});

it("does not repeat while the same episode continues", () => {
  stale({});
  jest.advanceTimersByTime(15_000);
  stale({});
  jest.advanceTimersByTime(15_000);
  stale({});

  expect(captureMessage).toHaveBeenCalledTimes(1);
});

it("sends again once the interval has elapsed", () => {
  stale({});
  jest.advanceTimersByTime(REPORT_INTERVAL + 1000);
  stale({});

  expect(captureMessage).toHaveBeenCalledTimes(2);
});

it("a foreground fix does not reset the episode rate limit", () => {
  stale({});
  jest.clearAllMocks();

  // Only a genuine background recovery ends an episode; the foreground check
  // never calls noteBackgroundMonitorHealthy.
  jest.advanceTimersByTime(15_000);
  stale({});

  expect(captureMessage).not.toHaveBeenCalled();
});

it("starts a new episode after the background service recovers", () => {
  stale({});
  jest.clearAllMocks();

  noteBackgroundMonitorHealthy();
  jest.advanceTimersByTime(15_000);
  stale({});

  expect(captureMessage).toHaveBeenCalledTimes(1);
});

describe("blame", () => {
  it("reads coarse fixes when callbacks are still arriving", () => {
    stale({ callbackAgeMs: 5_000 });

    expect(captureMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ likely: "fixes_too_coarse" }),
    );
  });

  it("reads a dead service once callbacks pass the health threshold", () => {
    // Deliberately between the 3-minute health threshold and the 5-minute
    // report interval: the old code classified this as merely imprecise.
    stale({ callbackAgeMs: THRESHOLD + 30_000 });

    expect(captureMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ likely: "service_not_running" }),
    );
  });

  it("reads a dead service when no callback ever arrived", () => {
    stale({ callbackAgeMs: null, usableFixAgeMs: null });

    expect(captureMessage).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        likely: "service_not_running",
        lastCallback: "never",
      }),
    );
  });
});

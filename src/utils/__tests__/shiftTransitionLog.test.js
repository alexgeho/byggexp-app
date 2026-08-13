import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  DUPLICATE_WINDOW_MS,
  OSCILLATION_WINDOW_MS,
  SHIFT_TRANSITION_LOG_KEY,
  clearTransitionLogForProject,
  shouldSkipTransition,
} from "../shiftTransitionLog";

// The log is persisted rather than kept in module state so it survives an app
// restart and is shared between the foreground monitor and the headless
// background task, which can run in separate JS contexts.

jest.mock("@react-native-async-storage/async-storage", () => {
  let store = {};

  return {
    __reset: () => {
      store = {};
    },
    getItem: jest.fn(async (key) => store[key] ?? null),
    setItem: jest.fn(async (key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(async (key) => {
      delete store[key];
    }),
  };
});

const PROJECT_ID = "project-a";
const NOW = 1_700_000_000_000;

beforeEach(() => {
  AsyncStorage.__reset();
  jest.clearAllMocks();
});

it("allows the first transition for a project", async () => {
  await expect(shouldSkipTransition("enter", PROJECT_ID, NOW)).resolves.toBe(
    false,
  );
});

it("skips the same transition redelivered inside the duplicate window", async () => {
  await shouldSkipTransition("enter", PROJECT_ID, NOW);

  await expect(
    shouldSkipTransition("enter", PROJECT_ID, NOW + 1000),
  ).resolves.toBe(true);
});

it("allows the same transition again once the duplicate window has passed", async () => {
  await shouldSkipTransition("enter", PROJECT_ID, NOW);

  await expect(
    shouldSkipTransition("enter", PROJECT_ID, NOW + DUPLICATE_WINDOW_MS + 1),
  ).resolves.toBe(false);
});

it("damps a flip-flop at the geofence boundary", async () => {
  await shouldSkipTransition("exit", PROJECT_ID, NOW);

  await expect(
    shouldSkipTransition("enter", PROJECT_ID, NOW + 1000),
  ).resolves.toBe(true);
});

it("allows a genuine return once the oscillation window has passed", async () => {
  await shouldSkipTransition("exit", PROJECT_ID, NOW);

  await expect(
    shouldSkipTransition("enter", PROJECT_ID, NOW + OSCILLATION_WINDOW_MS + 1),
  ).resolves.toBe(false);
});

it("tracks projects independently", async () => {
  await shouldSkipTransition("enter", PROJECT_ID, NOW);

  await expect(
    shouldSkipTransition("enter", "project-b", NOW + 1000),
  ).resolves.toBe(false);
});

it("survives a restart because the state is persisted", async () => {
  await shouldSkipTransition("enter", PROJECT_ID, NOW);

  const persisted = await AsyncStorage.getItem(SHIFT_TRANSITION_LOG_KEY);

  expect(JSON.parse(persisted)[PROJECT_ID]).toEqual({
    direction: "enter",
    atMs: NOW,
  });
});

it("forgets a project on request so a switch starts from a clean slate", async () => {
  await shouldSkipTransition("exit", PROJECT_ID, NOW);
  await clearTransitionLogForProject(PROJECT_ID);

  await expect(
    shouldSkipTransition("enter", PROJECT_ID, NOW + 1000),
  ).resolves.toBe(false);
});

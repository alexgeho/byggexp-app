import {
  CONFIRMATIONS_REQUIRED,
  EXIT_HYSTERESIS_METERS,
  GEOFENCE_INSIDE,
  GEOFENCE_OUTSIDE,
  GEOFENCE_UNKNOWN,
  MAX_TRANSITION_ATTEMPTS,
  TRANSITION_RETRY_BACKOFF_MS,
  commitGeofenceTransition,
  createInitialGeofenceState,
  evaluateGeofencePosition,
  failGeofenceTransition,
  getDueTransition,
  markGeofenceCallback,
  parseGeofenceState,
  reduceGeofenceState,
} from "../geofenceEvaluation";

const RADIUS = 120;

describe("evaluateGeofencePosition", () => {
  it("reports inside when the whole accuracy circle fits in the radius", () => {
    expect(
      evaluateGeofencePosition({
        distanceMeters: 40,
        accuracyMeters: 20,
        radiusMeters: RADIUS,
      }),
    ).toBe(GEOFENCE_INSIDE);
  });

  it("reports outside only past the hysteresis margin", () => {
    const justOutsideRadius = evaluateGeofencePosition({
      distanceMeters: RADIUS + 10,
      accuracyMeters: 10,
      radiusMeters: RADIUS,
    });
    const clearlyAway = evaluateGeofencePosition({
      distanceMeters: RADIUS + EXIT_HYSTERESIS_METERS + 50,
      accuracyMeters: 10,
      radiusMeters: RADIUS,
    });

    expect(justOutsideRadius).toBe(GEOFENCE_UNKNOWN);
    expect(clearlyAway).toBe(GEOFENCE_OUTSIDE);
  });

  it("refuses to decide on a coarse indoor fix", () => {
    expect(
      evaluateGeofencePosition({
        distanceMeters: 300,
        accuracyMeters: 800,
        radiusMeters: RADIUS,
      }),
    ).toBe(GEOFENCE_UNKNOWN);
  });

  it("treats a missing accuracy as unusable rather than perfect", () => {
    expect(
      evaluateGeofencePosition({
        distanceMeters: 10,
        accuracyMeters: null,
        radiusMeters: RADIUS,
      }),
    ).toBe(GEOFENCE_UNKNOWN);
  });

  it("returns unknown for a missing or nonsensical radius", () => {
    expect(
      evaluateGeofencePosition({
        distanceMeters: 10,
        accuracyMeters: 10,
        radiusMeters: 0,
      }),
    ).toBe(GEOFENCE_UNKNOWN);
    expect(evaluateGeofencePosition({})).toBe(GEOFENCE_UNKNOWN);
  });
});

describe("reduceGeofenceState", () => {
  // `inside` only moves once the backend accepted the change, so a realistic
  // feed commits every transition the reducer hands back.
  const feed = (verdicts, initial = createInitialGeofenceState()) => {
    let state = initial;
    const transitions = [];

    verdicts.forEach((verdict) => {
      const result = reduceGeofenceState(state, verdict);
      state = result.state;
      if (result.transition) {
        transitions.push(result.transition);
        state = commitGeofenceTransition(state, result.transition);
      }
    });

    return { state, transitions };
  };

  it("needs consecutive agreeing readings before it changes state", () => {
    const single = feed([GEOFENCE_INSIDE]);
    expect(single.transitions).toEqual([]);

    const confirmed = feed(Array(CONFIRMATIONS_REQUIRED).fill(GEOFENCE_INSIDE));
    expect(confirmed.transitions).toEqual([GEOFENCE_INSIDE]);
    expect(confirmed.state.inside).toBe(true);
  });

  it("does not move inside until the transition is committed", () => {
    let state = createInitialGeofenceState();
    let result;

    for (let i = 0; i < CONFIRMATIONS_REQUIRED; i += 1) {
      result = reduceGeofenceState(state, GEOFENCE_INSIDE);
      state = result.state;
    }

    expect(result.transition).toBe(GEOFENCE_INSIDE);
    expect(state.inside).toBeNull();
    expect(state.pendingTransition).toMatchObject({
      direction: GEOFENCE_INSIDE,
      attempts: 0,
    });
  });

  it("does not re-emit while the state is unchanged", () => {
    const { transitions } = feed([
      GEOFENCE_INSIDE,
      GEOFENCE_INSIDE,
      GEOFENCE_INSIDE,
      GEOFENCE_INSIDE,
    ]);

    expect(transitions).toEqual([GEOFENCE_INSIDE]);
  });

  it("discards a lone outlier between confident readings", () => {
    const { transitions } = feed([
      GEOFENCE_INSIDE,
      GEOFENCE_INSIDE,
      GEOFENCE_OUTSIDE,
      GEOFENCE_INSIDE,
      GEOFENCE_OUTSIDE,
      GEOFENCE_INSIDE,
    ]);

    expect(transitions).toEqual([GEOFENCE_INSIDE]);
  });

  it("ignores unknown readings without breaking a streak", () => {
    const { transitions } = feed([
      GEOFENCE_INSIDE,
      GEOFENCE_UNKNOWN,
      GEOFENCE_UNKNOWN,
      GEOFENCE_INSIDE,
    ]);

    expect(transitions).toEqual([GEOFENCE_INSIDE]);
  });

  it("still reports a genuine departure", () => {
    const arrived = feed([GEOFENCE_INSIDE, GEOFENCE_INSIDE]);
    const left = feed([GEOFENCE_OUTSIDE, GEOFENCE_OUTSIDE], arrived.state);

    expect(left.transitions).toEqual([GEOFENCE_OUTSIDE]);
    expect(left.state.inside).toBe(false);
  });
});

describe("stationary phone with poor indoor accuracy", () => {
  // Reproduces the reported case: the device never moved, but the fused
  // provider reported positions scattered by hundreds of metres, which used to
  // pause and resume the shift on its own.
  it("produces no transitions at all", () => {
    const scatteredFixes = [
      { distanceMeters: 60, accuracyMeters: 240 },
      { distanceMeters: 410, accuracyMeters: 600 },
      { distanceMeters: 35, accuracyMeters: 180 },
      { distanceMeters: 520, accuracyMeters: 900 },
      { distanceMeters: 150, accuracyMeters: 320 },
      { distanceMeters: 90, accuracyMeters: 210 },
      { distanceMeters: 480, accuracyMeters: 750 },
      { distanceMeters: 20, accuracyMeters: 160 },
    ];

    let state = { inside: true, pendingVerdict: null, pendingCount: 0 };
    const transitions = [];

    scatteredFixes.forEach((fix) => {
      const verdict = evaluateGeofencePosition({
        ...fix,
        radiusMeters: RADIUS,
      });
      const result = reduceGeofenceState(state, verdict);
      state = result.state;
      if (result.transition) {
        transitions.push(result.transition);
      }
    });

    expect(transitions).toEqual([]);
    expect(state.inside).toBe(true);
  });

  it("still reacts once the fixes become accurate again", () => {
    let state = { inside: true, pendingVerdict: null, pendingCount: 0 };
    const transitions = [];

    const driveAway = [
      { distanceMeters: 700, accuracyMeters: 900 },
      { distanceMeters: 1400, accuracyMeters: 25 },
      { distanceMeters: 2100, accuracyMeters: 20 },
    ];

    driveAway.forEach((fix) => {
      const verdict = evaluateGeofencePosition({
        ...fix,
        radiusMeters: RADIUS,
      });
      const result = reduceGeofenceState(state, verdict);
      state = result.state;
      if (result.transition) {
        transitions.push(result.transition);
      }
    });

    expect(transitions).toEqual([GEOFENCE_OUTSIDE]);
  });
});

describe("parseGeofenceState", () => {
  it("migrates the previous 1/0 format", () => {
    expect(parseGeofenceState("1").inside).toBe(true);
    expect(parseGeofenceState("0").inside).toBe(false);
  });

  it("starts fresh when nothing is stored or the value is broken", () => {
    expect(parseGeofenceState(null)).toEqual(createInitialGeofenceState());
    expect(parseGeofenceState("{oops")).toEqual(createInitialGeofenceState());
  });

  it("round-trips the current format", () => {
    const state = {
      inside: false,
      pendingVerdict: "inside",
      pendingCount: 1,
      lastCallbackAt: 1_700_000_000_000,
      lastUsableFixAt: 1_699_999_000_000,
      pendingTransition: {
        direction: "outside",
        attempts: 2,
        nextAttemptAt: 1_700_000_060_000,
      },
    };

    expect(parseGeofenceState(JSON.stringify(state))).toEqual(state);
  });

  it("migrates the pre-split lastFixAt into both timestamps", () => {
    const migrated = parseGeofenceState(
      JSON.stringify({ inside: true, lastFixAt: 1_700_000_000_000 }),
    );

    expect(migrated.lastCallbackAt).toBe(1_700_000_000_000);
    expect(migrated.lastUsableFixAt).toBe(1_700_000_000_000);
  });

  it("starts with no timestamps at all when nothing was stored", () => {
    expect(parseGeofenceState('{"inside":true}').lastUsableFixAt).toBeNull();
    expect(parseGeofenceState("1").lastUsableFixAt).toBeNull();
  });
});

describe("markGeofenceCallback", () => {
  const NOW = 1_700_000_000_000;

  it("records every callback but only a usable fix advances the usable stamp", () => {
    const afterCoarse = markGeofenceCallback(
      createInitialGeofenceState(),
      NOW,
      false,
    );

    expect(afterCoarse.lastCallbackAt).toBe(NOW);
    expect(afterCoarse.lastUsableFixAt).toBeNull();

    const afterUsable = markGeofenceCallback(afterCoarse, NOW + 1000, true);

    expect(afterUsable.lastCallbackAt).toBe(NOW + 1000);
    expect(afterUsable.lastUsableFixAt).toBe(NOW + 1000);
  });
});

describe("transition lifecycle", () => {
  const NOW = 1_700_000_000_000;

  const pending = () => ({
    ...createInitialGeofenceState(),
    pendingTransition: {
      direction: GEOFENCE_OUTSIDE,
      attempts: 0,
      nextAttemptAt: 0,
    },
  });

  it("commits inside and clears the pending transition on success", () => {
    const committed = commitGeofenceTransition(pending(), GEOFENCE_OUTSIDE);

    expect(committed.inside).toBe(false);
    expect(committed.pendingTransition).toBeNull();
  });

  it("schedules a growing backoff on failure", () => {
    let state = pending();

    TRANSITION_RETRY_BACKOFF_MS.forEach((backoff, index) => {
      const result = failGeofenceTransition(state, GEOFENCE_OUTSIDE, NOW);
      state = result.state;

      expect(result.exhausted).toBe(false);
      expect(state.pendingTransition.attempts).toBe(index + 1);
      expect(state.pendingTransition.nextAttemptAt).toBe(NOW + backoff);
    });
  });

  it("gives up after the attempt limit", () => {
    let state = pending();
    let result;

    for (let i = 0; i < MAX_TRANSITION_ATTEMPTS; i += 1) {
      result = failGeofenceTransition(state, GEOFENCE_OUTSIDE, NOW);
      state = result.state;
    }

    expect(result.exhausted).toBe(true);
    expect(state.pendingTransition).toBeNull();
  });

  it("reports a retry as due only once its backoff has elapsed", () => {
    const { state } = failGeofenceTransition(pending(), GEOFENCE_OUTSIDE, NOW);

    expect(getDueTransition(state, NOW)).toBeNull();
    expect(getDueTransition(state, NOW + TRANSITION_RETRY_BACKOFF_MS[0])).toBe(
      GEOFENCE_OUTSIDE,
    );
    expect(getDueTransition(createInitialGeofenceState(), NOW)).toBeNull();
  });
});

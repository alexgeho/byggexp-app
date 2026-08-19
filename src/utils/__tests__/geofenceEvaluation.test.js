import {
  CONFIRMATIONS_REQUIRED,
  EXIT_HYSTERESIS_METERS,
  GEOFENCE_INSIDE,
  GEOFENCE_OUTSIDE,
  GEOFENCE_UNKNOWN,
  createInitialGeofenceState,
  evaluateGeofencePosition,
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
  const feed = (verdicts, initial = createInitialGeofenceState()) => {
    let state = initial;
    const transitions = [];

    verdicts.forEach((verdict) => {
      const result = reduceGeofenceState(state, verdict);
      state = result.state;
      if (result.transition) {
        transitions.push(result.transition);
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
    const state = { inside: false, pendingVerdict: "inside", pendingCount: 1 };

    expect(parseGeofenceState(JSON.stringify(state))).toEqual(state);
  });
});

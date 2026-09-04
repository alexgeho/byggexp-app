import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "../services/api";

// Lightweight, dependency-free product-event tracker — the mobile twin of the
// admin's src/shared/analytics.js. Onboarding is invisible unless we measure it
// (optimise for time-to-value, not checklist completion), so we emit step-level
// events. Events are buffered and flushed to the backend (POST /analytics/events)
// in small batches; the server stamps user/company/role from the JWT, so the
// client can't spoof them. Every call is wrapped so analytics can never throw
// into the UI. Events fired before sign-in stay queued until a token exists —
// the api interceptor attaches the Authorization header, and the endpoint 401s
// without one, so we simply retry until delivery succeeds.
const FLUSH_DELAY_MS = 2500;
const MAX_BATCH = 50;
const ONCE_PREFIX = "byggexp.evt.";

let queue = [];
let flushTimer = null;

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_DELAY_MS);
}

async function flush() {
  if (!queue.length) return;

  const batch = queue.slice(0, MAX_BATCH);
  try {
    await api.post("/analytics/events", { events: batch });
    queue = queue.slice(batch.length);
    if (queue.length) scheduleFlush(); // more waiting — drain the rest
  } catch {
    // Delivery failed (offline, not signed in yet, 5xx…). Keep the events and
    // try again later.
    scheduleFlush();
  }
}

export function track(event, props = {}) {
  try {
    queue.push({ event, props, ts: Date.now() });
    scheduleFlush();
  } catch {
    /* analytics must never break the app */
  }
}

// Fire an event at most once per key per install (e.g. "activation reached" or a
// given onboarding step). Persisted in AsyncStorage; resolves true if it fired.
export async function trackOnce(key, event, props = {}) {
  try {
    const flag = `${ONCE_PREFIX}${key}`;
    const seen = await AsyncStorage.getItem(flag);
    if (seen === "1") return false;
    await AsyncStorage.setItem(flag, "1");
    track(event, props);
    return true;
  } catch {
    return false;
  }
}

// Best-effort flush when the app goes to the background so trailing events
// aren't lost. Mounted once at module load.
AppState.addEventListener("change", (next) => {
  if (next === "background" || next === "inactive") flush();
});

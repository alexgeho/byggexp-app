import * as Sentry from "@sentry/react-native";

// Crash/error reporting. Enabled only when a DSN is provided via env, so it
// stays a no-op in local dev and won't break builds without configuration.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

export const isSentryEnabled = Boolean(DSN);

export const initSentry = () => {
  if (initialized || !DSN) {
    return;
  }

  Sentry.init({
    dsn: DSN,
    // Keep performance tracing light; raise if you need more detail.
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
  });

  initialized = true;
};

// Report a handled error (e.g. from the ErrorBoundary). No-op without a DSN.
export const captureException = (error, context) => {
  if (!DSN) {
    return;
  }

  Sentry.captureException(error, context ? { extra: context } : undefined);
};

export { Sentry };

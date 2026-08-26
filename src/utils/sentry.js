import * as Sentry from "@sentry/react-native";

// Crash/error reporting. Enabled only when a DSN is provided via env AND we
// are not in development, so local/simulator dev errors don't spam Sentry
// while the app is still being built. Re-enables automatically in
// release builds.
const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

export const isSentryEnabled = Boolean(DSN) && !__DEV__;

export const initSentry = () => {
  if (initialized || !isSentryEnabled) {
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
  if (!isSentryEnabled) {
    return;
  }

  Sentry.captureException(error, context ? { extra: context } : undefined);
};

// Report a handled condition that is not an Error. No-op without a DSN.
export const captureMessage = (message, context) => {
  if (!isSentryEnabled) {
    return;
  }

  Sentry.captureMessage(message, context ? { extra: context } : undefined);
};

// Trail attached to whatever is reported next. Callers must keep the payload
// free of anything that could identify a location or a person.
export const addBreadcrumb = (breadcrumb) => {
  if (!isSentryEnabled) {
    return;
  }

  Sentry.addBreadcrumb(breadcrumb);
};

export { Sentry };

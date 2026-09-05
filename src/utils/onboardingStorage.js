import AsyncStorage from "@react-native-async-storage/async-storage";

// The value-tour "seen" flag lives in WelcomeSlides but is reset here too, so
// keep the single source of truth for the key in one place. Bumping the version
// re-shows the tour once to everyone (see WelcomeSlides).
export const WELCOME_SLIDES_SEEN_KEY = "welcome-slides-seen-v4";

// Whether the user dismissed the "Kom igång" home checklist. Once dismissed
// (or once all steps are done) the card stays hidden.
const ONBOARDING_DISMISSED_KEY = "home-onboarding-dismissed";

export async function getOnboardingDismissed() {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_DISMISSED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setOnboardingDismissed() {
  try {
    await AsyncStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
  } catch {
    // ignore — worst case the card shows again next launch
  }
}

// Marks the "Anpassa startsidan" onboarding step done once the user has opened
// the Customize drawer (there's no server signal for "customised the home").
const CUSTOMIZE_OPENED_KEY = "home-onboarding-customize-opened";

export async function getOnboardingCustomizeOpened() {
  try {
    return (await AsyncStorage.getItem(CUSTOMIZE_OPENED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setOnboardingCustomizeOpened() {
  try {
    await AsyncStorage.setItem(CUSTOMIZE_OPENED_KEY, "1");
  } catch {
    // ignore
  }
}

// Marks the "Fyll i din profil" step done once the user has saved their account
// (they touched the profile — that's enough; they now know where it is).
const PROFILE_SAVED_KEY = "home-onboarding-profile-saved";

export async function getOnboardingProfileSaved() {
  try {
    return (await AsyncStorage.getItem(PROFILE_SAVED_KEY)) === "1";
  } catch {
    return false;
  }
}

export async function setOnboardingProfileSaved() {
  try {
    await AsyncStorage.setItem(PROFILE_SAVED_KEY, "1");
  } catch {
    // ignore
  }
}

// Admin onboarding focus (mirrors the web): which direction the checklist shows
// first — "fieldwork" (crews & jobs), "billing" (offers & invoices), or "skip".
// null = the routing question hasn't been answered yet.
const FOCUS_KEY = "home-onboarding-focus";

export async function getOnboardingFocus() {
  try {
    return (await AsyncStorage.getItem(FOCUS_KEY)) || null;
  } catch {
    return null;
  }
}

export async function setOnboardingFocus(value) {
  try {
    if (value) await AsyncStorage.setItem(FOCUS_KEY, value);
    else await AsyncStorage.removeItem(FOCUS_KEY);
  } catch {
    // ignore
  }
}

// The onboarding "seen/dismissed" flags above are stored per-device. That's fine
// for the common case (one device = one user), but if a DIFFERENT user signs in
// on the same install — a re-invited account, a handed-over work phone, or just
// testing — they'd inherit the previous user's "already onboarded" state and
// never see the value tour or the Kom igång checklist. So we remember which user
// the flags belong to and reset them the first time a new user id signs in.
// Called from the auth session bootstrap on every explicit login.
const LAST_ONBOARDED_USER_KEY = "onboarding-owner-user-id";

export async function resetOnboardingForNewUser(userId) {
  const id = userId ? String(userId) : "";
  if (!id) return;
  try {
    const previous = await AsyncStorage.getItem(LAST_ONBOARDED_USER_KEY);
    if (previous === id) return; // same user — keep their progress
    await AsyncStorage.multiRemove([
      WELCOME_SLIDES_SEEN_KEY,
      ONBOARDING_DISMISSED_KEY,
      CUSTOMIZE_OPENED_KEY,
      PROFILE_SAVED_KEY,
      FOCUS_KEY,
    ]);
    await AsyncStorage.setItem(LAST_ONBOARDED_USER_KEY, id);
  } catch {
    // ignore — worst case onboarding shows/hides one launch off
  }
}

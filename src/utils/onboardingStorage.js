import AsyncStorage from "@react-native-async-storage/async-storage";

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

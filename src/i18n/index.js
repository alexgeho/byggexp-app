import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import sv from "./locales/sv.json";

export const LANGUAGE_STORAGE_KEY = "app-language";

// Languages offered in the in-app language switcher. Add a locale JSON +
// an entry here to support a new language.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sv", label: "Svenska" },
];

// Fallback for text and for devices whose language we don't support.
// English is the most complete set, so missing keys fall back to it.
export const FALLBACK_LANGUAGE = "en";

// Language shown on the very first launch, before the user has picked one.
// Always English by design: the device language is intentionally ignored so
// first-time users (and App Store reviewers) always start in English; the
// user's own choice is persisted and honoured on every later launch.
export const DEFAULT_LANGUAGE = "en";

const resources = {
  en: { translation: en },
  sv: { translation: sv },
};

export function isSupportedLanguage(code) {
  return SUPPORTED_LANGUAGES.some((language) => language.code === code);
}

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LANGUAGE,
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

// Apply the user's persisted language choice, overriding the device default.
// Call this once on app start (before the first render if possible).
export async function loadStoredLanguage() {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && isSupportedLanguage(stored) && stored !== i18n.language) {
      await i18n.changeLanguage(stored);
    }
  } catch (error) {
    console.warn("i18n: failed to load stored language", error);
  }
}

// Change the active language and persist the choice for next launch.
export async function setLanguage(code) {
  if (!isSupportedLanguage(code)) {
    return;
  }
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch (error) {
    console.warn("i18n: failed to persist language", error);
  }
}

export default i18n;

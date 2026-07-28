import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
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

// Initial language when the device language is not one we support.
export const DEFAULT_LANGUAGE = "sv";

const resources = {
  en: { translation: en },
  sv: { translation: sv },
};

export function isSupportedLanguage(code) {
  return SUPPORTED_LANGUAGES.some((language) => language.code === code);
}

function getDeviceLanguage() {
  const code = getLocales()?.[0]?.languageCode;
  return isSupportedLanguage(code) ? code : DEFAULT_LANGUAGE;
}

i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
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

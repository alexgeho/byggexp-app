import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Locale bundles behind deferred (function-scoped) requires, so only the
// active locale's JSON is parsed at boot. English is always loaded (it's the
// default + fallback); other locales are parsed lazily on first use. Add a
// locale JSON + a loader here (and a SUPPORTED_LANGUAGES entry) for a new one.
const localeLoaders = {
  en: () => require("./locales/en.json"),
  sv: () => require("./locales/sv.json"),
  no: () => require("./locales/no.json"),
  pl: () => require("./locales/pl.json"),
  uk: () => require("./locales/uk.json"),
  ru: () => require("./locales/ru.json"),
  fi: () => require("./locales/fi.json"),
  et: () => require("./locales/et.json"),
  lt: () => require("./locales/lt.json"),
  lv: () => require("./locales/lv.json"),
};

export const LANGUAGE_STORAGE_KEY = "app-language";

// Languages offered in the in-app language switcher. Add a locale JSON +
// an entry here to support a new language.
export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "sv", label: "Svenska" },
  { code: "no", label: "Norsk" },
  { code: "pl", label: "Polski" },
  { code: "uk", label: "Ukrainska" },
  { code: "ru", label: "Russkij" },
  { code: "fi", label: "Suomi" },
  { code: "et", label: "Eesti" },
  { code: "lt", label: "Lietuvių" },
  { code: "lv", label: "Latviešu" },
];

// Fallback for text and for devices whose language we don't support.
// English is the most complete set, so missing keys fall back to it.
export const FALLBACK_LANGUAGE = "en";

// Language shown on the very first launch, before the user has picked one.
// Always Swedish by design: the device language is intentionally ignored so
// first-time users (and App Store reviewers) always start in Swedish; the
// user's own choice is persisted and honoured on every later launch.
export const DEFAULT_LANGUAGE = "sv";

export function isSupportedLanguage(code) {
  return SUPPORTED_LANGUAGES.some((language) => language.code === code);
}

// Parse and register a locale's bundle if it isn't loaded yet. Called before
// switching to a language so its strings are present. No-op for the already
// loaded / unknown locale.
function ensureLanguageLoaded(code) {
  const loader = localeLoaders[code];
  if (!loader || i18n.hasResourceBundle(code, "translation")) {
    return;
  }
  try {
    i18n.addResourceBundle(code, "translation", loader(), true, true);
  } catch (error) {
    console.warn(`i18n: failed to load locale "${code}"`, error);
  }
}

i18n.use(initReactI18next).init({
  // Boot with only the default locale; others are added on demand.
  resources: {
    [DEFAULT_LANGUAGE]: { translation: localeLoaders[DEFAULT_LANGUAGE]() },
  },
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
      ensureLanguageLoaded(stored);
      await i18n.changeLanguage(stored);
    }
  } catch (error) {
    console.warn("i18n: failed to load stored language", error);
  }
}

// Apply the language the admin assigned to this user (stored on the server as
// `user.language`), but ONLY if the user hasn't made their own explicit in-app
// choice — that always wins. Accepts a bare code or the legacy { code: name }
// object. No-op for unsupported codes (e.g. a locale not bundled yet), so it's
// safe to call before every locale JSON ships. Not persisted: the persisted key
// is reserved for the user's own choice, so a later admin change still applies.
export async function applyServerLanguage(language) {
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) {
      return; // the user's own choice takes precedence
    }
    const code =
      typeof language === "string"
        ? language
        : language
          ? Object.keys(language)[0]
          : "";
    if (code && isSupportedLanguage(code) && code !== i18n.language) {
      ensureLanguageLoaded(code);
      await i18n.changeLanguage(code);
    }
  } catch (error) {
    console.warn("i18n: failed to apply server language", error);
  }
}

// Change the active language and persist the choice for next launch.
export async function setLanguage(code) {
  if (!isSupportedLanguage(code)) {
    return;
  }
  ensureLanguageLoaded(code);
  await i18n.changeLanguage(code);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  } catch (error) {
    console.warn("i18n: failed to persist language", error);
  }
}

export default i18n;

import en from "../locales/en.json";
import sv from "../locales/sv.json";
import no from "../locales/no.json";

// English is the source of truth; every other locale must mirror its keys
// exactly. This guards against translation drift — a missing key silently
// falls back to English, and an extra key is dead weight.
const TRANSLATIONS = { sv, no };

// Flatten to sorted "a.b.c" leaf paths (arrays are treated as a single leaf so
// element counts can be compared separately).
const leafPaths = (obj, prefix = "") =>
  Object.entries(obj).flatMap(([key, value]) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? leafPaths(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );

const getAt = (obj, path) =>
  path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);

const placeholders = (value) =>
  [...String(value).matchAll(/{{\s*[^}]+\s*}}/g)]
    .map((m) => m[0].trim())
    .sort();

const enPaths = leafPaths(en);

describe("i18n locale parity", () => {
  it.each(Object.keys(TRANSLATIONS))(
    "%s has exactly the same keys as en",
    (locale) => {
      const localePaths = leafPaths(TRANSLATIONS[locale]);
      const enSet = new Set(enPaths);
      const locSet = new Set(localePaths);
      const missing = enPaths.filter((p) => !locSet.has(p));
      const extra = localePaths.filter((p) => !enSet.has(p));
      expect({ locale, missing, extra }).toEqual({
        locale,
        missing: [],
        extra: [],
      });
    },
  );

  it.each(Object.keys(TRANSLATIONS))(
    "%s has no empty string values",
    (locale) => {
      const empties = enPaths.filter((p) => {
        const v = getAt(TRANSLATIONS[locale], p);
        return typeof v === "string" && v.trim() === "";
      });
      expect({ locale, empties }).toEqual({ locale, empties: [] });
    },
  );

  it.each(Object.keys(TRANSLATIONS))(
    "%s preserves every interpolation placeholder",
    (locale) => {
      const mismatches = enPaths.filter((p) => {
        const ev = getAt(en, p);
        const lv = getAt(TRANSLATIONS[locale], p);
        if (typeof ev !== "string" || typeof lv !== "string") return false;
        return placeholders(ev).join(",") !== placeholders(lv).join(",");
      });
      expect({ locale, mismatches }).toEqual({ locale, mismatches: [] });
    },
  );

  it.each(Object.keys(TRANSLATIONS))(
    "%s keeps array values the same length as en",
    (locale) => {
      const mismatches = enPaths.filter((p) => {
        const ev = getAt(en, p);
        const lv = getAt(TRANSLATIONS[locale], p);
        return (
          Array.isArray(ev) && (!Array.isArray(lv) || ev.length !== lv.length)
        );
      });
      expect({ locale, mismatches }).toEqual({ locale, mismatches: [] });
    },
  );
});

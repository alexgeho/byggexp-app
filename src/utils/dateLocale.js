import i18n from "../i18n";

// Returns the active app language as a BCP-47 locale for date/time
// formatting. 'sv' and 'en' are valid Intl locales, so the language code
// can be used directly; falls back to English if unset.
export const getDateLocale = () => i18n.language || "en";

// Compact localized date like "5 Aug 2025" (day / short month / year). Returns
// "" for empty input and echoes the raw value back if it isn't a valid date.
// Shared by the billing (invoice/offer) create screens.
export const formatDisplayDate = (iso) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(getDateLocale(), {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Localized date, or null when the value is missing, unparseable, or the Unix
// epoch fallback (a null/zero date commonly serialises to 1970-01-01). Lets
// callers hide the row entirely so "Invalid Date" / "1/1/1970" never render.
export const formatDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  // Epoch-ish dates (<= 1970) are almost always a missing value, not real data.
  if (date.getUTCFullYear() <= 1970) return null;
  return date.toLocaleDateString(getDateLocale());
};

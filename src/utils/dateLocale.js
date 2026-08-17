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

import i18n from '../i18n';

// Returns the active app language as a BCP-47 locale for date/time
// formatting. 'sv' and 'en' are valid Intl locales, so the language code
// can be used directly; falls back to English if unset.
export const getDateLocale = () => i18n.language || 'en';

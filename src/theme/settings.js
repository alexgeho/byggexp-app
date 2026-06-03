/**
 * UI theme settings — tweak visual tokens here without touching component code.
 */

/** Opacity (0–1) of the colored square behind menu / form field icons. Icons stay fully opaque. */
export const iconBadgeBackgroundAlpha = 0.5;

/** Success popup — checkmark icon (no border on the circle). */
export const successPopupIconColor = "rgb(69, 179, 107)";
export const successPopupIconBackground = "rgba(69, 179, 107, 0.18)";

/** Task notification repeat — minute interval (minutes between reminders). */
export const defaultRepeatIntervalMinutes = 15;
export const minRepeatIntervalMinutes = 1;
export const maxRepeatIntervalMinutes = 180;
export const maxMinuteRepeatRuns = 64;
export const maxHourlyRepeatRuns = 64;

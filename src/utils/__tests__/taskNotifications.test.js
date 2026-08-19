// taskNotifications reads i18n for the unnamed-worker fallback; stub it.
// (theme/settings is pure constants: default 15, min 1, max 180.)
import {
  normalizeRepeatIntervalMinutes,
  normalizeTaskNotificationSettings,
  deriveNotificationReminderFlags,
} from "../taskNotifications";

jest.mock("../../i18n", () => ({
  __esModule: true,
  default: { language: "en", t: (key) => key },
}));

describe("normalizeRepeatIntervalMinutes", () => {
  it("clamps to the [1, 180] range", () => {
    expect(normalizeRepeatIntervalMinutes(0)).toBe(1);
    expect(normalizeRepeatIntervalMinutes(-10)).toBe(1);
    expect(normalizeRepeatIntervalMinutes(999)).toBe(180);
  });

  it("rounds fractional inputs", () => {
    expect(normalizeRepeatIntervalMinutes(5.6)).toBe(6);
  });

  it("falls back to the default (15) for non-numeric input", () => {
    expect(normalizeRepeatIntervalMinutes("abc")).toBe(15);
    expect(normalizeRepeatIntervalMinutes(undefined)).toBe(15);
  });
});

describe("normalizeTaskNotificationSettings", () => {
  it("returns sane defaults for empty input", () => {
    const result = normalizeTaskNotificationSettings(undefined);
    expect(result.repeat).toBe("none");
    expect(result.assignees).toEqual([]);
    // not-finite maxReminders normalizes to 0 (forever)
    expect(result.maxReminders).toBe(0);
  });

  it("keeps a valid repeat key and rejects an invalid one", () => {
    expect(normalizeTaskNotificationSettings({ repeat: "daily" }).repeat).toBe(
      "daily",
    );
    expect(normalizeTaskNotificationSettings({ repeat: "bogus" }).repeat).toBe(
      "none",
    );
  });

  it("clamps maxReminders and keeps positive values", () => {
    expect(
      normalizeTaskNotificationSettings({ maxReminders: 5 }).maxReminders,
    ).toBe(5);
    expect(
      normalizeTaskNotificationSettings({ maxReminders: -1 }).maxReminders,
    ).toBe(0);
    expect(
      normalizeTaskNotificationSettings({ maxReminders: 500 }).maxReminders,
    ).toBe(100);
  });

  it("filters assignees without an id", () => {
    const result = normalizeTaskNotificationSettings({
      assignees: [{ id: "a", name: "Bob" }, { name: "no id" }],
    });
    expect(result.assignees).toEqual([
      { id: "a", name: "Bob", profession: "" },
    ]);
  });
});

describe("deriveNotificationReminderFlags", () => {
  it("uses the custom reminder when a message is present", () => {
    const result = deriveNotificationReminderFlags({ customMessage: "Do it" });
    expect(result.customReminder).toBe(true);
    expect(result.autoReminder).toBe(false);
    expect(result.allMembersNotification).toBe(true);
    expect(result.assignees).toEqual([]);
  });

  it("uses the auto reminder when the message is blank", () => {
    expect(
      deriveNotificationReminderFlags({ customMessage: "   " }).autoReminder,
    ).toBe(true);
    expect(
      deriveNotificationReminderFlags({ customMessage: "" }).customReminder,
    ).toBe(false);
  });
});

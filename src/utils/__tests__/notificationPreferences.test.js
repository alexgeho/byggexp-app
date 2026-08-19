import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  normalizeNotificationPreferences,
} from "../notificationPreferences";

describe("normalizeNotificationPreferences", () => {
  it("returns all defaults for missing/empty input", () => {
    expect(normalizeNotificationPreferences(undefined)).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    expect(normalizeNotificationPreferences({})).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
    expect(normalizeNotificationPreferences(null)).toEqual(
      DEFAULT_NOTIFICATION_PREFERENCES,
    );
  });

  it("keeps explicit boolean values", () => {
    expect(
      normalizeNotificationPreferences({
        flowMode: false,
        messages: true,
        tasks: false,
        productAndMarketingAlerts: false,
      }),
    ).toEqual({
      flowMode: false,
      messages: true,
      tasks: false,
      productAndMarketingAlerts: false,
    });
  });

  it("ignores non-boolean values and falls back to the default", () => {
    const result = normalizeNotificationPreferences({
      messages: "nope",
      tasks: 0,
    });
    expect(result.messages).toBe(true);
    expect(result.tasks).toBe(true);
  });

  it("overrides only the provided key", () => {
    const result = normalizeNotificationPreferences({ messages: false });
    expect(result.messages).toBe(false);
    expect(result.flowMode).toBe(true);
    expect(result.tasks).toBe(true);
    expect(result.productAndMarketingAlerts).toBe(true);
  });
});

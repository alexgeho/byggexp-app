import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  resetOnboardingForNewUser,
  WELCOME_SLIDES_SEEN_KEY,
} from "../onboardingStorage";

jest.mock("@react-native-async-storage/async-storage", () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
  multiRemove: jest.fn().mockResolvedValue(undefined),
}));

const FLAG_KEYS = [
  WELCOME_SLIDES_SEEN_KEY,
  "home-onboarding-dismissed",
  "home-onboarding-customize-opened",
  "home-onboarding-profile-saved",
  "home-onboarding-focus",
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("resetOnboardingForNewUser", () => {
  it("clears every onboarding flag when a NEW user id signs in", async () => {
    AsyncStorage.getItem.mockResolvedValue("old-user"); // previous owner

    await resetOnboardingForNewUser("new-user");

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(FLAG_KEYS);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "onboarding-owner-user-id",
      "new-user",
    );
  });

  it("keeps progress (no reset) when the SAME user signs in again", async () => {
    AsyncStorage.getItem.mockResolvedValue("same-user");

    await resetOnboardingForNewUser("same-user");

    expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("resets on first-ever login (no previous owner recorded)", async () => {
    AsyncStorage.getItem.mockResolvedValue(null);

    await resetOnboardingForNewUser("first-user");

    expect(AsyncStorage.multiRemove).toHaveBeenCalledWith(FLAG_KEYS);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      "onboarding-owner-user-id",
      "first-user",
    );
  });

  it("is a no-op without a user id", async () => {
    await resetOnboardingForNewUser(undefined);
    await resetOnboardingForNewUser("");

    expect(AsyncStorage.getItem).not.toHaveBeenCalled();
    expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
  });

  it("coerces a numeric user id and compares as string", async () => {
    AsyncStorage.getItem.mockResolvedValue("42");

    await resetOnboardingForNewUser(42);

    expect(AsyncStorage.multiRemove).not.toHaveBeenCalled();
  });
});

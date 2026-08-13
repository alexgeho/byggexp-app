import { Platform } from "react-native";

/** Gap between screen header and the first block below (search, form, scroll, etc.). */
export const standardScreenContentGap = 12;

// Native clears the status bar / notch with a fixed pad. On web a fixed value
// double-counts the status bar (content sits too low vs native), so use the
// real safe-area inset — env() is passed through by react-native-web and
// resolves to the status-bar height on the iOS PWA, 0 on desktop.
const screenPaddingTop =
  Platform.OS === "web" ? "env(safe-area-inset-top)" : 48;

export const standardScreenContainer = {
  flex: 1,
  backgroundColor: "#f2f1f6",
  paddingHorizontal: 12,
  paddingTop: screenPaddingTop,
  paddingBottom: 48,
  gap: standardScreenContentGap,
};

/** Scroll screens that place the header inside contentContainerStyle. */
export const standardScreenScrollContent = {
  paddingHorizontal: 12,
  paddingTop: screenPaddingTop,
  paddingBottom: 140,
  gap: standardScreenContentGap,
};

export const standardScreenHeaderSpacing = {
  paddingTop: 20,
  paddingBottom: 10,
};

export const standardScreenHeader = {
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  ...standardScreenHeaderSpacing,
};

export const standardScreenHeaderPlaceholder = {
  width: 36,
};

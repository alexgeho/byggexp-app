import { Platform } from "react-native";

/** Gap between screen header and the first block below (search, form, scroll, etc.). */
export const standardScreenContentGap = 12;

// The web build is full-bleed (viewport-fit=cover), so like native it draws
// under the status bar and needs top padding (~50) to clear it.
const screenPaddingTop = Platform.OS === "web" ? 50 : 48;

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

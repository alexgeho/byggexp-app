/** Gap between screen header and the first block below (search, form, scroll, etc.). */
export const standardScreenContentGap = 12;

export const standardScreenContainer = {
  flex: 1,
  backgroundColor: "#f2f1f6",
  paddingHorizontal: 12,
  paddingTop: 48,
  paddingBottom: 48,
  gap: standardScreenContentGap,
};

/** Scroll screens that place the header inside contentContainerStyle. */
export const standardScreenScrollContent = {
  paddingHorizontal: 12,
  paddingTop: 48,
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

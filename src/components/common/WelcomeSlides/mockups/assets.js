// Photographic assets used by the value-tour mockups. Only genuine photos
// (avatars, on-site building photos, document thumbnails) are bundled images;
// every mockup's chrome and text is rebuilt in React Native so it themes and
// localizes. Exported from Figma (file UudMBHSSsCsBpq6m1z3B0X, onboarding
// frames) — see HANDOFF.
export const ONB = {
  avatarMarcus: require("../../../../assets/onboarding/avatar-marcus.png"),
  avatarAmara: require("../../../../assets/onboarding/avatar-amara.png"),
  thumbB1: require("../../../../assets/onboarding/thumb-b1.png"),
  thumbB2: require("../../../../assets/onboarding/thumb-b2.png"),
  thumbB3: require("../../../../assets/onboarding/thumb-b3.png"),
  thumbB4: require("../../../../assets/onboarding/thumb-b4.png"),
  docBlueprint: require("../../../../assets/onboarding/doc-blueprint.png"),
  docPhoto: require("../../../../assets/onboarding/doc-photo.png"),
  photo1: require("../../../../assets/onboarding/photo-1.png"),
  photo2: require("../../../../assets/onboarding/photo-2.png"),
  photo3: require("../../../../assets/onboarding/photo-3.png"),
  photo4: require("../../../../assets/onboarding/photo-4.png"),
  photo5: require("../../../../assets/onboarding/photo-5.png"),
  photo6: require("../../../../assets/onboarding/photo-6.png"),
  photo7: require("../../../../assets/onboarding/photo-7.png"),
  receipt: require("../../../../assets/onboarding/receipt.png"),
};

// DM Sans (the Figma type family, loaded in App.js). "SemiBold" is mapped to the
// Medium ttf in App.js, matching the app-wide convention.
export const FONT = {
  regular: "DMSans-Regular",
  medium: "DMSans-Medium",
  semibold: "DMSans-SemiBold",
  bold: "DMSans-Bold",
};

// Shared palette for the mockups, sampled 1:1 from the Figma onboarding frames.
export const MOCK = {
  navy: "#052D50",
  brand: "#0785F4", // primary blue (button, dots, accents) — Figma #0785F4
  blue: "#007AFF", // iOS systemBlue used inside the app mockups (tabs, links)
  blueSoft: "#4A9EFF",
  glow: "rgba(76,171,255,0.14)", // #4CABFF @14% halo behind the card
  label: "#667E93", // secondary label (project, meta) — Figma #667E93
  labelDark: "#4B5563",
  card: "#FFFFFF",
  cardAlt: "#F6F8FB",
  track: "#EAECEE",
  line: "#E4E8EF",
  green: "#04B251",
  greenBg: "#E5F7EA",
  red: "#FC1D2C",
  redBg: "#FFDCDE",
};

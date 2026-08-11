import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  mainActionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  actionButton: {
    width: 124,
    height: 124,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  actionButtonPaused: {
    opacity: 0.85,
  },

  actionButtonCamera: {
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.3,
  },

  actionButtonCameraThemed: {
    borderRadius: 999,
    opacity: 1,
    // Figma: frosted translucent circle behind the white camera icon.
    // A hairline white stroke defines its edge over the blue gradient; on the
    // solid-white light-theme button the same stroke is invisible (white/white).
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },

  iconAction: {
    width: 40,
    height: 40,
    resizeMode: "contain",
    tintColor: "#2F80ED",
    opacity: 0.85,
  },

  icon: {
    width: 124,
    height: 124,
    resizeMode: "contain",
  },
});

import { Platform, StyleSheet } from "react-native";

// Extracted from DocumentPreviewScreen.jsx.
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1723",
  },
  actionsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  actionsSpacer: {
    flex: 1,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
  },
  fileName: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 12,
    paddingHorizontal: 44,
  },
  previewCard: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0B1723",
  },
  webview: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 23, 35, 0.16)",
  },
  unsupportedWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  unsupportedTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    marginBottom: 8,
  },
  unsupportedText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(11, 23, 35, 0.28)",
  },
});

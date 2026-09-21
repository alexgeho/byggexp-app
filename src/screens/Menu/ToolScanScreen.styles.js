import { StyleSheet } from "react-native";

// Extracted from ToolScanScreen.jsx. The scanning view lies on the camera feed
// and is white-on-black whatever the theme is; the permission view is an
// ordinary page, so it takes the theme — it used to be a fixed light screen
// with navy text in the middle of a dark app.
export const createStyles = (c) =>
  StyleSheet.create({
    fill: { flex: 1, backgroundColor: "#000" },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      backgroundColor: c.background,
    },
    centerScreen: { flex: 1, backgroundColor: c.background, paddingTop: 48 },
    overlay: { ...StyleSheet.absoluteFillObject, paddingTop: 48 },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    title: {
      flex: 1,
      textAlign: "center",
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "600",
    },
    frameWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    frame: {
      width: 240,
      height: 240,
      borderRadius: 24,
      borderWidth: 3,
      borderColor: "rgba(255,255,255,0.9)",
    },
    hint: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "600",
      marginTop: 20,
      textAlign: "center",
      paddingHorizontal: 24,
    },
    error: {
      color: "#FFB4B4",
      fontSize: 14,
      marginTop: 10,
      textAlign: "center",
      paddingHorizontal: 24,
    },
    permTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: c.textPrimary,
      marginBottom: 8,
    },
    permText: { color: c.textSecondary, textAlign: "center", marginBottom: 20 },
    permBtn: {
      backgroundColor: "#0785F4",
      paddingHorizontal: 24,
      height: 50,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    permBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  });

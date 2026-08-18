import { StyleSheet } from "react-native";

// Extracted from ToolScanScreen.jsx.
export const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#000" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  centerScreen: { flex: 1, backgroundColor: "#f2f1f6", paddingTop: 48 },
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
    color: "#052D50",
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
    color: "#052D50",
    marginBottom: 8,
  },
  permText: { color: "#5F7588", textAlign: "center", marginBottom: 20 },
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

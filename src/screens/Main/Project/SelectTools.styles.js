import { StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";
import { onDark } from "../../../theme/colorUtils";

// Extracted from SelectTools.jsx.
export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
      justifyContent: "space-between",
      alignItems: "center",
    },
    // "Loading…" under the spinner: without a colour it renders RN's default
    // black, which disappears on the dark page.
    loadingText: {
      color: onDark(c, c.textMuted, "#000000"),
    },
    centeredContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: c.background,
    },
    header: {
      ...standardScreenHeader,
    },
    projectName: {
      color: c.textPrimary,
      flex: 1,
      textAlign: "center",
      fontSize: 17,
      fontWeight: "500",
    },
    toolItem: {
      width: "100%",
      padding: 8,
      borderRadius: 999,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.surface,
      gap: 16,
      marginBottom: 12,
    },
    toolIcon: {
      width: 46,
      height: 46,
      borderRadius: 9999,
      backgroundColor: onDark(c, c.accentSoft, "#E8F2FE"),
      alignItems: "center",
      justifyContent: "center",
    },
    toolInfo: {
      flex: 1,
    },
    toolName: {
      fontSize: 16,
      color: c.textPrimary,
    },
    toolMeta: {
      fontSize: 14,
      color: c.textMuted,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderWidth: 1,
      borderRadius: 7,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
      borderColor: c.surface,
      marginRight: 8,
    },
    noToolsText: {
      textAlign: "center",
      marginTop: 20,
      color: c.textMuted,
      fontSize: 16,
    },
  });

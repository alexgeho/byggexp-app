import { Dimensions, StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

const PHOTO_GAP = 10;
const PHOTO_THUMB = Math.floor(
  (Dimensions.get("window").width - 12 * 2 - PHOTO_GAP * 2) / 3,
);

// Extracted from ChatProfileScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      flex: 1,
      color: c.textPrimary,
      fontSize: 17,
      textAlign: "center",
    },
    editButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.surface,
    },
    scroll: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      paddingBottom: 150,
    },
    identity: {
      alignItems: "center",
      paddingVertical: 16,
      gap: 6,
    },
    avatar: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: "#D9D9D9",
    },
    avatarFallback: {
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitials: {
      color: c.textPrimary,
      fontSize: 40,
      fontWeight: "700",
    },
    name: {
      marginTop: 8,
      color: c.textPrimary,
      fontSize: 22,
    },
    subtitle: {
      color: c.textMuted,
      fontSize: 15,
      fontWeight: "500",
    },
    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.surface,
      borderRadius: 20,
      padding: 20,
    },
    field: {
      gap: 4,
    },
    fieldSpacing: {
      marginTop: 12,
    },
    fieldLabel: {
      color: c.textMuted,
      fontSize: 14,
      fontWeight: "500",
    },
    fieldValue: {
      color: c.textPrimary,
      fontSize: 17,
      fontWeight: "500",
    },
    photosBlock: {
      marginTop: 20,
      gap: 12,
    },
    photosHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    photosDate: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: "500",
    },
    photosCount: {
      color: c.textMuted,
      fontSize: 13,
      fontWeight: "500",
    },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: PHOTO_GAP,
    },
    photoThumb: {
      width: PHOTO_THUMB,
      height: PHOTO_THUMB,
      borderRadius: 6,
      backgroundColor: "#D9D9D9",
    },
  });

import { Dimensions, StyleSheet } from "react-native";

// Photo grid metrics (3-up thumbnails) used by the style factory below.
const PHOTO_GAP = 10;
const PHOTO_COLS = 3;
const PHOTO_THUMB = Math.floor(
  (Dimensions.get("window").width - 12 * 2 - PHOTO_GAP * (PHOTO_COLS - 1)) /
    PHOTO_COLS,
);

// Extracted from ProjectScreen.jsx — themed style factory (c = theme.content).
export const createStyles = (c) =>
  StyleSheet.create({
    screenExtra: {
      justifyContent: "space-between",
      alignItems: "center",
    },
    centeredContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    statusText: {
      marginTop: 12,
      color: c.textMuted,
    },
    tabScroll: {
      width: "100%",
      flexGrow: 0,
    },
    tabContainer: {
      flexDirection: "row",
      gap: 8,
      paddingRight: 12,
    },
    tabButton: {
      paddingVertical: 9,
      paddingHorizontal: 16,
      backgroundColor: c.surfaceMuted,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.surface,
    },
    activeTab: {
      borderColor: c.accent,
    },
    tabText: {
      color: c.textPrimary,
      textAlign: "center",
    },
    tabLoading: {
      paddingVertical: 40,
      alignItems: "center",
    },

    // Economy tab
    ecoCardPad: {
      marginBottom: 16,
    },
    ecoRateRow: {
      flexDirection: "row",
      gap: 12,
    },
    ecoRateFoot: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
    },
    ecoMutedText: {
      fontSize: 13,
      color: c.textMuted,
      flex: 1,
    },
    ecoStrong: {
      color: c.textPrimary,
      fontWeight: "700",
    },

    // Photos grid
    photoSection: {
      gap: 12,
      marginBottom: 12,
    },
    photoSectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    photoSectionDate: {
      color: c.textPrimary,
      fontSize: 16,
      fontWeight: "500",
    },
    photoSectionCount: {
      color: c.textMuted,
      fontSize: 14,
    },
    photoGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: PHOTO_GAP,
    },
    photoThumb: {
      width: PHOTO_THUMB,
      height: PHOTO_THUMB,
      borderRadius: 14,
      backgroundColor: "#E5E9ED",
    },
    receiptTag: {
      position: "absolute",
      top: 6,
      right: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: "#F59E0B",
      alignItems: "center",
      justifyContent: "center",
    },

    // Full-screen photo preview
    scrollContainer: {
      flex: 1,
      width: "100%",
    },
    scrollContent: {
      paddingBottom: 120,
      width: "100%",
      gap: 12,
    },
    emptyState: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: c.surface,
    },
    emptyStateTitle: {
      color: c.textPrimary,
      fontSize: 18,
      marginBottom: 6,
    },
    emptyStateText: {
      color: c.textMuted,
    },
    documentItem: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 16,
      gap: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: c.surface,
      marginBottom: 16,
      flexDirection: "row",
      alignItems: "center",
    },
    documentPreviewContainer: {
      width: 80,
      height: 80,
      borderRadius: 12,
      overflow: "hidden",
      backgroundColor: "#EFF3F8",
    },
    documentPreviewImage: {
      width: "100%",
      height: "100%",
    },
    documentFilePreview: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: 8,
      gap: 8,
    },
    documentFileType: {
      color: c.textPrimary,
      fontSize: 11,
      fontWeight: "700",
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      color: c.textPrimary,
      fontSize: 15,
    },
    documentMeta: {
      color: c.textMuted,
      marginTop: 4,
    },
    documentArrowIcon: {
      width: 10,
      height: 20,
      tintColor: c.textPrimary,
    },
    workerItem: {
      width: "100%",
      padding: 10,
      borderRadius: 16,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: c.surface,
      borderWidth: 1,
      // Same admin card look as the Employees / Chat lists.
      borderColor: "#E6EAF1",
      gap: 16,
      marginBottom: 12,
    },
    workerAvatar: {
      width: 46,
      height: 46,
      borderRadius: 9999,
    },
    workerName: {
      flex: 1,
      color: c.textPrimary,
    },
    workerInfo: {
      flex: 1,
    },
    workerSubtitle: {
      marginTop: 2,
      color: c.textMuted,
      fontSize: 12,
    },
    arrowIcon: {
      width: 16,
      height: 26,
      marginRight: 12,
    },
  });

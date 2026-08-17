import { Dimensions, StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
} from "../../../styles/screenLayout";

const H_PAD = 12; // matches standardScreenContainer paddingHorizontal
const GAP = 10;
const COLS = 3;
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const THUMB = Math.floor((SCREEN_WIDTH - H_PAD * 2 - GAP * (COLS - 1)) / COLS);

export const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    gap: 0,
  },
  centered: {
    ...standardScreenContainer,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    flex: 1,
    color: "#052D50",
    fontSize: 20,
    textAlign: "center",
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "#FFFFFF50",
  },

  // Search bar (revealed by the header search button)
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#052D500D",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#052D50",
    padding: 0,
  },

  // Segmented tabs: Shift photos / Receipts (expense)
  tabs: {
    flexDirection: "row",
    marginTop: 12,
    padding: 4,
    // Figma: segmented control uses a soft 10px radius, not a full pill.
    borderRadius: 10,
    backgroundColor: "#052D500D",
  },
  tab: {
    flex: 1,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#052D50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tabText: {
    fontSize: 15,
    color: "#698196",
  },
  tabTextActive: {
    color: "#052D50",
  },

  contentScroll: {
    flex: 1,
    width: "100%",
  },
  contentScrollContent: {
    paddingTop: 20,
    paddingBottom: 150,
    gap: 24,
  },

  // Date-grouped section
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionDate: {
    color: "#052D50",
    fontSize: 16,
  },
  sectionCount: {
    color: "#698196",
    fontSize: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GAP,
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    // Figma: photo thumbnails use a 6px radius.
    borderRadius: 6,
    backgroundColor: "#E5E9ED",
  },

  // Empty states
  emptyBlock: {
    marginTop: 40,
    padding: 24,
    alignItems: "center",
  },
  emptyIcon: {
    width: 28,
    height: 28,
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyBlockTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
    marginBottom: 6,
  },
  emptyBlockText: {
    color: "#698196",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },

  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 140,
  },

  // Receipt scan overlay
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5, 45, 80, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  scanOverlayText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },

  // Full-screen photo preview
});

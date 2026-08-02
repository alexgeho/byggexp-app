import { Platform, StyleSheet } from "react-native";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../../styles/screenLayout";

export const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
    gap: 0,
  },
  contentScroll: {
    flex: 1,
    width: "100%",
  },
  contentScrollContent: {
    gap: 12,
    paddingBottom: 140,
  },
  centered: {
    ...standardScreenContainer,
  },
  header: {
    ...standardScreenHeader,
  },
  headerPlaceholder: {
    ...standardScreenHeaderPlaceholder,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  modeToggle: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  modeBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(7, 133, 244, 0.35)",
  },
  modeBtnActive: {
    backgroundColor: "#0785F4",
    borderColor: "#0785F4",
  },
  modeBtnText: {
    color: "#0785F4",
    fontSize: 14,
    fontWeight: "600",
  },
  modeBtnTextActive: {
    color: "#ffffff",
  },
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
  emptyStateContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 140,
  },
  loadingContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 140,
  },
  projectCard: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  projectCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  projectCardLabel: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
  },
  activeShiftBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: "rgba(58, 129, 219, 0.1)",
    borderRadius: 10,
  },
  activeShiftBadgeText: {
    color: "rgba(58, 129, 219, 1)",
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    textAlign: "center",
  },
  projectName: {
    marginTop: 10,
    color: "rgba(5, 45, 80, 1)",
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "600",
  },
  actionButton: {
    marginTop: 12,
    backgroundColor: "rgba(7, 133, 244, 1)",
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButton: {
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    backgroundColor: "rgba(255, 255, 255, 1)",
    borderWidth: 1,
    borderColor: "rgba(7, 133, 244, 0.72)",
    ...(Platform.OS === "web"
      ? {
          backdropFilter: "blur(4.5px)",
          WebkitBackdropFilter: "blur(4.5px)",
        }
      : {}),
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonIcon: {
    width: 20,
    height: 20,
  },
  secondaryButtonIcon: {
    width: 20,
    height: 20,
  },
  actionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "rgba(7, 133, 244, 0.9)",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  cameraHint: {
    color: "#698196",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    marginBottom: 32,
  },
  photosCard: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 1)",
    borderRadius: 20,
    ...(Platform.OS === "web"
      ? {
          backdropFilter: "blur(4.5px)",
          WebkitBackdropFilter: "blur(4.5px)",
        }
      : {}),
  },
  photosCardTitle: {
    color: "rgba(5, 45, 80, 1)",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    marginBottom: 14,
  },
  photosEmptyBlock: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(5, 45, 80, 0.12)",
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 14,
  },
  photosEmptyIcon: {
    width: 20,
    height: 20,
    marginBottom: 10,
  },
  photosEmptyTitle: {
    color: "rgba(5, 45, 80, 1)",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  photosEmptyDescription: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  photosAttachedBlock: {
    marginBottom: 14,
  },
  photosAttachedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },
  photosAttachedTitle: {
    color: "rgba(5, 45, 80, 1)",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    flex: 1,
  },
  attachedPhotoItem: {
    gap: 12,
  },
  attachedPhotoItemSpacing: {
    marginBottom: 16,
  },
  attachedPhotoMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  attachedPhotoMetaText: {
    flex: 1,
    gap: 2,
  },
  attachedPhotoName: {
    color: "rgba(5, 45, 80, 1)",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
  },
  attachedPhotoDate: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  visibleInShiftsBadge: {
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: "rgba(58, 129, 219, 0.1)",
    borderRadius: 10,
    flexShrink: 0,
  },
  visibleInShiftsBadgeText: {
    color: "rgba(58, 129, 219, 1)",
    fontSize: 13,
    lineHeight: 22,
    fontWeight: "500",
    textAlign: "center",
  },
  photosDivider: {
    height: 1,
    backgroundColor: "rgba(5, 45, 80, 0.1)",
    marginBottom: 14,
  },
  photosFooter: {
    color: "rgba(95, 117, 136, 1)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "400",
  },
  photo: {
    width: "100%",
    height: 220,
    borderRadius: 16,
    backgroundColor: "#f2f1f6",
  },
  emptyTitle: {
    color: "#052D50",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyText: {
    color: "#698196",
    textAlign: "center",
  },
});

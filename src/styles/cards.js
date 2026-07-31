import { StyleSheet } from "react-native";

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    padding: 20,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    // Admin card look: visible light border + soft navy shadow so cards
    // stand out from the light page background instead of blending in.
    borderColor: "#E6EAF1",
    shadowColor: "#0B2545",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  cardSelected: {
    borderColor: "#0785F4",
  },

  cardHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },

  cardTitle: {
    color: "#052D50",
    flex: 1,
    flexShrink: 1,
    fontSize: 17,
    fontWeight: "500",
  },

  cardPrimaryText: {
    color: "#0785F4",
  },

  cardSecondaryText: {
    color: "#698196",
  },

  cardBadge: {
    height: 28,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    flexShrink: 0,
    alignSelf: "flex-start",
    fontWeight: "500",
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
    textAlignVertical: "center",
    overflow: "hidden",
  },

  cardBadgeOpen: {
    color: "#0785F4",
    backgroundColor: "#0785F41A",
  },

  cardBadgeOverdue: {
    color: "#FF3B30",
    backgroundColor: "#FF3B301F",
  },

  cardBadgeCompleted: {
    color: "#248A3D",
    backgroundColor: "#34C75924",
  },

  cardBadgeWarning: {
    color: "#C77700",
    backgroundColor: "#FF95001F",
  },

  cardBadgeAvailable: {
    color: "#248A3D",
    backgroundColor: "#34C75924",
  },

  cardBadgeBroken: {
    color: "#FF3B30",
    backgroundColor: "#FF3B301F",
  },

  cardBadgeInRepair: {
    color: "#C77700",
    backgroundColor: "#FF95001F",
  },

  cardBadgeOccupied: {
    color: "#0785F4",
    backgroundColor: "#0785F41A",
  },

  cardBadgeNeutral: {
    color: "#698196",
    backgroundColor: "#69819624",
  },

  cardBadgeAtWork: {
    color: "#338600",
    backgroundColor: "rgba(51, 134, 0, 0.1)",
  },

  cardBadgeAbsent: {
    color: "#FF0000",
    backgroundColor: "rgba(255, 0, 0, 0.1)",
  },
});

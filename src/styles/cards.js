import { StyleSheet } from "react-native";

export const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    padding: 20,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
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

  cardBadge: {
    color: "#2582D9",
    backgroundColor: "#2582D91A",
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

  cardPrimaryText: {
    color: "#0785F4",
  },

  cardSecondaryText: {
    color: "#698196",
  },
});
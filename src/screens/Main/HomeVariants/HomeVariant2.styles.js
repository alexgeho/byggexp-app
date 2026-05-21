import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: 20,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  main: {
    marginTop: 30,
    paddingBottom: 30,
    gap: 24,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  quickActionCard: {
    width: "47%",
    minHeight: 116,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    padding: 20,
    borderRadius: 20,
    justifyContent: "space-between",
  },
  quickActionIcon: {
    width: 28,
    height: 28,
    resizeMode: "contain",
    tintColor: "#fff",
  },
  quickActionText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 20,
    fontWeight: "600",
  },
});

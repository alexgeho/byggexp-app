import { StyleSheet } from "react-native";

export function createStyles(theme) {
  return StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: "#EEF5FB",
    padding: 16,
    paddingTop: 48,
    paddingBottom: 48,
  },
  header: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  backButton: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  backIcon: {
    width: 20,
    height: 20,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  placeholder: {
    width: 36,
  },
  sectionTitle: {
    color: "#698196",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 8,
  },
  menuSection: {
    marginBottom: 16,
  },
  settingsSection: {
    marginBottom: 24,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  groupCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  menuIcon: {
    width: 16,
    height: 16,
    tintColor: "#ffffff",
  },
  menuTitle: {
    flex: 1,
    marginLeft: 12,
    color: "#052D50",
    fontSize: 16,
  },
  arrowIcon: {
    width: 16,
    height: 16,
    tintColor: "#698196",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.0625,
    shadowRadius: 10,
    elevation: 2,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 18,
    color: "#052D50",
    marginBottom: 4,
  },
  roleBadge: {
    backgroundColor: "#2582D91A",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  roleText: {
    fontSize: 12,
    color: "#2582D9",
    fontWeight: "500",
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  });
}

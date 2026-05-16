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
    flex: 1,
    justifyContent: "space-between",
    marginBottom: 30,
  },
  projectSelector: {
    alignSelf: "center",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,

    padding: 20,

    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.20)",
  },
  projectSelectorText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "DMSans-Medium",
    fontSize: 17,
    lineHeight: 22,
  },

  mainActionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 35,
  },
  actionButton: {
    width: 124,
    height: 124,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  actionButtonCamera: {
    justifyContent: "center",
    alignItems: "center",
    opacity: 0.3,
  },
  iconAction: {
    width: 124,
    height: 124,
    resizeMode: "contain",
  },
  icon: {
    width: 124,
    height: 124,
    resizeMode: "contain",
  },
  footer: {
    flexDirection: "row",
    height: 68,
    alignItems: "center",
    marginTop: "auto",
    paddingVertical: 20,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    /*  borderColor: "#fffff",
    borderWidth: 1, */
    marginBottom: 20,
  },
});

import { StyleSheet } from "react-native";

// Extracted from RegisterVerifyScreen.jsx.
export const styles = StyleSheet.create({
  flex: { flex: 1 },
  page: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 404,
    padding: 32,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    alignItems: "center",
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#eaf2fb",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heading: {
    color: "#052d50",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  body: {
    color: "#052d50",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  hint: {
    color: "#687898",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  info: {
    color: "#2f80ed",
    fontSize: 13,
    marginTop: 16,
  },
  button: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3183ff",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginTop: 24,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  footerLink: {
    marginTop: 18,
    alignItems: "center",
  },
  footerText: {
    color: "#687898",
    fontSize: 13,
  },
});

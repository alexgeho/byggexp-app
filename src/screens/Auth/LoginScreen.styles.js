import { StyleSheet } from "react-native";

// Extracted from LoginScreen.jsx — static stylesheet.
export const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
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
  },
  header: {
    marginBottom: 28,
  },
  welcome: {
    color: "#687898",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  heading: {
    color: "#052d50",
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
  },
  error: {
    color: "#c62828",
    marginBottom: 16,
    fontSize: 13,
  },
  label: {
    color: "#052d50",
    fontSize: 12,
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  labelInRow: {
    marginBottom: 0,
  },
  forgotInline: {
    color: "#052d50",
    fontSize: 12,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#e7ecf0",
    borderRadius: 24,
    backgroundColor: "#ffffff",
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#052d50",
    fontSize: 14,
  },
  button: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3183ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  footerLink: {
    marginTop: 24,
    alignItems: "flex-start",
  },
  brandRow: {
    position: "absolute",
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  brandLogo: {
    width: 150,
    height: 20,
  },
  footerText: {
    color: "#687898",
    fontSize: 12,
  },
  footerLinkText: {
    color: "#052d50",
    fontWeight: "500",
  },
});

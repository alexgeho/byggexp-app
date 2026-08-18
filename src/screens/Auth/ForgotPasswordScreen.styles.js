import { StyleSheet } from "react-native";

// Extracted from ForgotPasswordScreen.jsx.
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
  },
  cardCentered: {
    alignItems: "center",
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
  subtitle: {
    color: "#687898",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
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
    alignSelf: "stretch",
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
    alignItems: "center",
  },
  footerText: {
    color: "#687898",
    fontSize: 12,
  },
});

import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";

// "Forgot password": the user enters their email, we ask the backend to send a
// reset link. The link opens a web page where they choose a new password; then
// they come back and sign in with email + the new password. This screen has two
// states: the email form, and a "check your inbox" confirmation.
export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { requestPasswordReset } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setError(t("auth.fillAllFields"));
      return;
    }
    setError("");
    setLoading(true);
    await requestPasswordReset(trimmed);
    setLoading(false);
    // Always show the confirmation — the API never reveals whether the email
    // has an account.
    setSent(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={["#eaf2fb", "#dce9f6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
        >
          {sent ? (
            <View style={[styles.card, styles.cardCentered]}>
              <View style={styles.iconCircle}>
                <Icon name="mail" size={28} color="#3183ff" />
              </View>
              <Text
                style={[
                  styles.heading,
                  { fontFamily: theme.text.fontFamily.regular },
                ]}
              >
                {t("forgotPassword.sentTitle")}
              </Text>
              <Text style={styles.body}>
                {t("forgotPassword.sentTo", { email: email.trim() })}
              </Text>
              <Text style={styles.hint}>{t("forgotPassword.hint")}</Text>

              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.85}
                style={styles.button}
              >
                <Text style={styles.buttonText}>
                  {t("forgotPassword.backToLogin")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.header}>
                <Text
                  style={[
                    styles.welcome,
                    { fontFamily: theme.text.fontFamily.regular },
                  ]}
                >
                  {t("forgotPassword.eyebrow")}
                </Text>
                <Text
                  style={[
                    styles.heading,
                    { fontFamily: theme.text.fontFamily.regular },
                  ]}
                >
                  {t("forgotPassword.title")}
                </Text>
                <Text style={styles.subtitle}>
                  {t("forgotPassword.subtitle")}
                </Text>
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Text style={styles.label}>{t("auth.email")}</Text>
              <View style={styles.inputWrapper}>
                <Icon
                  name="mail"
                  size={16}
                  color="#687898"
                  style={styles.inputIcon}
                />
                <TextInput
                  placeholder={t("auth.emailPlaceholder")}
                  placeholderTextColor="#a7b3c2"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading}
                activeOpacity={0.85}
                style={[styles.button, loading && styles.buttonDisabled]}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {t("forgotPassword.submit")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                style={styles.footerLink}
              >
                <Text style={styles.footerText}>
                  {t("forgotPassword.backToLogin")}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
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

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

export default function CodeLoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { requestLoginCode, loginWithCode, isLoading } =
    useContext(AuthContext);

  // Two steps: enter email -> request code; then enter the 6-digit code.
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError(t("codeLogin.enterEmail"));
      return;
    }
    setError("");
    setSending(true);
    await requestLoginCode(trimmedEmail);
    setSending(false);
    setStep("code");
  };

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 4) {
      setError(t("codeLogin.enterCode"));
      return;
    }
    setError("");
    const result = await loginWithCode(email.trim(), trimmedCode);
    if (!result.success) {
      setError(result.message || t("codeLogin.invalidCode"));
    }
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
          <View style={styles.card}>
            <View style={styles.header}>
              <Text
                style={[
                  styles.welcome,
                  { fontFamily: theme.text.fontFamily.regular },
                ]}
              >
                {t("codeLogin.title")}
              </Text>
              <Text
                style={[
                  styles.heading,
                  { fontFamily: theme.text.fontFamily.regular },
                ]}
              >
                {step === "email"
                  ? t("codeLogin.subtitle")
                  : t("codeLogin.sentTo", { email: email.trim() })}
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            {step === "email" ? (
              <>
                <Text style={styles.label}>{t("codeLogin.emailLabel")}</Text>
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
                  onPress={handleSendCode}
                  disabled={sending}
                  activeOpacity={0.85}
                  style={[styles.button, sending && styles.buttonDisabled]}
                >
                  {sending ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {t("codeLogin.sendCode")}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t("codeLogin.codeLabel")}</Text>
                <View style={styles.inputWrapper}>
                  <Icon
                    name="key"
                    size={16}
                    color="#687898"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    placeholder={t("codeLogin.codePlaceholder")}
                    placeholderTextColor="#a7b3c2"
                    style={[styles.input, styles.codeInput]}
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    autoFocus
                    maxLength={6}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={isLoading}
                  activeOpacity={0.85}
                  style={[styles.button, isLoading && styles.buttonDisabled]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      {t("codeLogin.verify")}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSendCode}
                  style={styles.footerLink}
                >
                  <Text style={styles.footerLinkText}>
                    {t("codeLogin.resend")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep("email");
                    setCode("");
                    setError("");
                  }}
                  style={styles.footerLink}
                >
                  <Text style={styles.footerText}>
                    {t("codeLogin.changeEmail")}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.footerLink}
            >
              <Text style={styles.footerText}>
                {t("codeLogin.backToLogin")}
              </Text>
            </TouchableOpacity>
          </View>
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
  codeInput: {
    fontSize: 20,
    letterSpacing: 6,
    fontWeight: "700",
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
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#687898",
    fontSize: 12,
  },
  footerLinkText: {
    color: "#052d50",
    fontSize: 13,
    fontWeight: "600",
  },
});

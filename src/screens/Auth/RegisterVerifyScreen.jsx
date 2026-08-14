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

export default function RegisterVerifyScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { verifyRegistration, resendRegistrationCode, isLoading } =
    useContext(AuthContext);

  const email = route?.params?.email || "";
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 4) {
      setError(t("registerVerify.enterCode"));
      return;
    }
    setError("");
    const result = await verifyRegistration(email, trimmedCode);
    if (!result.success) {
      setError(result.message || t("registerVerify.invalidCode"));
    }
    // On success the app switches to the main navigator automatically.
  };

  const handleResend = async () => {
    setError("");
    await resendRegistrationCode(email);
    setResent(true);
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
                {t("registerVerify.title")}
              </Text>
              <Text
                style={[
                  styles.heading,
                  { fontFamily: theme.text.fontFamily.regular },
                ]}
              >
                {t("registerVerify.sentTo", { email })}
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            {resent ? (
              <Text style={styles.info}>{t("registerVerify.resent")}</Text>
            ) : null}

            <Text style={styles.label}>{t("registerVerify.codeLabel")}</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="key"
                size={16}
                color="#687898"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder={t("registerVerify.codePlaceholder")}
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
                  {t("registerVerify.verify")}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleResend} style={styles.footerLink}>
              <Text style={styles.footerLinkText}>
                {t("registerVerify.resend")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              style={styles.footerLink}
            >
              <Text style={styles.footerText}>
                {t("registerVerify.changeDetails")}
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
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
  },
  error: {
    color: "#c62828",
    marginBottom: 16,
    fontSize: 13,
  },
  info: {
    color: "#2f80ed",
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

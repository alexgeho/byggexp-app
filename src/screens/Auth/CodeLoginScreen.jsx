import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { styles } from "./CodeLoginScreen.styles";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";

export default function CodeLoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { requestLoginCode, loginWithCode, isLoading } =
    useContext(AuthContext);
  const { showError } = useFeedback();

  // Two steps: enter email -> request code; then enter the 6-digit code.
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendCode = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      showError({ message: t("codeLogin.enterEmail") });
      return;
    }
    setSending(true);
    await requestLoginCode(trimmedEmail);
    setSending(false);
    setStep("code");
  };

  const handleVerify = async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 4) {
      showError({ message: t("codeLogin.enterCode") });
      return;
    }
    const result = await loginWithCode(email.trim(), trimmedCode);
    if (!result.success) {
      showError({ message: result.message || t("codeLogin.invalidCode") });
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

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
import { styles } from "./ForgotPasswordScreen.styles";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { useTheme } from "../../theme/ThemeContext";

// "Forgot password": the user enters their email, we ask the backend to send a
// reset link. The link opens a web page where they choose a new password; then
// they come back and sign in with email + the new password. This screen has two
// states: the email form, and a "check your inbox" confirmation.
export default function ForgotPasswordScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { requestPasswordReset } = useContext(AuthContext);
  const { showError } = useFeedback();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      showError({ message: t("auth.fillAllFields") });
      return;
    }
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

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
import { styles } from "./RegisterScreen.styles";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { isValidEmail } from "../../utils/validation";

// Minimal-friction sign-up: just a name/company + email. The password is chosen
// later, on the page opened from the confirmation link.
export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { registerCompany, isLoading } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (isLoading) {
      return;
    }

    const trimmedName = companyName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail) {
      setError(t("auth.fillAllFields"));
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t("auth.invalidEmail"));
      return;
    }

    setError("");

    const result = await registerCompany({
      companyName: trimmedName,
      email: trimmedEmail,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    // We emailed a confirmation link; the account is created once they open it
    // and choose a password. If the email was already awaiting confirmation,
    // tell the user we re-sent the link rather than looking like a fresh sign-up.
    const confirmEmail = result.email || trimmedEmail;
    showSuccess({
      title: result.alreadyPending
        ? t("auth.alreadyPendingTitle")
        : t("auth.emailSentTitle"),
      message: result.alreadyPending
        ? t("auth.alreadyPendingMessage", { email: confirmEmail })
        : t("registerVerify.sentTo", { email: confirmEmail }),
    });
    navigation.navigate("RegisterVerify", { email: confirmEmail });
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
                {t("auth.welcome")}
              </Text>
              <Text
                style={[
                  styles.heading,
                  { fontFamily: theme.text.fontFamily.regular },
                ]}
              >
                {t("auth.registerSubtitle")}
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.label}>{t("auth.nameOrCompany")}</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="briefcase"
                size={16}
                color="#687898"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder={t("auth.nameOrCompanyPlaceholder")}
                placeholderTextColor="#a7b3c2"
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                autoCapitalize="words"
              />
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
              onPress={handleSignup}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.button, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>{t("auth.signUp")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.footerLink}
            >
              <Text style={styles.footerText}>
                {t("auth.alreadyMember")}
                <Text style={styles.footerLinkText}>{t("auth.loginHere")}</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

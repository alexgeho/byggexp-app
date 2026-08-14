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

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { registerCompany, isLoading } = useContext(AuthContext);
  const [companyName, setCompanyName] = useState("");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    if (isLoading) {
      return;
    }

    const trimmedCompany = companyName.trim();
    const trimmedName = userName.trim();
    const trimmedEmail = email.trim();

    if (
      !trimmedCompany ||
      !trimmedName ||
      !trimmedEmail ||
      !password ||
      !confirmPassword
    ) {
      setError(t("auth.fillAllFields"));
      return;
    }

    if (password.length < 6) {
      setError(t("auth.passwordTooShort"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.passwordsDontMatch"));
      return;
    }

    setError("");

    const result = await registerCompany({
      companyName: trimmedCompany,
      userName: trimmedName,
      email: trimmedEmail,
      password,
    });

    if (!result.success) {
      setError(result.message);
      return;
    }

    // Account isn't created until the emailed code is verified.
    navigation.navigate("RegisterVerify", {
      email: result.email || trimmedEmail,
    });
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

            <Text style={styles.label}>{t("auth.companyName")}</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="briefcase"
                size={16}
                color="#687898"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder={t("auth.companyNamePlaceholder")}
                placeholderTextColor="#a7b3c2"
                style={styles.input}
                value={companyName}
                onChangeText={setCompanyName}
                autoCapitalize="words"
              />
            </View>

            <Text style={styles.label}>{t("auth.yourName")}</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="user"
                size={16}
                color="#687898"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder={t("auth.yourNamePlaceholder")}
                placeholderTextColor="#a7b3c2"
                style={styles.input}
                value={userName}
                onChangeText={setUserName}
                autoCapitalize="words"
                autoComplete="name"
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

            <Text style={styles.label}>{t("auth.password")}</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="lock"
                size={16}
                color="#687898"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder={t("auth.passwordPlaceholder")}
                placeholderTextColor="#a7b3c2"
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
              />
            </View>

            <Text style={styles.label}>{t("auth.confirmPassword")}</Text>
            <View style={styles.inputWrapper}>
              <Icon
                name="lock"
                size={16}
                color="#687898"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder={t("auth.confirmPasswordPlaceholder")}
                placeholderTextColor="#a7b3c2"
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
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
    alignItems: "center",
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

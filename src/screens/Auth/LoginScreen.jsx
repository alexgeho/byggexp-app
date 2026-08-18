import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { styles } from "./LoginScreen.styles";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { isValidEmail } from "../../utils/validation";
import logoByggexp from "../../assets/logo-byggexp.png";

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { login, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (isLoading) {
      return;
    }

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setError(t("auth.fillAllFields"));
      return;
    }

    if (!isValidEmail(trimmedEmail)) {
      setError(t("auth.invalidEmail"));
      return;
    }

    setError("");

    const success = await login(trimmedEmail, password);
    if (!success) {
      setError(t("auth.loginFailedMessage"));
    }
  };

  return (
    <LinearGradient
      colors={["#eaf2fb", "#dce9f6"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.page}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
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
                {t("auth.loginSubtitle")}
              </Text>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Text style={styles.label}>{t("auth.emailOrUsername")}</Text>
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
                autoComplete="username"
              />
            </View>

            <View style={styles.labelRow}>
              <Text style={[styles.label, styles.labelInRow]}>
                {t("auth.password")}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Text style={styles.forgotInline}>
                  {t("auth.forgotPassword")}
                </Text>
              </TouchableOpacity>
            </View>
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
                secureTextEntry={!showPassword}
                autoComplete="current-password"
              />
              <TouchableOpacity
                onPress={() => setShowPassword((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color="#687898"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
              style={[styles.button, isLoading && styles.buttonDisabled]}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>{t("auth.logIn")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("Register")}
              style={styles.footerLink}
            >
              <Text style={styles.footerText}>
                {t("auth.noAccount")}
                <Text style={styles.footerLinkText}>
                  {t("auth.createHere")}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={styles.brandRow} pointerEvents="none">
        <Image
          source={logoByggexp}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </View>
    </LinearGradient>
  );
}

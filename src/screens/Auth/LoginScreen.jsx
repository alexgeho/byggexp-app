import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import logoByggexp from "../../assets/logo-byggexp.png";

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { login, isLoading } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // The reset link only surfaces after a failed sign-in — no clutter otherwise.
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async () => {
    const success = await login(email, password);
    if (!success) {
      setShowForgot(true);
      Alert.alert(t("auth.loginFailedTitle"), t("auth.loginFailedMessage"));
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

            {showForgot ? (
              <TouchableOpacity
                onPress={() => navigation.navigate("ForgotPassword")}
                style={styles.footerLink}
              >
                <Text style={styles.footerText}>
                  {t("auth.forgotPassword")}
                </Text>
              </TouchableOpacity>
            ) : null}

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

const styles = StyleSheet.create({
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

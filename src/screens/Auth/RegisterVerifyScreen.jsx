import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { styles } from "./RegisterVerifyScreen.styles";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import AuthContext from "../../contexts/AuthContext";
import { useTheme } from "../../theme/ThemeContext";

// After sign-up we email a confirmation link. The user opens it on their phone;
// the app catches the deep link and signs them in automatically (MagicLinkHandler).
// This screen just tells them to check their inbox, with a resend option.
export default function RegisterVerifyScreen({ navigation, route }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { resendRegistrationCode } = useContext(AuthContext);

  const email = route?.params?.email || "";
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
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
            <View style={styles.iconCircle}>
              <Icon name="mail" size={28} color="#3183ff" />
            </View>

            <Text
              style={[
                styles.heading,
                { fontFamily: theme.text.fontFamily.regular },
              ]}
            >
              {t("registerVerify.title")}
            </Text>
            <Text style={styles.body}>
              {t("registerVerify.sentTo", { email })}
            </Text>
            <Text style={styles.hint}>{t("registerVerify.hint")}</Text>

            {resent ? (
              <Text style={styles.info}>{t("registerVerify.resent")}</Text>
            ) : null}

            <TouchableOpacity
              onPress={handleResend}
              activeOpacity={0.85}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
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

            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              style={styles.footerLink}
            >
              <Text style={styles.footerText}>
                {t("registerVerify.backToLogin")}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

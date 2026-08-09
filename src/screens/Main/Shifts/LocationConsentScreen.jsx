import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BackButton } from "../../../components/common/BackButton/BackButton";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../../styles/screenLayout";
import { useTheme } from "../../../theme/ThemeContext";
import {
  LOCATION_CONSENT_PROMPTED_KEY,
  requestBackgroundLocationPermission,
} from "../../../utils/backgroundGeofence";

export default function LocationConsentScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [requesting, setRequesting] = useState(false);

  // Reaching this screen counts as "prompted" — don't auto-show it again.
  useEffect(() => {
    AsyncStorage.setItem(
      LOCATION_CONSENT_PROMPTED_KEY,
      String(Date.now()),
    ).catch(() => {});
  }, []);

  const bullets = [
    t("locationConsent.bulletStart", {
      defaultValue:
        "Starts your shift automatically when you arrive at the project site.",
    }),
    t("locationConsent.bulletStop", {
      defaultValue:
        "Ends your shift automatically when you leave — even if the app is closed or your phone is locked.",
    }),
    t("locationConsent.bulletControl", {
      defaultValue:
        "You can turn this off any time in your phone's location settings.",
    }),
  ];

  const handleEnable = async () => {
    if (requesting) {
      return;
    }

    setRequesting(true);
    try {
      const granted = await requestBackgroundLocationPermission();
      if (granted) {
        navigation.goBack();
        return;
      }

      Alert.alert(
        t("locationConsent.deniedTitle", {
          defaultValue: "Background location is off",
        }),
        t("locationConsent.deniedBody", {
          defaultValue:
            'To enable automatic shifts, allow location access "Always" for ByggExp in your phone settings.',
        }),
        [
          { text: t("common.cancel", { defaultValue: "Cancel" }) },
          {
            text: t("locationConsent.openSettings", {
              defaultValue: "Open settings",
            }),
            onPress: () => Linking.openSettings().catch(() => {}),
          },
        ],
      );
    } finally {
      setRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={"rgba(255, 255, 255, 0.6)"}
          tint={"light"}
          borderColor="#FFFFFF"
          onPress={() => navigation.goBack()}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily.semiBold },
          ]}
        >
          {t("locationConsent.title", { defaultValue: "Automatic shifts" })}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.heroCard}>
          <View
            style={[
              styles.heroIconWrap,
              { backgroundColor: `${theme.colors.primary}1A` },
            ]}
          >
            <Image
              source={require("../../../assets/WorkShifts.png")}
              style={[styles.heroIcon, { tintColor: theme.colors.primary }]}
            />
          </View>

          <Text
            style={[
              styles.heroTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("locationConsent.heroTitle", {
              defaultValue: "Let ByggExp track shifts for you",
            })}
          </Text>

          <Text
            style={[
              styles.heroText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {t("locationConsent.heroText", {
              defaultValue:
                "ByggExp uses your location in the background to clock you in and out of the project site so you never forget to start or stop a shift.",
            })}
          </Text>
        </View>

        <View style={styles.groupCard}>
          {bullets.map((item, index) => (
            <View
              key={index}
              style={[
                styles.bulletRow,
                index === bullets.length - 1 && styles.bulletRowLast,
              ]}
            >
              <View
                style={[
                  styles.bullet,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
              <Text
                style={[
                  styles.bulletText,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>

        <Text
          style={[
            styles.disclaimer,
            { fontFamily: theme.text.fontFamily.medium },
          ]}
        >
          {t("locationConsent.disclaimer", {
            defaultValue:
              "Your location is used only to detect arrival at and departure from your project sites. It is never shared for advertising.",
          })}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[
            styles.primaryButton,
            { backgroundColor: theme.colors.primary },
            requesting && styles.buttonDisabled,
          ]}
          onPress={handleEnable}
          disabled={requesting}
        >
          {requesting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.primaryButtonText,
                { fontFamily: theme.text.fontFamily.semiBold },
              ]}
            >
              {t("locationConsent.enable", {
                defaultValue: "Enable automatic shifts",
              })}
            </Text>
          )}
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          disabled={requesting}
        >
          <Text
            style={[
              styles.secondaryButtonText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {t("locationConsent.notNow", { defaultValue: "Not now" })}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...standardScreenContainer,
  },
  header: {
    ...standardScreenHeader,
  },
  headerTitle: {
    color: "#052D50",
    fontSize: 17,
    textAlign: "center",
  },
  placeholder: {
    ...standardScreenHeaderPlaceholder,
  },
  scrollContainer: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 24,
  },
  heroCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroIcon: {
    width: 32,
    height: 32,
    resizeMode: "contain",
  },
  heroTitle: {
    color: "#052D50",
    fontSize: 22,
    marginBottom: 8,
    textAlign: "center",
  },
  heroText: {
    color: "#698196",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },
  groupCard: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    padding: 20,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  bulletRowLast: {
    marginBottom: 0,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    color: "#052D50",
    fontSize: 15,
    lineHeight: 22,
  },
  disclaimer: {
    color: "#698196",
    fontSize: 13,
    lineHeight: 19,
    paddingHorizontal: 4,
  },
  footer: {
    width: "100%",
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  primaryButton: {
    width: "100%",
    height: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  secondaryButton: {
    width: "100%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: "#698196",
    fontSize: 15,
  },
});

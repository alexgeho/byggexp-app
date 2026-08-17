import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
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

// AsyncStorage key: only prompt for the battery-optimization exemption once.
const BATTERY_OPT_PROMPTED_KEY = "shiftBatteryOptPromptedAt";

export default function LocationConsentScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const [requesting, setRequesting] = useState(false);

  // Reaching this screen counts as "prompted" — don't auto-show it again.
  useEffect(() => {
    AsyncStorage.setItem(
      LOCATION_CONSENT_PROMPTED_KEY,
      String(Date.now()),
    ).catch(() => {});
  }, []);

  // Android throttles the foreground-service location stream under Doze unless
  // the app is exempt from battery optimisation, so auto check-out only fires
  // when the phone wakes. After background permission is granted, walk the user
  // to "Unrestricted" once. (iOS handles background geofencing natively — no
  // equivalent step.)
  const maybePromptBatteryOptimization = async () => {
    if (Platform.OS !== "android") {
      return;
    }

    const alreadyPrompted = await AsyncStorage.getItem(
      BATTERY_OPT_PROMPTED_KEY,
    ).catch(() => null);
    if (alreadyPrompted) {
      return;
    }
    await AsyncStorage.setItem(
      BATTERY_OPT_PROMPTED_KEY,
      String(Date.now()),
    ).catch(() => {});

    Alert.alert(
      t("locationConsent.batteryTitle", { defaultValue: "One more step" }),
      t("locationConsent.batteryBody", {
        defaultValue:
          'So ByggExp can start and end shifts while your phone is locked, set its battery usage to "Unrestricted" (App battery usage → Unrestricted).',
      }),
      [
        { text: t("locationConsent.batteryLater", { defaultValue: "Later" }) },
        {
          text: t("locationConsent.openSettings", {
            defaultValue: "Open settings",
          }),
          onPress: () => Linking.openSettings().catch(() => {}),
        },
      ],
    );
  };

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
        await maybePromptBatteryOptimization();
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

const createStyles = (c) =>
  StyleSheet.create({
    container: {
      ...standardScreenContainer,
      backgroundColor: c.background,
    },
    header: {
      ...standardScreenHeader,
    },
    headerTitle: {
      color: c.textPrimary,
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
      backgroundColor: c.surfaceMuted,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.surface,
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
      color: c.textPrimary,
      fontSize: 22,
      marginBottom: 8,
      textAlign: "center",
    },
    heroText: {
      color: c.textMuted,
      fontSize: 15,
      lineHeight: 22,
      textAlign: "center",
    },
    groupCard: {
      width: "100%",
      backgroundColor: c.surfaceMuted,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: c.surface,
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
      color: c.textPrimary,
      fontSize: 15,
      lineHeight: 22,
    },
    disclaimer: {
      color: c.textMuted,
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
      color: c.textMuted,
      fontSize: 15,
    },
  });

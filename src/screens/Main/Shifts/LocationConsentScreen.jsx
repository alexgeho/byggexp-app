import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { Screen } from "../../../components/common/Screen/Screen";
import { createStyles } from "./LocationConsentScreen.styles";
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
    <Screen
      title={t("locationConsent.title", { defaultValue: "Automatic shifts" })}
      onBack={() => navigation.goBack()}
    >
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
    </Screen>
  );
}

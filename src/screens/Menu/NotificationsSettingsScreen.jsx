import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { Screen } from "../../components/common/Screen/Screen";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { notificationsService } from "../../services";
import { createStyles } from "./NotificationsSettingsScreen.styles";
import { useTheme } from "../../theme/ThemeContext";
import {
  normalizeNotificationPreferences,
  NOTIFICATION_PREFERENCE_ITEMS,
} from "../../utils/notificationPreferences";

export default function NotificationsSettingsScreen() {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { user, updateStoredUser } = useContext(AuthContext);
  const { showSuccess } = useFeedback();
  const [preferences, setPreferences] = useState(() =>
    normalizeNotificationPreferences(user?.notificationPreferences),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      try {
        setLoading(true);
        const nextPreferences =
          await notificationsService.getNotificationPreferences();
        if (!isMounted) {
          return;
        }
        setPreferences(normalizeNotificationPreferences(nextPreferences));
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setPreferences(
          normalizeNotificationPreferences(user?.notificationPreferences),
        );
        console.error("Failed to load notification preferences:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, [user?.notificationPreferences]);

  const cardRows = useMemo(
    () =>
      NOTIFICATION_PREFERENCE_ITEMS.map((item) => ({
        ...item,
        value: Boolean(preferences[item.key]),
      })),
    [preferences],
  );

  const handleToggle = (key, value) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      const savedPreferences = normalizeNotificationPreferences(
        await notificationsService.updateNotificationPreferences(preferences),
      );

      await updateStoredUser({
        ...user,
        notificationPreferences: savedPreferences,
      });

      showSuccess({
        title: t("notifications.savedTitle"),
        message: t("notifications.savedMessage"),
      });
      navigation.navigate("Menu");
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      Alert.alert(
        t("notifications.saveErrorTitle"),
        t("notifications.saveErrorMessage"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen title={t("notifications.title")} onBack={() => navigation.goBack()}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <Text
            style={[
              styles.introTitle,
              { fontFamily: theme.text.fontFamily.semiBold },
            ]}
          >
            {t("notifications.introTitle")}
          </Text>
          <Text
            style={[
              styles.introText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            {t("notifications.introText")}
          </Text>
        </View>

        <View style={styles.groupCard}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { fontFamily: theme.text.fontFamily.medium },
                ]}
              >
                {t("notifications.loading")}
              </Text>
            </View>
          ) : (
            cardRows.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.settingRow,
                  index !== cardRows.length - 1 && styles.settingRowDivider,
                ]}
              >
                <View style={styles.settingTextWrap}>
                  <Text
                    style={[
                      styles.settingLabel,
                      { fontFamily: theme.text.fontFamily.semiBold },
                    ]}
                  >
                    {t(`notifications.items.${item.key}.label`, item.label)}
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { fontFamily: theme.text.fontFamily.medium },
                    ]}
                  >
                    {t(
                      `notifications.items.${item.key}.description`,
                      item.description,
                    )}
                  </Text>
                </View>

                <Switch
                  value={item.value}
                  onValueChange={(value) => handleToggle(item.key, value)}
                  trackColor={{
                    false: "rgba(5, 45, 80, 0.18)",
                    true: "#34C759",
                  }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="rgba(5, 45, 80, 0.18)"
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        onActionPress={handleSave}
        addDisabled={loading || saving}
        renderActionContent={() =>
          saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>{t("common.save")}</Text>
          )
        }
      />
    </Screen>
  );
}

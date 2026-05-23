import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { BackButton } from "../../components/common/BackButton/BackButton";
import { BottomBar } from "../../components/common/BottomBar/BottomBar";
import AuthContext from "../../contexts/AuthContext";
import { useFeedback } from "../../contexts/FeedbackContext";
import { notificationsService } from "../../services";
import {
  standardScreenContainer,
  standardScreenHeader,
  standardScreenHeaderPlaceholder,
} from "../../styles/screenLayout";
import { useTheme } from "../../theme/ThemeContext";
import {
  normalizeNotificationPreferences,
  NOTIFICATION_PREFERENCE_ITEMS,
} from "../../utils/notificationPreferences";

export default function NotificationsSettingsScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
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
        const nextPreferences = await notificationsService.getNotificationPreferences();
        if (!isMounted) {
          return;
        }
        setPreferences(normalizeNotificationPreferences(nextPreferences));
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setPreferences(normalizeNotificationPreferences(user?.notificationPreferences));
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
        title: "Notifications saved",
        message: "Your notification preferences have been updated.",
      });
      navigation.navigate("Menu");
    } catch (error) {
      console.error("Failed to save notification preferences:", error);
      Alert.alert("Unable to save", "Please try again.");
    } finally {
      setSaving(false);
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
          iconSource={require("../../assets/Arrow-left.png")}
        />
        <Text
          style={[
            styles.headerTitle,
            { fontFamily: theme.text.fontFamily.semiBold },
          ]}
        >
          Notifications
        </Text>
        <View style={styles.placeholder} />
      </View>

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
            Choose what you want to receive
          </Text>
          <Text
            style={[
              styles.introText,
              { fontFamily: theme.text.fontFamily.medium },
            ]}
          >
            These settings are saved for your user and affect which push
            notifications are sent to your devices.
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
                Loading notification settings...
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
                    {item.label}
                  </Text>
                  <Text
                    style={[
                      styles.settingDescription,
                      { fontFamily: theme.text.fontFamily.medium },
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>

                <Switch
                  value={item.value}
                  onValueChange={(value) => handleToggle(item.key, value)}
                  trackColor={{
                    false: "rgba(5, 45, 80, 0.18)",
                    true: theme.colors.primary,
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
            <Text style={styles.saveButtonText}>Save</Text>
          )
        }
      />
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
  },
  scrollContent: {
    paddingBottom: 150,
    gap: 14,
  },
  introCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  introTitle: {
    color: "#052D50",
    fontSize: 18,
    marginBottom: 8,
  },
  introText: {
    color: "rgba(5, 45, 80, 0.7)",
    fontSize: 14,
    lineHeight: 22,
  },
  groupCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  settingRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(5, 45, 80, 0.08)",
  },
  settingTextWrap: {
    flex: 1,
    paddingRight: 6,
  },
  settingLabel: {
    color: "#052D50",
    fontSize: 16,
    marginBottom: 6,
  },
  settingDescription: {
    color: "rgba(5, 45, 80, 0.62)",
    fontSize: 13,
    lineHeight: 20,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 22,
  },
  loadingText: {
    color: "rgba(5, 45, 80, 0.72)",
    fontSize: 14,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import { MOCK, FONT } from "./assets";

// Task auto-reminders, rebuilt from the real lock-screen reference: two stacked
// push notifications for the same task — showing that reminders keep coming
// until the job is confirmed done. Titles/time localize; the app-icon tile is
// drawn.
function Banner({ title, time, body }) {
  return (
    <View style={styles.banner}>
      <LinearGradient
        colors={["#3AA0FF", "#0785F4"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.icon}
      >
        <Text style={styles.iconText}>BYGG</Text>
        <Text style={styles.iconText}>EXP</Text>
      </LinearGradient>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.text} numberOfLines={3}>
          {body}
        </Text>
      </View>
    </View>
  );
}

export function NotificationMock() {
  const { t } = useTranslation();
  const body = t("welcome.notif.body", {
    defaultValue:
      'It\'s time for "Electrical test zones A-B. Finish by 14:30…". Confirm it as done — otherwise the reminders keep coming.',
  });
  return (
    <View style={styles.wrap}>
      <Banner
        title={t("welcome.notif.title1", { defaultValue: "Reminder" })}
        time={t("welcome.notif.now", { defaultValue: "now" })}
        body={body}
      />
      <Banner
        title={t("welcome.notif.title2", { defaultValue: "Task due" })}
        time={t("welcome.notif.earlier", { defaultValue: "16 min" })}
        body={body}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 12 },
  banner: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 22,
    padding: 14,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.2,
    lineHeight: 12,
  },
  body: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", marginBottom: 3 },
  title: { flex: 1, fontSize: 15, fontFamily: FONT.semibold, color: MOCK.navy },
  time: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: "#8A94A6",
    marginLeft: 8,
  },
  text: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: MOCK.labelDark,
    lineHeight: 18,
  },
});

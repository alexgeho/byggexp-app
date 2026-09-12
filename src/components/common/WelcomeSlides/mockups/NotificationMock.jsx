import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { MOCK, ONB, FONT } from "./assets";

// Task auto-reminders, rebuilt from the real lock-screen reference: two stacked
// push notifications for the same task — showing that reminders keep coming
// until the job is confirmed done. Titles/time localize; the app icon is the
// real one.
function Banner({ title, time, body }) {
  return (
    <View style={styles.banner}>
      <Image source={ONB.appIcon} style={styles.icon} />
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
    marginRight: 12,
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

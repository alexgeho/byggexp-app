import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

import { MockCard } from "./MockCard";
import { MOCK } from "./assets";

// A push-notification preview card, rebuilt from Figma. The app-icon tile is
// drawn (not an image); title and body localize.
export function NotificationMock() {
  const { t } = useTranslation();
  return (
    <MockCard style={styles.card}>
      <View style={styles.row}>
        <LinearGradient
          colors={["#3AA0FF", "#0A84FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.icon}
        >
          <Text style={styles.iconText}>BYGG</Text>
          <Text style={styles.iconText}>EXP</Text>
        </LinearGradient>
        <View style={styles.body}>
          <Text style={styles.title}>
            {t("welcome.notif.title", { defaultValue: "Notification" })}
          </Text>
          <Text style={styles.text} numberOfLines={5}>
            {t("welcome.notif.body", {
              defaultValue:
                "It's time for \"Electrical test zones A-B. Finish by 14:30. Send photos when done. If you are done, confirm that it is completed — other…",
            })}
          </Text>
        </View>
      </View>
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  row: { flexDirection: "row", alignItems: "flex-start" },
  icon: {
    width: 58,
    height: 58,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    marginTop: 2,
  },
  iconText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
    lineHeight: 15,
  },
  body: { flex: 1 },
  title: { fontSize: 17, fontWeight: "600", color: MOCK.navy, marginBottom: 4 },
  text: { fontSize: 14, color: MOCK.labelDark, lineHeight: 20 },
});

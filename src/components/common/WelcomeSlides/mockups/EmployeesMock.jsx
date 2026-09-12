import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { MockCard } from "./MockCard";
import { MOCK, ONB, FONT } from "./assets";

// Two live-status employee cards, rebuilt from Figma. Names and project are
// illustrative mockup data; the status pills ("At work" / "Not at work")
// localize. Avatars and project thumbnails are bundled photos.
function StatusPill({ label, ok }) {
  return (
    <View style={[styles.pill, ok ? styles.pillGreen : styles.pillRed]}>
      <Text
        style={[
          styles.pillText,
          ok ? styles.pillTextGreen : styles.pillTextRed,
        ]}
      >
        {"• "}
        {label}
      </Text>
    </View>
  );
}

function EmployeeCard({ avatar, name, ok, thumbs, extra }) {
  const { t } = useTranslation();
  return (
    <MockCard style={styles.card}>
      <View style={styles.row}>
        <Image source={avatar} style={styles.avatar} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.project} numberOfLines={1}>
            {t("welcome.emp.project", { defaultValue: "House 54 project" })}
          </Text>
        </View>
        <StatusPill
          label={
            ok
              ? t("welcome.emp.atWork", { defaultValue: "At work" })
              : t("welcome.emp.notAtWork", { defaultValue: "Not at work" })
          }
          ok={ok}
        />
      </View>
      <View style={styles.thumbs}>
        {thumbs.map((src, i) => (
          <Image key={i} source={src} style={styles.thumb} />
        ))}
        {extra ? (
          <View style={[styles.thumb, styles.thumbMore]}>
            <Text style={styles.thumbMoreText}>+{extra}</Text>
          </View>
        ) : null}
      </View>
    </MockCard>
  );
}

export function EmployeesMock() {
  return (
    <View style={styles.wrap}>
      <EmployeeCard
        avatar={ONB.avatarMarcus}
        name="Marcus Vance"
        ok
        thumbs={[ONB.thumbB1]}
      />
      <EmployeeCard
        avatar={ONB.avatarAmara}
        name="Amara Okafor"
        ok={false}
        thumbs={[ONB.thumbB2, ONB.thumbB3, ONB.thumbB4]}
        extra={12}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 12 },
  card: { padding: 10 },
  row: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: 16 },
  info: { flex: 1 },
  name: { fontSize: 17, fontFamily: FONT.medium, color: MOCK.navy },
  project: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: MOCK.label,
    marginTop: 4,
  },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pillGreen: { backgroundColor: MOCK.greenBg },
  pillRed: { backgroundColor: MOCK.redBg },
  pillText: { fontSize: 12, fontFamily: FONT.semibold },
  pillTextGreen: { color: MOCK.green },
  pillTextRed: { color: MOCK.red },
  thumbs: { flexDirection: "row", marginTop: 18, gap: 6 },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: MOCK.track,
  },
  thumbMore: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F2937",
  },
  thumbMoreText: { color: "#FFFFFF", fontSize: 12, fontFamily: FONT.semibold },
});

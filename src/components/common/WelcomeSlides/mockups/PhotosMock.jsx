import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { MockCard } from "./MockCard";
import { MOCK, ONB } from "./assets";

// On-site photo report card, rebuilt from Figma: two dated sections, each a
// 3-column photo grid. Dates are illustrative mockup data; the "N photos"
// label localizes. Photos are bundled on-site images.
function Section({ date, photos }) {
  const { t } = useTranslation();
  return (
    <View style={styles.section}>
      <View style={styles.headRow}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.count}>
          {photos.length}{" "}
          {t("welcome.photos.label", { defaultValue: "photos" })}
        </Text>
      </View>
      <View style={styles.grid}>
        {photos.map((src, i) => (
          <Image key={i} source={src} style={styles.photo} />
        ))}
      </View>
    </View>
  );
}

export function PhotosMock() {
  return (
    <MockCard style={styles.card}>
      <Section
        date="1 Aug 2026"
        photos={[ONB.photo1, ONB.photo2, ONB.photo3, ONB.photo4]}
      />
      <Section
        date="20 Jul 2026"
        photos={[ONB.photo5, ONB.photo6, ONB.photo7]}
      />
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16 },
  section: { marginBottom: 6 },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 6,
  },
  date: { fontSize: 14, fontWeight: "600", color: MOCK.navy },
  count: { fontSize: 14, fontWeight: "500", color: MOCK.blue },
  // 3-up grid: space-between spreads a full row of 3 edge-to-edge and leaves a
  // trailing single photo (4th) left-aligned on the next line, as in Figma.
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photo: {
    width: "31.5%",
    aspectRatio: 1,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: MOCK.track,
  },
});

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { MockCard } from "./MockCard";
import { AppIcon } from "../../AppIcon";
import { MOCK, ONB, FONT } from "./assets";

// The real "Kamera" screen (admin slide 4): shift photos grouped by date under
// the "Skiftfoton / Kvitton (utlägg)" tabs — on-site photo reports that sync
// straight into the project. Mockup labels are Swedish (matches the app);
// photos are bundled on-site images.
function Section({ date, count, photos }) {
  return (
    <View style={styles.section}>
      <View style={styles.headRow}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.count}>{count} foton</Text>
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
      <View style={styles.header}>
        <Text style={styles.title}>Kamera</Text>
        <AppIcon name="search" size={18} color={MOCK.navy} />
      </View>

      <View style={styles.tabs}>
        <View style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Skiftfoton</Text>
        </View>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Kvitton (utlägg)</Text>
        </View>
      </View>

      <Section
        date="17 augusti 2026"
        count={2}
        photos={[ONB.photo1, ONB.photo2]}
      />
      <Section
        date="3 augusti 2026"
        count={5}
        photos={[ONB.photo3, ONB.photo4, ONB.photo5]}
      />
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 10,
  },
  title: { fontSize: 15, fontFamily: FONT.semibold, color: MOCK.navy },
  tabs: {
    flexDirection: "row",
    backgroundColor: MOCK.track,
    borderRadius: 11,
    padding: 3,
    marginBottom: 12,
  },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 9, alignItems: "center" },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0A2540",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 12, fontFamily: FONT.medium, color: MOCK.labelDark },
  tabTextActive: { color: MOCK.navy, fontFamily: FONT.semibold },
  section: { marginBottom: 4 },
  headRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  date: { fontSize: 13, fontFamily: FONT.semibold, color: MOCK.navy },
  count: { fontSize: 13, fontFamily: FONT.medium, color: MOCK.label },
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

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { MockCard } from "./MockCard";
import { MOCK, ONB, FONT } from "./assets";

// The real project "Dokument" tab (worker slide 3): all project files — drawings,
// photos, blueprints — in one place. Mockup labels are Swedish (matches the app);
// filenames/sizes/dates are data.
const FILES = [
  {
    thumb: ONB.docBlueprint,
    name: "Screenshot 2026-08-04 at 19.02.54.png",
    size: "672.3 KB",
    date: "4 aug. 2026",
  },
  {
    thumb: ONB.docPhoto,
    name: "maxresdefault.jpg",
    size: "108.6 KB",
    date: "31 juli 2026",
  },
  {
    thumb: ONB.docBlueprint,
    name: "Screenshot 2026-07-31 at 19.24.20.png",
    size: "396.3 KB",
    date: "31 juli 2026",
  },
];

function TabItem({ label, active }) {
  return (
    <View style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && styles.tabTextActive]}>
        {label}
      </Text>
    </View>
  );
}

export function DocumentsMock() {
  return (
    <MockCard style={styles.card}>
      <Text style={styles.header} numberOfLines={1}>
        Byggnation av BRF Peter
      </Text>

      <View style={styles.tabs}>
        <TabItem label="Uppgifter" />
        <TabItem label="Dokument" active />
        <TabItem label="Arbetare" />
      </View>

      <View style={styles.list}>
        {FILES.map((f, i) => (
          <View key={i} style={styles.file}>
            <Image source={f.thumb} style={styles.thumb} />
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>
                {f.name}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>{f.size}</Text>
                <Text style={styles.meta}>{f.date}</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>
        ))}
      </View>
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  header: {
    fontSize: 15,
    ...FONT.semibold,
    color: MOCK.navy,
    textAlign: "center",
    marginBottom: 12,
  },
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
  tabText: { fontSize: 12, ...FONT.medium, color: MOCK.labelDark },
  tabTextActive: { color: MOCK.blue, ...FONT.semibold },
  list: { gap: 10 },
  file: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: MOCK.track,
  },
  info: { flex: 1 },
  name: {
    fontSize: 14,
    ...FONT.medium,
    color: MOCK.navy,
    lineHeight: 18,
  },
  metaRow: { flexDirection: "row", gap: 14, marginTop: 4 },
  meta: { fontSize: 12, ...FONT.medium, color: MOCK.label },
  chevron: { fontSize: 22, color: MOCK.label, marginLeft: 8 },
});

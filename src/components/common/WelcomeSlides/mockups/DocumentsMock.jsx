import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { MockCard } from "./MockCard";
import { MOCK, ONB } from "./assets";

// Project-documents list, rebuilt from Figma: two file rows with a thumbnail,
// name, size · date and a chevron. Filenames/sizes/dates are illustrative
// mockup data (no user-facing copy to localize here).
function FileCard({ thumb, name, meta }) {
  return (
    <MockCard style={styles.card}>
      <View style={styles.row}>
        <Image source={thumb} style={styles.thumb} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <Text style={styles.meta}>{meta}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </MockCard>
  );
}

export function DocumentsMock() {
  return (
    <View style={styles.wrap}>
      <FileCard
        thumb={ONB.docBlueprint}
        name="Screenshot 2026-08-04 at 19.02.54.png"
        meta="672.3 KB · 4 aug. 2026"
      />
      <FileCard
        thumb={ONB.docPhoto}
        name="Maxresdefault.jpg"
        meta="108.6 KB · 1 aug. 2026"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 16 },
  card: { padding: 14 },
  row: { flexDirection: "row", alignItems: "center" },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: MOCK.track,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: "500", color: MOCK.navy, lineHeight: 21 },
  meta: { fontSize: 13, color: MOCK.label, marginTop: 4 },
  chevron: {
    fontSize: 26,
    color: MOCK.label,
    marginLeft: 8,
    fontWeight: "400",
  },
});

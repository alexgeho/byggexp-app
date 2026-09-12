import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { MockCard } from "./MockCard";
import { MOCK, ONB, FONT } from "./assets";

// Project-documents list, rebuilt 1:1 from Figma: two file rows with a 64×64
// thumbnail, name, size + date and a chevron. Filenames/sizes/dates are
// illustrative mockup data (no user-facing copy to localize here).
function FileCard({ thumb, name, size, date }) {
  return (
    <MockCard style={styles.card}>
      <View style={styles.row}>
        <Image source={thumb} style={styles.thumb} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>
            {name}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>{size}</Text>
            <Text style={styles.meta}>{date}</Text>
          </View>
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
        size="672.3 KB"
        date="4 aug. 2026"
      />
      <FileCard
        thumb={ONB.docPhoto}
        name="Maxresdefault.jpg"
        size="108.6 KB"
        date="1 aug. 2026"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", gap: 12 },
  card: { padding: 20 },
  row: { flexDirection: "row", alignItems: "center" },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 18,
    backgroundColor: MOCK.track,
  },
  info: { flex: 1 },
  name: {
    fontSize: 17,
    fontFamily: FONT.medium,
    color: MOCK.navy,
    lineHeight: 21,
  },
  metaRow: { flexDirection: "row", gap: 16, marginTop: 8 },
  meta: { fontSize: 13, fontFamily: FONT.medium, color: MOCK.label },
  chevron: {
    fontSize: 24,
    color: MOCK.label,
    marginLeft: 8,
    fontWeight: "400",
  },
});

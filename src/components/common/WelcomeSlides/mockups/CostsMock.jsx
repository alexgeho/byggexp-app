import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { MockCard } from "./MockCard";
import { MOCK, FONT } from "./assets";

// The real project "Ekonomi" tab (admin slide 5): scanned receipts, worked
// hours and invoices roll up automatically into the project's costs and result
// (margin). Mockup labels are Swedish (matches the app); amounts are data.
function Row({ label, value, strong, color }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, strong && styles.labelStrong]}>{label}</Text>
      <Text
        style={[styles.value, strong && styles.valueStrong, color && { color }]}
      >
        {value}
      </Text>
    </View>
  );
}

export function CostsMock() {
  return (
    <MockCard style={styles.card}>
      <Text style={styles.header} numberOfLines={1}>
        Byggnation av BRF Peter
      </Text>

      <View style={styles.tabs}>
        <View style={styles.tab}>
          <Text style={styles.tabText}>Foton</Text>
        </View>
        <View style={[styles.tab, styles.tabActive]}>
          <Text style={[styles.tabText, styles.tabTextActive]}>Ekonomi</Text>
        </View>
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>KOSTNADER</Text>
        <Row label="Inköpsfakturor" value="5 912,00 kr" />
        <Row label="Utlägg (kvitton)" value="162 077,89 kr" />
        <Row label="Arbete" value="562 343,51 kr" />
        <View style={styles.divider} />
        <Row label="Total kostnad" value="730 333,40 kr" strong />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>RESULTAT</Text>
        <Row label="Fakturerat" value="782 543,00 kr" />
        <Row label="Total kostnad" value="730 333,40 kr" />
        <View style={styles.divider} />
        <Row
          label="Marginal (7%)"
          value="52 209,60 kr"
          strong
          color={MOCK.green}
        />
      </View>
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 12 },
  header: {
    fontSize: 15,
    fontFamily: FONT.semibold,
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
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { fontSize: 12, fontFamily: FONT.medium, color: MOCK.labelDark },
  tabTextActive: { color: MOCK.blue, fontFamily: FONT.semibold },
  block: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 12,
    fontFamily: FONT.semibold,
    color: MOCK.navy,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  label: { fontSize: 13, fontFamily: FONT.medium, color: MOCK.label },
  labelStrong: { color: MOCK.navy, fontFamily: FONT.semibold },
  value: { fontSize: 13, fontFamily: FONT.medium, color: MOCK.navy },
  valueStrong: { fontFamily: FONT.semibold },
  divider: {
    height: 1,
    backgroundColor: MOCK.line,
    marginTop: 2,
    marginBottom: 11,
  },
});

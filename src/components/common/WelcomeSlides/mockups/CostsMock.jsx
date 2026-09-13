import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <MockCard style={styles.card}>
      <Text style={styles.header} numberOfLines={1}>
        Byggnation av BRF Peter
      </Text>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {t("welcome.mock.secWork", { defaultValue: "Arbete" })}
        </Text>
        <Row
          label={t("welcome.mock.workedHours", {
            defaultValue: "Arbetade timmar",
          })}
          value="1823.88 h"
        />
        <Row
          label={t("welcome.mock.cost", { defaultValue: "Kostnad" })}
          value="565 402,63 kr"
          color={MOCK.red}
        />
        <Row
          label={t("welcome.mock.billed", { defaultValue: "Debiterat" })}
          value="911 939,72 kr"
          color={MOCK.green}
        />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>
          {t("welcome.mock.secCosts", { defaultValue: "Kostnader" })}
        </Text>
        <Row
          label={t("welcome.mock.purchaseInvoices", {
            defaultValue: "Inköpsfakturor",
          })}
          value="162 077,89 kr"
        />
        <Row
          label={t("welcome.mock.expensesReceipts", {
            defaultValue: "Utlägg (kvitton)",
          })}
          value="14 118,00 kr"
        />
        <Row
          label={t("welcome.mock.work", { defaultValue: "Arbete" })}
          value="565 402,63 kr"
        />
        <View style={styles.divider} />
        <Row
          label={t("welcome.mock.totalCost", { defaultValue: "Total kostnad" })}
          value="741 598,52 kr"
          strong
        />
      </View>

      <View style={[styles.block, styles.blockLast]}>
        <Text style={styles.blockTitle}>
          {t("welcome.mock.secResult", { defaultValue: "Resultat" })}
        </Text>
        <Row
          label={t("welcome.mock.invoiced", { defaultValue: "Fakturerat" })}
          value="882 543,00 kr"
        />
        <Row
          label={t("welcome.mock.totalCost", { defaultValue: "Total kostnad" })}
          value="741 598,52 kr"
        />
        <View style={styles.divider} />
        <Row
          label={`${t("welcome.mock.margin", { defaultValue: "Marginal" })} (16%)`}
          value="140 944,48 kr"
          strong
          color={MOCK.green}
        />
      </View>
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { width: 301, maxWidth: "100%", alignSelf: "center", padding: 18 },
  header: {
    fontSize: 15,
    ...FONT.semibold,
    color: MOCK.navy,
    textAlign: "center",
    marginBottom: 10,
  },
  block: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
  },
  blockLast: { marginBottom: 0 },
  blockTitle: {
    fontSize: 12,
    ...FONT.semibold,
    color: MOCK.navy,
    marginBottom: 8,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  label: { fontSize: 13, ...FONT.medium, color: MOCK.label },
  labelStrong: { color: MOCK.navy, ...FONT.semibold },
  value: { fontSize: 13, ...FONT.medium, color: MOCK.navy },
  valueStrong: { ...FONT.semibold },
  divider: {
    height: 1,
    backgroundColor: MOCK.line,
    marginTop: 2,
    marginBottom: 11,
  },
});

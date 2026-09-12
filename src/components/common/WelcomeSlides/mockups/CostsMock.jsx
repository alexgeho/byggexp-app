import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { MockCard } from "./MockCard";
import { MOCK, FONT } from "./assets";

// Project-finances summary card, rebuilt from Figma. Row labels and the "COSTS"
// / "Total cost" captions localize; the amounts are illustrative mockup data.
function Row({ label, value, strong }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, strong && styles.labelStrong]}>{label}</Text>
      <Text style={[styles.value, strong && styles.valueStrong]}>{value}</Text>
    </View>
  );
}

export function CostsMock() {
  const { t } = useTranslation();
  return (
    <MockCard style={styles.card}>
      <Text style={styles.heading}>
        {t("welcome.costs.title", { defaultValue: "COSTS" })}
      </Text>
      <Row
        label={t("welcome.costs.purchaseInvoices", {
          defaultValue: "Purchase invoices",
        })}
        value="5 912,00 kr"
      />
      <Row
        label={t("welcome.costs.receipts", { defaultValue: "Receipts" })}
        value="162 077,89 kr"
      />
      <Row
        label={t("welcome.costs.labor", { defaultValue: "Labor" })}
        value="562 343,51 kr"
      />
      <View style={styles.divider} />
      <Row
        label={t("welcome.costs.total", { defaultValue: "Total cost" })}
        value="730 333,40 kr"
        strong
      />
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 20 },
  heading: {
    fontSize: 17,
    fontFamily: FONT.medium,
    color: MOCK.navy,
    marginBottom: 24,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  label: { fontSize: 15, fontFamily: FONT.medium, color: MOCK.label },
  labelStrong: { color: MOCK.navy },
  value: { fontSize: 15, fontFamily: FONT.medium, color: MOCK.navy },
  valueStrong: {},
  divider: {
    height: 1,
    backgroundColor: MOCK.navy,
    marginBottom: 18,
    marginTop: 0,
  },
});

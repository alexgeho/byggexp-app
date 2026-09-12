import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { MockCard } from "./MockCard";
import { MOCK } from "./assets";

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
  card: { padding: 22 },
  heading: {
    fontSize: 16,
    fontWeight: "600",
    color: MOCK.navy,
    marginBottom: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  label: { fontSize: 16, color: MOCK.labelDark },
  labelStrong: { color: MOCK.navy, fontWeight: "600" },
  value: { fontSize: 16, color: MOCK.navy, fontWeight: "500" },
  valueStrong: { fontWeight: "700" },
  divider: {
    height: 1,
    backgroundColor: MOCK.navy,
    opacity: 0.85,
    marginBottom: 14,
    marginTop: 2,
  },
});

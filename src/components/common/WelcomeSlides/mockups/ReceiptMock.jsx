import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { MockCard } from "./MockCard";
import { MOCK, ONB, FONT } from "./assets";

// The real "Nytt utlägg" (new expense) receipt-scan sheet (worker slide 4): snap
// a receipt and the supplier, total and VAT are read out automatically. Mockup
// labels are Swedish (matches the app); values are data.
function Field({ label, value, style }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.input}>
        <Text style={styles.inputText} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

export function ReceiptMock() {
  return (
    <MockCard style={styles.card}>
      <Text style={styles.title}>Nytt utlägg</Text>
      <Image source={ONB.receipt} style={styles.receipt} resizeMode="cover" />

      <Field label="Leverantör" value="HHAO sun AB" />
      <View style={styles.row}>
        <Field label="Totalt (SEK)" value="150.1" style={styles.half} />
        <Field label="Moms (SEK)" value="23.62" style={styles.half} />
      </View>

      <View style={styles.button}>
        <Text style={styles.buttonText}>Spara utlägg</Text>
      </View>
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14 },
  title: {
    fontSize: 17,
    fontFamily: FONT.bold,
    color: MOCK.navy,
    marginBottom: 12,
  },
  receipt: {
    width: "100%",
    height: 120,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: MOCK.track,
  },
  field: { marginBottom: 12 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: MOCK.label,
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: MOCK.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputText: { fontSize: 14, fontFamily: FONT.medium, color: MOCK.navy },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  button: {
    marginTop: 2,
    backgroundColor: MOCK.brand,
    borderRadius: 100,
    paddingVertical: 13,
    alignItems: "center",
  },
  buttonText: { fontSize: 15, fontFamily: FONT.semibold, color: "#FFFFFF" },
});

import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

import { MockCard } from "./MockCard";
import { MOCK, ONB, FONT } from "./assets";

// The real "Nytt utlägg" (new expense) receipt-scan sheet (worker slide 4): snap
// a receipt and supplier, total, VAT, category and project fill in
// automatically. Mockup labels are Swedish (matches the app); values are data.
function Field({ label, value, style, filled }) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.input, filled && styles.inputFilled]}>
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
      <Field label="Kategori" value="Verktyg" />
      <Field label="Projekt" value="Byggnation av BRF Peter" filled />

      <View style={styles.buttons}>
        <View style={[styles.button, styles.cancel]}>
          <Text style={styles.cancelText}>Avbryt</Text>
        </View>
        <View style={[styles.button, styles.save]}>
          <Text style={styles.saveText}>Spara utlägg</Text>
        </View>
      </View>
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { width: 301, maxWidth: "100%", alignSelf: "center", padding: 10 },
  title: {
    fontSize: 15,
    textAlign: "center",
    ...FONT.semibold,
    color: MOCK.navy,
    marginBottom: 12,
  },
  receipt: {
    width: "100%",
    height: 84,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: MOCK.track,
  },
  field: { marginBottom: 8 },
  fieldLabel: {
    fontSize: 12,
    ...FONT.medium,
    color: MOCK.label,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: MOCK.line,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  inputFilled: { backgroundColor: "#EEF0F3", borderColor: "transparent" },
  inputText: { fontSize: 14, ...FONT.medium, color: MOCK.navy },
  row: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
  buttons: { flexDirection: "row", gap: 10, marginTop: 4 },
  button: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  cancel: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: MOCK.line,
  },
  cancelText: { fontSize: 14, ...FONT.semibold, color: MOCK.navy },
  save: { flex: 1.6, backgroundColor: MOCK.brand },
  saveText: { fontSize: 14, ...FONT.semibold, color: "#FFFFFF" },
});

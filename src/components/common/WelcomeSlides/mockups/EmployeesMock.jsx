import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { MockCard } from "./MockCard";
import { AppIcon } from "../../AppIcon";
import { MOCK, FONT } from "./assets";

// The real "Anställda" (employees) screen, rebuilt in RN for admin slide 2:
// project filter + a list of staff cards showing who is at work / away, their
// role and the site. Names/roles/sites are illustrative mockup data; the header
// and the at-work / not-at-work status pills localize.
const STAFF = [
  {
    name: "Erik Olsson",
    at: false,
    role: "Ingen yrkesroll",
    site: "Byggnation av BRF Peter, Centralvägen 38…",
  },
  {
    name: "Hadjie Angela Gepanaga",
    at: true,
    role: "Projektledare",
    site: "Byggnation av BRF Peter, Nybyggnation Vill…",
  },
  {
    name: "Denis Hok",
    at: true,
    role: "Snickare",
    site: "Byggnation av BRF Peter, Byggmästarvägen…",
  },
];

function StatusPill({ at }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.pill, at ? styles.pillGreen : styles.pillRed]}>
      <Text
        style={[
          styles.pillText,
          at ? styles.pillTextGreen : styles.pillTextRed,
        ]}
      >
        {at
          ? t("welcome.emp.atWork", { defaultValue: "At work" })
          : t("welcome.emp.notAtWork", { defaultValue: "Not at work" })}
      </Text>
    </View>
  );
}

function StaffCard({ p }) {
  return (
    <View style={styles.staff}>
      <View style={styles.staffTop}>
        <Text style={styles.name} numberOfLines={1}>
          {p.name}
        </Text>
        <StatusPill at={p.at} />
      </View>
      <Text style={styles.role} numberOfLines={1}>
        {p.role}
      </Text>
      <Text style={styles.site} numberOfLines={1}>
        {p.site}
      </Text>
    </View>
  );
}

export function EmployeesMock() {
  return (
    <MockCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Anställda</Text>
        <AppIcon name="user-plus" size={20} color={MOCK.brand} />
      </View>

      <View style={styles.dropdown}>
        <Text style={styles.dropdownText} numberOfLines={1}>
          Byggnation av BRF Peter
        </Text>
        <Text style={styles.dropdownChev}>⌄</Text>
      </View>

      <View style={styles.list}>
        {STAFF.map((p) => (
          <StaffCard key={p.name} p={p} />
        ))}
      </View>
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
    marginBottom: 12,
  },
  headerTitle: { fontSize: 15, fontFamily: FONT.semibold, color: MOCK.navy },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#E7E9ED",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 12,
  },
  dropdownText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: MOCK.navy,
  },
  dropdownChev: { fontSize: 13, color: "#8A94A6", marginLeft: 6 },
  list: { gap: 10 },
  staff: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 13,
    shadowColor: "#0A2540",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 1,
  },
  staffTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontFamily: FONT.semibold,
    color: MOCK.navy,
    marginRight: 8,
  },
  role: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: MOCK.blue,
    marginTop: 5,
  },
  site: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: MOCK.label,
    marginTop: 3,
  },
  pill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  pillGreen: { backgroundColor: MOCK.greenBg },
  pillRed: { backgroundColor: MOCK.redBg },
  pillText: { fontSize: 11, fontFamily: FONT.semibold },
  pillTextGreen: { color: MOCK.green },
  pillTextRed: { color: MOCK.red },
});

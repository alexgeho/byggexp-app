import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { MockCard } from "./MockCard";
import { MOCK, FONT } from "./assets";

// May-2026 timesheet calendar, rebuilt from the Figma onboarding frame. The day
// grid is fixed mockup data (it illustrates logged hours); the tab labels,
// month and weekday initials come from i18n so the mockup localizes.
const HL = (d, h) => ({ d, h, hl: true }); // highlighted (this week)
const cell = (d, h) => ({ d, h });

// weeks × 7 days (Mon–Sun). null = empty leading cell.
const WEEKS = [
  {
    wk: 23,
    days: [null, null, null, null, cell(1, "10h"), cell(2, "8h"), cell(3)],
  },
  {
    wk: 24,
    days: [
      cell(4, "8h"),
      cell(5),
      cell(6),
      cell(7, "12h"),
      cell(8, "10h"),
      cell(9),
      cell(10),
    ],
  },
  {
    wk: 25,
    days: [
      cell(11),
      cell(12, "8h"),
      cell(13, "8h"),
      { d: 14, today: true },
      cell(15),
      cell(16),
      cell(17),
    ],
  },
  {
    wk: 26,
    days: [
      HL(18, "10h"),
      HL(19, "10h"),
      HL(20, "10h"),
      HL(21, "8h"),
      HL(22, "8h"),
      HL(23, "10h"),
      HL(24),
    ],
  },
  {
    wk: 27,
    days: [
      cell(25),
      cell(26, "12h"),
      cell(27, "8h"),
      cell(28, "8h"),
      cell(29, "8h"),
      cell(30),
      cell(31),
    ],
  },
];

function Tab({ label, active }) {
  return (
    <View style={[styles.tab, active && styles.tabActive]}>
      <Text
        style={[styles.tabText, active && styles.tabTextActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

function DayCell({ c }) {
  if (!c || c.d == null) {
    return <View style={styles.day} />;
  }
  const { d, h, hl, today } = c;
  return (
    <View style={styles.day}>
      <View style={[styles.dayInner, hl && styles.dayInnerHL]}>
        <Text
          style={[
            styles.dayNum,
            hl && styles.dayNumHL,
            today && styles.dayNumToday,
          ]}
        >
          {d}
        </Text>
        {h ? (
          <View style={[styles.hourPill, hl && styles.hourPillHL]}>
            <Text style={[styles.hourText, hl && styles.hourTextHL]}>{h}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function CalendarMock() {
  const { t } = useTranslation();
  const weekdays = t("welcome.cal.weekdays", {
    defaultValue: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
  }).split(",");

  return (
    <MockCard style={styles.card}>
      <View style={styles.tabs}>
        <Tab
          label={t("welcome.cal.planned", { defaultValue: "Planned" })}
          active
        />
        <Tab label={t("welcome.cal.gps", { defaultValue: "GPS" })} />
        <Tab label={t("welcome.cal.manual", { defaultValue: "Manual" })} />
      </View>

      <View style={styles.monthRow}>
        <Text style={styles.chevron}>‹</Text>
        <Text style={styles.month}>
          {t("welcome.cal.month", { defaultValue: "May 2026" })}
        </Text>
        <Text style={styles.chevron}>›</Text>
      </View>

      <View style={styles.headRow}>
        <View style={styles.wkCol} />
        {weekdays.map((w, i) => (
          <View key={i} style={styles.day}>
            <Text style={styles.weekday}>{w}</Text>
          </View>
        ))}
      </View>

      {WEEKS.map((row) => (
        <View key={row.wk} style={styles.weekRow}>
          <View style={styles.wkCol}>
            <Text style={styles.wkNum}>{row.wk}</Text>
          </View>
          {row.days.map((c, i) => (
            <DayCell key={i} c={c} />
          ))}
        </View>
      ))}
    </MockCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14 },
  tabs: {
    flexDirection: "row",
    backgroundColor: MOCK.track,
    borderRadius: 12,
    padding: 3,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0A2540",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 13, fontFamily: FONT.medium, color: MOCK.labelDark },
  tabTextActive: { color: MOCK.blue, fontFamily: FONT.semibold },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  chevron: {
    fontSize: 20,
    color: MOCK.blue,
    fontWeight: "600",
    width: 20,
    textAlign: "center",
  },
  month: { fontSize: 15, fontFamily: FONT.semibold, color: MOCK.navy },

  headRow: { flexDirection: "row", marginBottom: 2 },
  wkCol: { width: 20, alignItems: "flex-start", justifyContent: "center" },
  wkNum: { fontSize: 11, fontFamily: FONT.regular, color: "#8A94A6" },
  weekday: { fontSize: 11, fontFamily: FONT.regular, color: "#8A94A6" },

  weekRow: { flexDirection: "row", alignItems: "stretch" },
  day: { flex: 1, alignItems: "center", paddingVertical: 2 },
  dayInner: {
    width: "94%",
    aspectRatio: 0.82,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  dayInnerHL: { backgroundColor: MOCK.blueSoft },
  dayNum: { fontSize: 13, color: MOCK.labelDark, fontFamily: FONT.medium },
  dayNumHL: { color: "#FFFFFF", fontFamily: FONT.semibold },
  dayNumToday: { color: MOCK.navy, fontFamily: FONT.bold },
  hourPill: {
    marginTop: 3,
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  hourPillHL: { backgroundColor: "rgba(255,255,255,0.9)" },
  hourText: { fontSize: 9, color: "#8A94A6", fontFamily: FONT.medium },
  hourTextHL: { color: MOCK.blueSoft, fontFamily: FONT.semibold },
});

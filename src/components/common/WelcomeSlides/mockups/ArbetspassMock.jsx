import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { MockCard } from "./MockCard";
import { MOCK, FONT } from "./assets";

// The real "Arbetspass" (work-shifts) GPS calendar, rebuilt in RN for the admin
// slide-1 illustration. July 2026 with two logged states: blue weeks (checked-in
// via GPS) and green weeks, each day carrying its hours. Fixed mockup data; tab
// labels, month and weekday initials localize.
const B = (d, h) => ({ d, h, s: "blue" }); // blue day with hours
const Bx = (d) => ({ d, s: "blue" }); // blue day, no hours (weekend)
const G = (d, h) => ({ d, h, s: "green" }); // green day with hours
const P = (d) => ({ d, s: "plain" }); // plain day, no fill

// weeks × 7 (Mon–Sun). null = empty leading cell. July 1 2026 is a Wednesday.
const WEEKS = [
  { wk: 27, days: [null, null, P(1), P(2), P(3), P(4), P(5)] },
  {
    wk: 28,
    days: [
      B(6, "52h"),
      B(7, "52h"),
      B(8, "53h"),
      B(9, "52h"),
      B(10, "53h"),
      Bx(11),
      Bx(12),
    ],
  },
  {
    wk: 29,
    days: [
      B(13, "53h"),
      B(14, "52h"),
      B(15, "52h"),
      B(16, "52h"),
      B(17, "52h"),
      Bx(18),
      Bx(19),
    ],
  },
  {
    wk: 30,
    days: [
      G(20, "52h"),
      G(21, "53h"),
      G(22, "52h"),
      G(23, "52h"),
      G(24, "52h"),
      P(25),
      P(26),
    ],
  },
  {
    wk: 31,
    days: [
      G(27, "53h"),
      G(28, "52h"),
      G(29, "52h"),
      G(30, "52h"),
      G(31, "54h"),
      null,
      null,
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
  const { d, h, s } = c;
  const blue = s === "blue";
  const green = s === "green";
  return (
    <View style={styles.day}>
      <View
        style={[
          styles.dayInner,
          blue && styles.dayInnerBlue,
          green && styles.dayInnerGreen,
          s === "plain" && styles.dayInnerPlain,
        ]}
      >
        <Text
          style={[
            styles.dayNum,
            blue && styles.dayNumBlue,
            s === "plain" && styles.dayNumPlain,
          ]}
        >
          {d}
        </Text>
        {h ? (
          <View style={[styles.hourPill, blue && styles.hourPillBlue]}>
            <Text
              style={[
                styles.hourText,
                blue && styles.hourTextBlue,
                green && styles.hourTextGreen,
              ]}
            >
              {h}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

export function ArbetspassMock() {
  const { t } = useTranslation();
  const weekdays = t("welcome.cal.weekdays", {
    defaultValue: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
  }).split(",");

  return (
    <MockCard style={styles.card}>
      <View style={styles.tabs}>
        <Tab label={t("welcome.cal.planned", { defaultValue: "Planned" })} />
        <Tab label={t("welcome.cal.gps", { defaultValue: "GPS" })} active />
        <Tab label={t("welcome.cal.manual", { defaultValue: "Manual" })} />
      </View>

      <View style={styles.monthRow}>
        <Text style={styles.chevron}>‹</Text>
        <Text style={styles.month}>
          {t("welcome.cal.monthJuly", { defaultValue: "July 2026" })}
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

const BLUE = "#4A9EFF";
const GREEN_BG = "#E5F3EA";
const GREEN_TX = "#3BA45C";

const styles = StyleSheet.create({
  card: { width: 301, maxWidth: "100%", alignSelf: "center", padding: 10 },
  tabs: {
    flexDirection: "row",
    backgroundColor: MOCK.track,
    borderRadius: 11,
    padding: 3,
    marginBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 9, alignItems: "center" },
  tabActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#0A2540",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: { fontSize: 12, fontFamily: FONT.medium, color: MOCK.labelDark },
  tabTextActive: { color: GREEN_TX, fontFamily: FONT.semibold },

  monthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  chevron: {
    fontSize: 18,
    color: MOCK.blue,
    fontWeight: "600",
    width: 18,
    textAlign: "center",
  },
  month: { fontSize: 14, fontFamily: FONT.semibold, color: MOCK.navy },

  headRow: { flexDirection: "row", marginBottom: 2 },
  wkCol: { width: 16, alignItems: "flex-start", justifyContent: "center" },
  wkNum: { fontSize: 10, fontFamily: FONT.regular, color: "#8A94A6" },
  weekday: { fontSize: 10, fontFamily: FONT.regular, color: "#8A94A6" },

  weekRow: { flexDirection: "row", alignItems: "stretch" },
  day: { flex: 1, alignItems: "center", paddingVertical: 1 },
  dayInner: {
    width: "94%",
    height: 37,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  dayInnerBlue: { backgroundColor: BLUE },
  dayInnerGreen: { backgroundColor: GREEN_BG },
  dayInnerPlain: { backgroundColor: "#F7F8FA" },
  dayNum: { fontSize: 12, color: MOCK.labelDark, fontFamily: FONT.medium },
  dayNumBlue: { color: "#FFFFFF", fontFamily: FONT.semibold },
  dayNumPlain: { color: "#AEB6C1" },
  hourPill: {
    marginTop: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  hourPillBlue: { backgroundColor: "rgba(255,255,255,0.28)" },
  hourText: { fontSize: 8, fontFamily: FONT.medium, color: "#8A94A6" },
  hourTextBlue: { color: "#FFFFFF", fontFamily: FONT.semibold },
  hourTextGreen: { color: GREEN_TX, fontFamily: FONT.semibold },
});

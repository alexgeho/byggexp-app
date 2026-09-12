import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";

import { MockCard } from "./MockCard";
import { MOCK, FONT } from "./assets";

// The real "Arbetspass — Manuell" screen (worker slide 1): July hours logged by
// hand, with confirmed days (blue, ✓), planned days (beige) and empty days (+).
// Fixed mockup data; tab/month/weekday labels localize.
const B = (d, h) => ({ d, h, s: "blue" }); // confirmed day (blue, check + hours)
const Bx = (d) => ({ d, s: "blue" }); // confirmed weekend (blue, no hours)
const G = (d, h) => ({ d, h, s: "beige" }); // planned day (beige, orange hours)
const P = (d) => ({ d, s: "plain" }); // empty day (+)

const WEEKS = [
  { wk: 27, days: [null, null, P(1), P(2), P(3), P(4), P(5)] },
  {
    wk: 28,
    days: [
      B(6, "8h"),
      B(7, "8h"),
      B(8, "8h"),
      B(9, "6h"),
      B(10, "8h"),
      Bx(11),
      Bx(12),
    ],
  },
  {
    wk: 29,
    days: [
      B(13, "8h"),
      B(14, "8h"),
      B(15, "8h"),
      B(16, "10h"),
      B(17, "8h"),
      Bx(18),
      Bx(19),
    ],
  },
  {
    wk: 30,
    days: [
      G(20, "8h"),
      G(21, "8h"),
      G(22, "8h"),
      G(23, "8h"),
      G(24, "8h"),
      P(25),
      P(26),
    ],
  },
  {
    wk: 31,
    days: [
      G(27, "8h"),
      G(28, "8h"),
      G(29, "8h"),
      G(30, "8h"),
      G(31, "8h"),
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
  const beige = s === "beige";
  return (
    <View style={styles.day}>
      <View
        style={[
          styles.dayInner,
          blue && styles.dayInnerBlue,
          beige && styles.dayInnerBeige,
          s === "plain" && styles.dayInnerPlain,
        ]}
      >
        <View style={styles.numRow}>
          <Text
            style={[
              styles.dayNum,
              blue && styles.dayNumBlue,
              s === "plain" && styles.dayNumPlain,
            ]}
          >
            {d}
          </Text>
          {blue ? <Text style={styles.check}>✓</Text> : null}
        </View>
        {h ? (
          <View style={[styles.hourPill, blue && styles.hourPillBlue]}>
            <Text
              style={[
                styles.hourText,
                blue && styles.hourTextBlue,
                beige && styles.hourTextBeige,
              ]}
            >
              {h}
            </Text>
          </View>
        ) : (
          <Text style={styles.plus}>+</Text>
        )}
      </View>
    </View>
  );
}

export function WorkerTimeMock() {
  const { t } = useTranslation();
  const weekdays = t("welcome.cal.weekdays", {
    defaultValue: "Mon,Tue,Wed,Thu,Fri,Sat,Sun",
  }).split(",");

  return (
    <MockCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Arbetspass</Text>
        <View style={styles.klar}>
          <Text style={styles.klarText}>Klar</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <Tab label={t("welcome.cal.planned", { defaultValue: "Planned" })} />
        <Tab
          label={t("welcome.cal.manual", { defaultValue: "Manual" })}
          active
        />
        <Tab label={t("welcome.cal.gps", { defaultValue: "GPS" })} />
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>80h</Text>
          <Text style={styles.summaryLabel}>Vald</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryValue}>14 dagar</Text>
          <Text style={styles.summaryLabel}>Vald</Text>
        </View>
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
const BEIGE_BG = "#F5EFDC";
const ORANGE = "#E1922E";

const styles = StyleSheet.create({
  card: { width: 301, maxWidth: "100%", alignSelf: "center", padding: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
    marginBottom: 8,
  },
  headerTitle: { fontSize: 15, fontFamily: FONT.semibold, color: MOCK.navy },
  klar: {
    backgroundColor: "#E3F0FF",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  klarText: { fontSize: 12, fontFamily: FONT.semibold, color: MOCK.brand },
  tabs: {
    flexDirection: "row",
    backgroundColor: MOCK.track,
    borderRadius: 11,
    padding: 3,
    marginBottom: 8,
  },
  tab: { flex: 1, paddingVertical: 6, borderRadius: 9, alignItems: "center" },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { fontSize: 12, fontFamily: FONT.medium, color: MOCK.labelDark },
  tabTextActive: { color: ORANGE, fontFamily: FONT.semibold },

  summary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  summaryCol: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 14, fontFamily: FONT.semibold, color: MOCK.navy },
  summaryLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: "#8A94A6",
    marginTop: 1,
  },
  summaryDivider: { width: 1, height: 24, backgroundColor: "#E4E8EF" },

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
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
  },
  dayInnerBlue: { backgroundColor: BLUE },
  dayInnerBeige: { backgroundColor: BEIGE_BG },
  dayInnerPlain: { backgroundColor: "#F7F8FA" },
  numRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: { fontSize: 12, color: MOCK.labelDark, fontFamily: FONT.medium },
  dayNumBlue: { color: "#FFFFFF", fontFamily: FONT.semibold },
  dayNumPlain: { color: "#AEB6C1" },
  check: { fontSize: 8, color: "#FFFFFF", marginLeft: 2 },
  hourPill: {
    marginTop: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    paddingHorizontal: 4,
  },
  hourPillBlue: { backgroundColor: "rgba(255,255,255,0.28)" },
  hourText: { fontSize: 8, fontFamily: FONT.medium, color: "#8A94A6" },
  hourTextBlue: { color: "#FFFFFF", fontFamily: FONT.semibold },
  hourTextBeige: { color: ORANGE, fontFamily: FONT.semibold },
  plus: {
    fontSize: 11,
    color: ORANGE,
    fontFamily: FONT.semibold,
    marginTop: 0,
  },
});

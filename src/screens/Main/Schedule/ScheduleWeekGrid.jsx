import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import {
  addDays,
  formatWeekdayLabel,
  getWeekNumber,
  startOfWeek,
} from "../../../utils/schedule";
import {
  GRID_FIRST_HOUR,
  GRID_LAST_HOUR,
  formatMinutes,
  slotAt,
  toDayKey,
} from "../../../utils/scheduleBooking";
import { onDark } from "../../../theme/colorUtils";

// The web admin's Google-Calendar view on a phone: hours down the left, one
// column per day, every booking a block from its start time for its hours.
const HOUR_HEIGHT = 48;
const GUTTER_WIDTH = 48;
const HOURS = Array.from(
  { length: GRID_LAST_HOUR - GRID_FIRST_HOUR },
  (_, index) => GRID_FIRST_HOUR + index,
);
const FIRST_MINUTE = GRID_FIRST_HOUR * 60;
const LAST_MINUTE = GRID_LAST_HOUR * 60;
const topOf = (minute) => ((minute - FIRST_MINUTE) / 60) * HOUR_HEIGHT;

export default function ScheduleWeekGrid({
  days,
  blocksByDay,
  leavesByDay,
  nameOf,
  projectNameOf,
  colorOf,
  canBook,
  onSlotPress,
  onBlockPress,
  content,
  t,
}) {
  const styles = useMemo(() => createStyles(content), [content]);
  const today = toDayKey(new Date());
  const now = new Date();
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const hasLeaves = days.some(
    (day) => (leavesByDay[toDayKey(day)] || []).length > 0,
  );

  return (
    <View style={styles.flex}>
      <View style={styles.headRow}>
        <View style={styles.corner}>
          <Text style={styles.cornerText}>
            {t("schedule.week", { number: getWeekNumber(days[0]) })}
          </Text>
        </View>
        {days.map((day) => {
          const isToday = toDayKey(day) === today;
          return (
            <View key={day.getTime()} style={styles.dayHead}>
              <Text numberOfLines={1} style={styles.weekday}>
                {formatWeekdayLabel(day)}
              </Text>
              <View style={[styles.dateBox, isToday && styles.dateBoxToday]}>
                <Text style={[styles.date, isToday && styles.dateToday]}>
                  {day.getDate()}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {hasLeaves ? (
        <View style={styles.leaveRow}>
          <View style={styles.leaveCorner} />
          {days.map((day) => (
            <View key={day.getTime()} style={styles.leaveCell}>
              {(leavesByDay[toDayKey(day)] || []).map((leave) => (
                <View
                  key={`${leave.userId}-${leave.type}`}
                  style={styles.leavePill}
                >
                  <Text numberOfLines={1} style={styles.leaveText}>
                    {nameOf(leave.userId)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContent}
      >
        <View style={styles.body}>
          <View style={styles.gutter}>
            {HOURS.map((hour) => (
              <View key={hour} style={styles.hourCell}>
                <Text style={styles.hourText}>{formatMinutes(hour * 60)}</Text>
              </View>
            ))}
          </View>

          {days.map((day) => {
            const dayKey = toDayKey(day);
            const weekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <Pressable
                key={day.getTime()}
                testID={`grid-day-${dayKey}`}
                style={[styles.column, weekend && styles.columnWeekend]}
                disabled={!canBook}
                onPress={(event) =>
                  onSlotPress(
                    dayKey,
                    slotAt(event.nativeEvent.locationY, HOUR_HEIGHT),
                  )
                }
              >
                {HOURS.map((hour) => (
                  <View key={hour} pointerEvents="none" style={styles.slot} />
                ))}

                {(blocksByDay[dayKey] || []).map((block) => {
                  const start = Math.max(block.start, FIRST_MINUTE);
                  const end = Math.min(block.end, LAST_MINUTE);
                  if (end <= start) return null;
                  // Like the web: overlapping bookings cascade to the right,
                  // a free strip on the right stays for a new tap.
                  const step =
                    block.lanes > 1 ? Math.min(16, 30 / (block.lanes - 1)) : 0;
                  const left = block.lane * step;
                  const height = Math.max(topOf(end) - topOf(start) - 2, 20);
                  return (
                    <Pressable
                      key={block.id}
                      testID={`grid-block-${block.id}`}
                      onPress={() => onBlockPress(block)}
                      style={[
                        styles.block,
                        {
                          top: topOf(start),
                          height,
                          left: `${left + 2}%`,
                          width: `${85 - left}%`,
                          zIndex: 1 + block.lane,
                          backgroundColor: colorOf(block.userId),
                        },
                        block.overbooked && styles.blockOver,
                      ]}
                    >
                      <Text numberOfLines={1} style={styles.blockName}>
                        {nameOf(block.userId)}
                      </Text>
                      {height >= 34 ? (
                        <Text numberOfLines={2} style={styles.blockSub}>
                          {block.projectId
                            ? projectNameOf(block.projectId)
                            : t("billing.noProject")}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}

                {dayKey === today &&
                nowMinute >= FIRST_MINUTE &&
                nowMinute <= LAST_MINUTE ? (
                  <View
                    pointerEvents="none"
                    style={[styles.nowLine, { top: topOf(nowMinute) }]}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// The week (Mon–Sun) the anchor day falls in.
export const gridDaysFor = (anchor) => {
  const first = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, index) => addDays(first, index));
};

const createStyles = (c) => {
  const line = onDark(c, c.divider, "#F0F2F4");
  return StyleSheet.create({
    flex: { flex: 1 },
    headRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: line,
    },
    corner: {
      width: GUTTER_WIDTH,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    cornerText: {
      color: c.textMuted,
      fontSize: 10,
      textAlign: "center",
    },
    dayHead: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 8,
      gap: 2,
    },
    weekday: {
      color: c.textMuted,
      fontSize: 11,
    },
    dateBox: {
      minWidth: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 4,
    },
    dateBoxToday: {
      backgroundColor: "#1877F2",
    },
    date: {
      color: c.textPrimary,
      fontSize: 15,
      fontFamily: "DMSans-SemiBold",
    },
    dateToday: {
      color: "#FFFFFF",
    },
    leaveRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: line,
    },
    leaveCorner: {
      width: GUTTER_WIDTH,
    },
    leaveCell: {
      flex: 1,
      padding: 2,
      gap: 2,
    },
    leavePill: {
      backgroundColor: "#E7E3D5",
      borderRadius: 6,
      paddingHorizontal: 4,
      paddingVertical: 2,
    },
    leaveText: {
      color: "#5B5642",
      fontSize: 10,
    },
    bodyContent: {
      // Clear of the floating bottom bar.
      paddingBottom: 120,
    },
    body: {
      flexDirection: "row",
      height: HOURS.length * HOUR_HEIGHT,
    },
    gutter: {
      width: GUTTER_WIDTH,
    },
    hourCell: {
      height: HOUR_HEIGHT,
      alignItems: "center",
    },
    hourText: {
      color: c.textMuted,
      fontSize: 11,
      marginTop: 2,
    },
    column: {
      flex: 1,
      borderLeftWidth: 1,
      borderLeftColor: line,
    },
    columnWeekend: {
      backgroundColor: onDark(c, "rgba(255, 255, 255, 0.03)", "#F7F8FA"),
    },
    slot: {
      height: HOUR_HEIGHT,
      borderTopWidth: 1,
      borderTopColor: line,
    },
    block: {
      position: "absolute",
      borderRadius: 6,
      paddingHorizontal: 4,
      paddingVertical: 2,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: c.surface,
    },
    blockOver: {
      borderWidth: 2,
      borderColor: "#E5484D",
    },
    blockName: {
      color: "#FFFFFF",
      fontSize: 10,
      fontFamily: "DMSans-SemiBold",
    },
    blockSub: {
      color: "rgba(255, 255, 255, 0.92)",
      fontSize: 10,
    },
    nowLine: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: "#E5484D",
      zIndex: 20,
    },
  });
};

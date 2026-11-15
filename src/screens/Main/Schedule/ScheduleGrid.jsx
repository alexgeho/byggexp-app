import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  PanResponder,
} from "react-native";
import {
  addDays,
  daysBetween,
  formatWeekdayLabel,
  getWeekNumber,
  startOfMonth,
  startOfWeek,
} from "../../../utils/schedule";
import {
  GRID_FIRST_HOUR,
  GRID_LAST_HOUR,
  GRID_OPEN_HOUR,
  dayIndexAt,
  dragEndMinute,
  formatMinutes,
  slotAt,
  toDayKey,
  toMinutes,
} from "../../../utils/scheduleBooking";
import { onDark } from "../../../theme/colorUtils";

// The one planning table. Week: the web admin's Google-Calendar view — hours
// down the left, one column per day, every booking a block from its start
// time. Month and Custom: the same seven columns, a row per week, the whole
// period on screen. Same gutter, same head, same colours — switching does not jump.
const HOUR_HEIGHT = 48;
const GUTTER_WIDTH = 48;
const HOURS = Array.from(
  { length: GRID_LAST_HOUR - GRID_FIRST_HOUR },
  (_, index) => GRID_FIRST_HOUR + index,
);
const FIRST_MINUTE = GRID_FIRST_HOUR * 60;
const LAST_MINUTE = GRID_LAST_HOUR * 60;
const topOf = (minute) => ((minute - FIRST_MINUTE) / 60) * HOUR_HEIGHT;
const MONTH_CHIPS = 3;

export default function ScheduleGrid({
  view,
  isInside,
  days,
  blocksByDay,
  leavesByDay,
  nameOf,
  projectNameOf,
  colorOf,
  canBook,
  onSlotPress,
  onBlockPress,
  onDayPress,
  onRangeSelect,
  content,
  t,
}) {
  const styles = useMemo(() => createStyles(content), [content]);
  const today = toDayKey(new Date());
  const now = new Date();
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  // Week and two weeks are the hour grid; month and custom are rows of weeks.
  const isMonth = view !== "week" && view !== "twoWeeks";
  // Fourteen columns of hours: the same grid, only tighter type.
  const dense = !isMonth && days.length > 7;
  const head = isMonth ? days.slice(0, 7) : days;

  // Several days at once: a long press on a day, then a drag over the days
  // next to it (in the week also down the hours); lifting the finger opens
  // the booking for them. A long press without a drag = that one day.
  const [selection, setSelection] = useState(null); // { from, to, start, end }
  const selectionRef = useRef(null);
  const capturedRef = useRef(false);
  const bodyRef = useRef(null);
  const frameRef = useRef({ x: 0, y: 0, width: 0 });
  const rowsRef = useRef([]);
  const select = (next) => {
    selectionRef.current = next;
    setSelection(next);
  };
  const beginSelection = (index, slot) => {
    bodyRef.current?.measureInWindow?.((x, y, width) => {
      frameRef.current = { x, y, width };
    });
    const start = slot ? toMinutes(slot.start) : null;
    select({ from: index, to: index, start, end: slot ? start + 60 : null });
  };
  const moveSelection = (pageX, pageY) => {
    const current = selectionRef.current;
    const frame = frameRef.current;
    if (!current || !frame.width) return;
    const y = pageY - frame.y;
    const to = dayIndexAt({
      x: pageX - frame.x,
      y,
      width: frame.width,
      gutter: GUTTER_WIDTH,
      columns: isMonth ? 7 : days.length,
      rows: isMonth ? rowsRef.current : null,
    });
    const end =
      current.start === null
        ? null
        : dragEndMinute(current.start, y, HOUR_HEIGHT);
    if (to !== current.to || end !== current.end) {
      select({ ...current, to, end });
    }
  };
  const endSelection = (commit) => {
    const current = selectionRef.current;
    capturedRef.current = false;
    if (!current) return;
    select(null);
    if (!commit) return;
    const first = Math.min(current.from, current.to);
    const last = Math.max(current.from, current.to);
    onRangeSelect(
      toDayKey(days[first]),
      toDayKey(days[last]),
      current.start === null
        ? null
        : {
            start: formatMinutes(current.start),
            end: formatMinutes(current.end),
          },
    );
  };
  // The latest closures for the responder, which is created once.
  const handlersRef = useRef({});
  handlersRef.current = { moveSelection, endSelection };
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponderCapture: () => {
        if (!selectionRef.current) return false;
        capturedRef.current = true;
        return true;
      },
      onPanResponderMove: (event) =>
        handlersRef.current.moveSelection(
          event.nativeEvent.pageX,
          event.nativeEvent.pageY,
        ),
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: () => handlersRef.current.endSelection(true),
      onPanResponderTerminate: () => handlersRef.current.endSelection(false),
    }),
  ).current;
  // The finger lifted without a drag: the pressable ends the selection (after
  // a drag the responder above does).
  const onPressOut = () => {
    if (!capturedRef.current) endSelection(true);
  };
  const isSelected = (index) =>
    selection !== null &&
    index >= Math.min(selection.from, selection.to) &&
    index <= Math.max(selection.from, selection.to);
  const hasLeaves =
    !isMonth &&
    days.some((day) => (leavesByDay[toDayKey(day)] || []).length > 0);
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return (
    <View style={styles.flex}>
      <View style={styles.headRow}>
        <View style={styles.corner}>
          {isMonth ? null : (
            <Text style={styles.cornerText}>
              {t("schedule.week", { number: getWeekNumber(days[0]) })}
            </Text>
          )}
        </View>
        {head.map((day) => {
          const isToday = toDayKey(day) === today;
          return (
            <Pressable
              key={day.getTime()}
              style={styles.dayHead}
              // A tap on a day of the week opens that one day.
              disabled={isMonth || days.length === 1}
              onPress={() => onDayPress(day)}
            >
              <Text
                numberOfLines={1}
                style={[styles.weekday, dense && styles.weekdayDense]}
              >
                {dense
                  ? formatWeekdayLabel(day).slice(0, 1).toUpperCase()
                  : formatWeekdayLabel(day)}
              </Text>
              {isMonth ? null : (
                <View
                  style={[
                    styles.dateBox,
                    dense && styles.dateBoxDense,
                    isToday && styles.dateBoxToday,
                  ]}
                >
                  <Text
                    style={[
                      styles.date,
                      dense && styles.dateDense,
                      isToday && styles.dateToday,
                    ]}
                  >
                    {day.getDate()}
                  </Text>
                </View>
              )}
            </Pressable>
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
        // The hours open on the morning, not on midnight.
        key={isMonth ? "weeks" : "hours"}
        contentOffset={
          isMonth ? undefined : { x: 0, y: topOf(GRID_OPEN_HOUR * 60) }
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.bodyContent}
        // The page does not scroll under a finger that is selecting days.
        scrollEnabled={selection === null}
      >
        <View ref={bodyRef} collapsable={false} {...pan.panHandlers}>
          {isMonth ? (
            weeks.map((week, weekIndex) => (
              <View
                key={week[0].getTime()}
                style={styles.weekRow}
                onLayout={(event) => {
                  const { y, height } = event.nativeEvent.layout;
                  rowsRef.current[weekIndex] = { y, height };
                }}
              >
                <View style={styles.weekGutter}>
                  <Text style={styles.hourText}>{getWeekNumber(week[0])}</Text>
                </View>
                {week.map((day, dayIndex) => {
                  const index = weekIndex * 7 + dayIndex;
                  const dayKey = toDayKey(day);
                  const isToday = dayKey === today;
                  const outside = !isInside(day);
                  const weekend = day.getDay() === 0 || day.getDay() === 6;
                  const leaves = leavesByDay[dayKey] || [];
                  const blocks = [...(blocksByDay[dayKey] || [])].sort(
                    (a, b) => a.start - b.start,
                  );
                  const room = Math.max(0, MONTH_CHIPS - leaves.length);
                  const more =
                    Math.max(0, leaves.length - MONTH_CHIPS) +
                    Math.max(0, blocks.length - room);
                  return (
                    <Pressable
                      key={dayKey}
                      testID={`grid-day-${dayKey}`}
                      style={[
                        styles.cell,
                        weekend && styles.columnWeekend,
                        isSelected(index) && styles.cellSelected,
                      ]}
                      onPress={() => onDayPress(day)}
                      delayLongPress={300}
                      onLongPress={canBook ? () => beginSelection(index) : null}
                      onPressOut={onPressOut}
                    >
                      <View
                        style={[
                          styles.cellDate,
                          isToday && styles.dateBoxToday,
                        ]}
                      >
                        <Text
                          style={[
                            styles.cellDateText,
                            outside && styles.cellDateOutside,
                            isToday && styles.dateToday,
                          ]}
                        >
                          {day.getDate()}
                        </Text>
                      </View>
                      {leaves.slice(0, MONTH_CHIPS).map((leave) => (
                        <View
                          key={`${leave.userId}-${leave.type}`}
                          style={styles.leavePill}
                        >
                          <Text numberOfLines={1} style={styles.leaveText}>
                            {nameOf(leave.userId)}
                          </Text>
                        </View>
                      ))}
                      {blocks.slice(0, room).map((block) => (
                        <Pressable
                          key={block.id}
                          testID={`grid-block-${block.id}`}
                          onPress={() => onBlockPress(block)}
                          style={[
                            styles.chip,
                            { backgroundColor: colorOf(block.userId) },
                            block.overbooked && styles.blockOver,
                          ]}
                        >
                          <Text numberOfLines={1} style={styles.blockName}>
                            {nameOf(block.userId)}
                          </Text>
                        </Pressable>
                      ))}
                      {more > 0 ? (
                        <Text style={styles.moreText}>+{more}</Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))
          ) : (
            <View style={styles.body}>
              <View style={styles.gutter}>
                {HOURS.map((hour) => (
                  <View key={hour} style={styles.hourCell}>
                    <Text style={styles.hourText}>
                      {formatMinutes(hour * 60)}
                    </Text>
                  </View>
                ))}
              </View>

              {days.map((day, index) => {
                const dayKey = toDayKey(day);
                const weekend = day.getDay() === 0 || day.getDay() === 6;
                return (
                  <Pressable
                    key={day.getTime()}
                    testID={`grid-day-${dayKey}`}
                    style={[styles.column, weekend && styles.columnWeekend]}
                    disabled={!canBook}
                    delayLongPress={300}
                    onLongPress={(event) =>
                      beginSelection(
                        index,
                        slotAt(event.nativeEvent.locationY, HOUR_HEIGHT),
                      )
                    }
                    onPressOut={onPressOut}
                    onPress={(event) =>
                      onSlotPress(
                        dayKey,
                        slotAt(event.nativeEvent.locationY, HOUR_HEIGHT),
                      )
                    }
                  >
                    {HOURS.map((hour) => (
                      <View
                        key={hour}
                        pointerEvents="none"
                        style={styles.slot}
                      />
                    ))}

                    {isSelected(index) ? (
                      <View
                        pointerEvents="none"
                        style={[
                          styles.selectionBlock,
                          {
                            top: topOf(selection.start),
                            height:
                              topOf(selection.end) - topOf(selection.start),
                          },
                        ]}
                      />
                    ) : null}

                    {(blocksByDay[dayKey] || []).map((block) => {
                      const start = Math.max(block.start, FIRST_MINUTE);
                      const end = Math.min(block.end, LAST_MINUTE);
                      if (end <= start) return null;
                      // Like the web: overlapping bookings cascade to the right,
                      // a free strip on the right stays for a new tap.
                      const step =
                        block.lanes > 1
                          ? Math.min(16, 30 / (block.lanes - 1))
                          : 0;
                      const left = block.lane * step;
                      const height = Math.max(
                        topOf(end) - topOf(start) - 2,
                        20,
                      );
                      return (
                        <Pressable
                          key={block.id}
                          testID={`grid-block-${block.id}`}
                          onPress={() => onBlockPress(block)}
                          style={[
                            styles.block,
                            dense && styles.blockDense,
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
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="clip"
                            style={[
                              styles.blockName,
                              dense && styles.blockNameDense,
                            ]}
                          >
                            {nameOf(block.userId)}
                          </Text>
                          {height >= 34 && !dense ? (
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
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// The days on screen: the week (Mon–Sun) the anchor day falls in, that week
// and the next one, or every whole week its month — or the chosen period —
// touches. A custom period of up to two weeks is exactly its own days.
// Hours down the left (week, two weeks, a custom period of up to two weeks)
// or a row per week (month, a longer custom period).
export const HOUR_GRID_MAX_DAYS = 14;
export const isHourGrid = (view, range) =>
  view === "week" ||
  view === "twoWeeks" ||
  (view === "custom" &&
    daysBetween(range.from, range.to) + 1 <= HOUR_GRID_MAX_DAYS);

export const gridDaysFor = (anchor, view, range) => {
  if (view === "custom" && isHourGrid(view, range)) {
    // A short period: exactly its days, a column each.
    return Array.from(
      { length: daysBetween(range.from, range.to) + 1 },
      (_, index) => addDays(range.from, index),
    );
  }
  if (view === "week" || view === "twoWeeks") {
    const first = startOfWeek(anchor);
    return Array.from({ length: view === "week" ? 7 : 14 }, (_, index) =>
      addDays(first, index),
    );
  }
  const custom = view === "custom";
  const first = startOfWeek(custom ? range.from : startOfMonth(anchor));
  const lastDay = custom
    ? range.to
    : new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const count = (Math.floor(daysBetween(first, lastDay) / 7) + 1) * 7;
  return Array.from({ length: count }, (_, index) => addDays(first, index));
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
    weekdayDense: {
      fontSize: 9,
    },
    dateBoxDense: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 0,
    },
    dateDense: {
      fontSize: 11,
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
    blockDense: {
      paddingHorizontal: 1,
      borderRadius: 4,
    },
    blockNameDense: {
      fontSize: 8,
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
    weekRow: {
      flexDirection: "row",
      minHeight: 96,
      borderBottomWidth: 1,
      borderBottomColor: line,
    },
    weekGutter: {
      width: GUTTER_WIDTH,
      alignItems: "center",
      paddingTop: 4,
    },
    cell: {
      flex: 1,
      borderLeftWidth: 1,
      borderLeftColor: line,
      padding: 2,
      gap: 2,
    },
    cellDate: {
      alignSelf: "center",
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      alignItems: "center",
      justifyContent: "center",
    },
    cellDateText: {
      color: c.textPrimary,
      fontSize: 12,
      fontFamily: "DMSans-SemiBold",
    },
    cellDateOutside: {
      color: c.textMuted,
    },
    cellSelected: {
      backgroundColor: "rgba(24, 119, 242, 0.18)",
    },
    selectionBlock: {
      position: "absolute",
      left: 1,
      right: 1,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: "#1877F2",
      backgroundColor: "rgba(24, 119, 242, 0.22)",
      zIndex: 15,
    },
    chip: {
      borderRadius: 6,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: c.surface,
    },
    moreText: {
      color: c.textMuted,
      fontSize: 10,
      textAlign: "center",
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

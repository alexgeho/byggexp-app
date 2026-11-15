import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useTranslation } from "react-i18next";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BackButton } from "../../../components/common/BackButton/BackButton";
import { BottomBar } from "../../../components/common/BottomBar/BottomBar";
import AuthContext from "../../../contexts/AuthContext";
import { assignmentService } from "../../../services/assignment.service";
import { useScheduleData } from "../../../hooks/useScheduleData";
import {
  addDays,
  addMonths,
  buildEmployeeOptions,
  buildProjectMap,
  EVENT_COLORS,
  formatMonthLabel,
  formatMonthSpanLabel,
  getMonthKey,
  normalizeId,
  parseMonthKey,
  startOfDay,
  startOfMonth,
} from "../../../utils/schedule";
import {
  buildDayBlocks,
  buildDayLeaves,
  parseDayKey,
  toDayKey,
} from "../../../utils/scheduleBooking";
import { PeriodSheet } from "../../../components/common/PeriodSheet/PeriodSheet";
import {
  PERIOD_VIEWS,
  PeriodTabs,
} from "../../../components/common/PeriodTabs/PeriodTabs";
import ScheduleGrid, { gridDaysFor, isHourGrid } from "./ScheduleGrid";
import { canCreateProjects } from "../../../utils/userRoles";
import { createStyles } from "./ScheduleScreen.styles";
import { useTheme } from "../../../theme/ThemeContext";
import { SheetView } from "../../../components/common/SheetSlideIn/SheetSlideIn";

// Dev-only preview with fake, varied data. Never true in production
// (guarded by __DEV__ at the call site); flip to preview colors locally.
const SCHEDULE_DEMO = false;

// One table (ScheduleGrid) for every view: week and two weeks = hours down
// the left; month and custom (two dates) = a row per week. Never a second table
// for another period.
const VIEWS = ["week", "twoWeeks", ...PERIOD_VIEWS.slice(1)];
const RANGE_KEY = "schedule-custom-range";
const VIEW_KEY = "schedule-view";
const HIDDEN_PEOPLE_KEY = "schedule-hidden-people";

export default function ScheduleScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme.content), [theme.content]);
  const { t } = useTranslation();
  const { user } = useContext(AuthContext);

  // The view picked last time is the one the screen opens on.
  const [view, setView] = useState("week");
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [hiddenPeople, setHiddenPeople] = useState([]);
  useEffect(() => {
    AsyncStorage.multiGet([VIEW_KEY, HIDDEN_PEOPLE_KEY, RANGE_KEY])
      .then(([[, savedView], [, savedHidden], [, savedRange]]) => {
        if (savedRange) setRange(JSON.parse(savedRange));
        if (VIEWS.includes(savedView)) setView(savedView);
        if (savedHidden) setHiddenPeople(JSON.parse(savedHidden));
      })
      .catch(() => {});
  }, []);
  // Custom: the two dates of the period (day keys), picked in the same
  // period sheet as in Shifts.
  const [range, setRange] = useState(() => {
    const first = startOfMonth(new Date());
    return {
      from: toDayKey(first),
      to: toDayKey(addDays(addMonths(first, 1), -1)),
    };
  });
  const [rangeDraft, setRangeDraft] = useState(null);
  const saveRange = (next) => {
    setRange(next);
    AsyncStorage.setItem(RANGE_KEY, JSON.stringify(next)).catch(() => {});
  };
  const openRangeSheet = () => setRangeDraft(range);
  const applyRange = () => {
    if (rangeDraft.from > rangeDraft.to) {
      Alert.alert(
        t("shiftHistory.invalidPeriodTitle"),
        t("shiftHistory.invalidPeriodMessage"),
      );
      return;
    }
    saveRange(rangeDraft);
    setRangeDraft(null);
  };
  // One day opened by a tap on it (from any view): the same hour grid with a
  // single column. Not a tab — a tab (or the title) leads back.
  const [focusDay, setFocusDay] = useState(null);
  const pickView = (next) => {
    if (focusDay && next === view) {
      setFocusDay(null);
      return;
    }
    setFocusDay(null);
    setView(next);
    AsyncStorage.setItem(VIEW_KEY, next).catch(() => {});
    if (next === "custom") openRangeSheet();
  };
  const togglePerson = (id) =>
    setHiddenPeople((prev) => {
      const next = prev.includes(id)
        ? prev.filter((value) => value !== id)
        : [...prev, id];
      AsyncStorage.setItem(HIDDEN_PEOPLE_KEY, JSON.stringify(next)).catch(
        () => {},
      );
      return next;
    });
  const rangeDays = useMemo(
    () => ({ from: parseDayKey(range.from), to: parseDayKey(range.to) }),
    [range],
  );
  const gridDays = useMemo(
    () => (focusDay ? [focusDay] : gridDaysFor(anchor, view, rangeDays)),
    [focusDay, anchor, view, rangeDays],
  );
  const { loading, projects, workers, leaves } = useScheduleData(
    user,
    SCHEDULE_DEMO,
  );
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const projectMap = useMemo(() => buildProjectMap(projects), [projects]);

  // Bookings (who is planned where, which day) for the days on screen —
  // the same /assignments the web calendar shows. Refetched on focus, so a
  // booking made in the form is there on the way back.
  const canBook = canCreateProjects(user?.role);
  const [assignments, setAssignments] = useState([]);
  const bookingRange = useMemo(
    () => ({
      from: toDayKey(gridDays[0]),
      to: toDayKey(gridDays[gridDays.length - 1]),
    }),
    [gridDays],
  );
  useFocusEffect(
    useCallback(() => {
      if (__DEV__ && SCHEDULE_DEMO) return undefined;
      let active = true;
      assignmentService
        .getRange(bookingRange.from, bookingRange.to)
        .then((list) => active && setAssignments(list))
        .catch(() => active && setAssignments([]));
      return () => {
        active = false;
      };
    }, [bookingRange]),
  );

  // People of the grid: everyone gets a stable colour (by id, not by the
  // order on screen), and can be switched off in the people row.
  const people = useMemo(
    () => buildEmployeeOptions(projects, workers),
    [projects, workers],
  );
  const personColors = useMemo(() => {
    const map = {};
    people
      .map((person) => String(person.id))
      .sort()
      .forEach((id, index) => {
        map[id] = EVENT_COLORS[index % EVENT_COLORS.length];
      });
    return map;
  }, [people]);
  const personNames = useMemo(
    () =>
      Object.fromEntries(
        people.map((person) => [String(person.id), person.name]),
      ),
    [people],
  );
  const gridData = useMemo(() => {
    const dayKeys = gridDays.map(toDayKey);
    const hidden = new Set(hiddenPeople);
    return {
      blocks: buildDayBlocks(assignments, dayKeys, hidden),
      leaves: buildDayLeaves(leaves, dayKeys, hidden),
    };
  }, [gridDays, hiddenPeople, assignments, leaves]);

  const isInside = (day) => {
    if (view === "twoWeeks") return true;
    return view === "custom"
      ? toDayKey(day) >= range.from && toDayKey(day) <= range.to
      : day.getMonth() === anchor.getMonth();
  };

  let headerLabel = formatMonthSpanLabel(
    gridDays[0],
    gridDays[gridDays.length - 1],
  );
  if (view === "month" && !focusDay) {
    headerLabel = formatMonthLabel(anchor);
  } else if (view === "custom" && !focusDay) {
    headerLabel = formatMonthSpanLabel(rangeDays.from, rangeDays.to);
  }

  const monthOptions = useMemo(() => {
    const base = startOfMonth(new Date());
    const options = [];
    for (let offset = -24; offset <= 12; offset += 1) {
      const date = addMonths(base, offset);
      options.push({ key: getMonthKey(date), label: formatMonthLabel(date) });
    }
    return options;
  }, []);

  // The "+" of the bottom bar: a new booking on the first day on screen
  // (today when the month on screen is the current one).
  const openNewBooking = () => {
    const today = startOfDay(new Date());
    let first = gridDays[0];
    if (focusDay) {
      first = focusDay;
    } else if (view === "custom") {
      first = rangeDays.from;
    } else if (view === "month") {
      first =
        getMonthKey(anchor) === getMonthKey(today)
          ? today
          : startOfMonth(anchor);
    }
    navigation.navigate("Booking", { date: toDayKey(first) });
  };

  // A tap on a free hour of the week: that day and hour, and the person when only one
  // is shown (as on the web).
  const openSlot = (date, { start, end }, dateTo) => {
    const shown = people.filter(
      (person) => !hiddenPeople.includes(String(person.id)),
    );
    navigation.navigate("Booking", {
      date,
      ...(start ? { start, end } : {}),
      // Days picked by a drag are exactly the days meant, weekend or not.
      ...(dateTo && dateTo !== date ? { dateTo } : {}),
      ...(shown.length === 1 ? { workerId: shown[0].id } : {}),
    });
  };

  // A booking opens its order with every booking on it (people, days, time).
  const openBooking = (item) => {
    if (!canBook || !item.projectId) {
      return;
    }
    const sameOrder = assignments.filter(
      (assignment) => normalizeId(assignment.projectId) === item.projectId,
    );
    const focus =
      sameOrder.find((assignment) =>
        item.assignmentIds.includes(normalizeId(assignment)),
      ) || null;
    navigation.navigate("Booking", {
      projectId: item.projectId,
      assignments: sameOrder,
      focus,
    });
  };

  // A tap on a day (week head, month, period) opens that one day.
  const openDay = (day) => setFocusDay(startOfDay(day));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton
          backgroundColor={theme.content.surfaceMuted}
          tint="light"
          borderColor="#FFFFFF50"
          // From one opened day the arrow goes back to the view it was
          // opened from (the month…), not out of Planning.
          onPress={() => (focusDay ? setFocusDay(null) : navigation.goBack())}
          iconSource={require("../../../assets/Arrow-left.png")}
        />
        {/* Only the month and the year of what is on screen — plain text, no
            day numbers, nothing to tap or pick here (owner 15.11). Over two
            months both are named and the type shrinks to fit. */}
        <Text
          testID="schedule-title"
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.5}
          style={styles.monthLabel}
        >
          {headerLabel}
        </Text>
        <View style={styles.headerSide} />
        {/* Nothing else up here: the top only shows; what is on screen is
            set below — the Week · 2 weeks · Month · Custom pills and the
            Custom sheet (owner 15.11). No ‹ ›. */}
      </View>

      <View style={styles.peopleRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.peopleContent}
        >
          {people.map((person) => {
            const id = String(person.id);
            const hidden = hiddenPeople.includes(id);
            return (
              <TouchableOpacity
                key={id}
                style={[styles.personChip, hidden && styles.personChipOff]}
                onPress={() => togglePerson(id)}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.personDot,
                    hidden
                      ? { borderColor: personColors[id] }
                      : {
                          borderColor: personColors[id],
                          backgroundColor: personColors[id],
                        },
                  ]}
                >
                  {hidden ? null : (
                    <Icon name="check" size={11} color="#FFFFFF" />
                  )}
                </View>
                <Text numberOfLines={1} style={styles.personName}>
                  {person.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.timelineCard}>
        <View style={styles.viewRow}>
          <PeriodTabs
            value={view}
            onChange={pickView}
            testIDPrefix="schedule-view"
            views={VIEWS}
          />
        </View>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#0091FF" />
          </View>
        ) : (
          <ScheduleGrid
            view={focusDay || isHourGrid(view, rangeDays) ? "week" : "month"}
            isInside={isInside}
            days={gridDays}
            blocksByDay={gridData.blocks}
            leavesByDay={gridData.leaves}
            nameOf={(id) => personNames[id] || ""}
            projectNameOf={(id) => projectMap[id]?.name || "—"}
            colorOf={(id) => personColors[id] || EVENT_COLORS[0]}
            canBook={canBook}
            onSlotPress={openSlot}
            onBlockPress={(block) =>
              openBooking({
                projectId: block.projectId || null,
                assignmentIds: [block.id],
              })
            }
            onDayPress={openDay}
            onRangeSelect={(from, to, slot) => openSlot(from, slot || {}, to)}
            content={theme.content}
            t={t}
          />
        )}
      </View>

      <BottomBar
        onLeftPress={() => navigation.navigate("Main")}
        onRightPress={() => navigation.navigate("Menu")}
        showAddButton={canBook}
        onAddPress={openNewBooking}
      />

      {/* Custom period — the one period sheet, shared with Shifts */}
      <PeriodSheet
        visible={rangeDraft !== null}
        onClose={() => setRangeDraft(null)}
        from={rangeDraft?.from}
        to={rangeDraft?.to}
        onChange={setRangeDraft}
        onApply={applyRange}
      />

      {/* Month picker */}
      <Modal
        visible={monthPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMonthPickerOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMonthPickerOpen(false)}
        >
          <SheetView style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t("schedule.selectMonth")}</Text>
            <FlatList
              data={monthOptions}
              keyExtractor={(option) => option.key}
              initialScrollIndex={24}
              getItemLayout={(_, index) => ({
                length: 52,
                offset: 52 * index,
                index,
              })}
              renderItem={({ item: option }) => (
                <TouchableOpacity
                  style={styles.optionRow}
                  onPress={() => {
                    setAnchor(parseMonthKey(option.key));
                    setMonthPickerOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={styles.optionName}>{option.label}</Text>
                  {option.key === getMonthKey(anchor) ? (
                    <Icon name="check" size={20} color="#0091FF" />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </SheetView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

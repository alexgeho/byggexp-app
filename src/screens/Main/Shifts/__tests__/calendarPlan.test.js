import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";
import { ShiftCalendar } from "../ShiftsScreen.parts";
import { buildCalendarLayout } from "../../../../utils/shiftsCalendar";

jest.mock("react-native-vector-icons/Feather", () => "Icon");
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// The plan tab reads the admin's Hours grid; a day with no shift of its own
// must still show its planned hours.
test("plan cells come from the grid, not only from shift days", () => {
  const plan = new Map([
    ["2026-09-23", 8 * 3600000],
    ["2026-09-24", 8 * 3600000],
  ]);
  const daySourceMs = (_entry, date) => plan.get(date) || 0;
  let tree;
  act(() => {
    tree = TestRenderer.create(
      <ShiftCalendar
        styles={{}}
        t={(k) => k}
        calendarYRef={{ current: 0 }}
        canGoBackMonth
        canGoForwardMonth
        onPrevMonth={() => {}}
        onNextMonth={() => {}}
        selectedMonth="2026-09"
        weekdayLabels={["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]}
        onToggleColumn={() => {}}
        calendarLayout={buildCalendarLayout("2026-09")}
        dayMap={new Map()}
        selectedDates={[]}
        todayDateKey="2026-09-23"
        onDayPress={() => {}}
        onEditDay={() => {}}
        canEditDay={false}
        selectMode={false}
        onToggleWeekRow={() => {}}
        daySourceMs={daySourceMs}
        sourceColor="#0785F4"
        hoursSource="planned"
        inlineManualDate={null}
        inlineManualSeed=""
        inlineValueRef={{ current: "" }}
        onStashInput={() => {}}
        pendingManual={{}}
        rowYRef={{ current: {} }}
      />,
    );
  });
  const eights = tree.root
    .findAllByType(Text)
    .filter((n) => n.props.children === "8");
  expect(eights).toHaveLength(2);
});

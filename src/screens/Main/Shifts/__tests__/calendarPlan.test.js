import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, TouchableOpacity } from "react-native";
import { ShiftOvertime, ShiftWeekPicker } from "../ShiftsScreen.parts";

jest.mock("react-native-vector-icons/Feather", () => "Icon");
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

const renderWeek = (props) => {
  let tree;
  act(() => {
    tree = TestRenderer.create(
      <ShiftWeekPicker
        styles={{}}
        t={(k) => k}
        focusedDate="2026-09-23"
        todayDateKey="2026-09-23"
        selectedMonth="2026-09"
        maxMonthKey="2026-09"
        weekdayLabels={["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]}
        dayMap={new Map()}
        daySourceMs={() => 0}
        sourceColor="#0785F4"
        hoursSource="planned"
        pendingManual={{}}
        selectMode={false}
        selectedDates={[]}
        onDayPress={() => {}}
        onFocusDate={() => {}}
        onPickMonth={() => {}}
        {...props}
      />,
    );
  });
  return tree;
};

const textsOf = (tree, value) =>
  tree.root.findAllByType(Text).filter((n) => n.props.children === value);

// The plan tab reads the admin's Hours grid; a day with no shift of its own
// must still show its planned hours.
test("plan days come from the grid, not only from shift days", () => {
  const plan = new Map([
    ["2026-09-23", 8 * 3600000],
    ["2026-09-24", 8 * 3600000],
  ]);
  const tree = renderWeek({
    daySourceMs: (_entry, date) => plan.get(date) || 0,
  });
  expect(textsOf(tree, "8")).toHaveLength(2);
});

// Week 40 runs 28 Sep – 4 Oct. Only September is loaded, so October's days
// show no hours rather than numbers that belong to another month.
test("days of the next month in the same week show no hours", () => {
  const tree = renderWeek({
    focusedDate: "2026-09-30",
    maxMonthKey: "2026-10",
    daySourceMs: () => 8 * 3600000,
  });
  expect(textsOf(tree, "8")).toHaveLength(3);
});

test("a typed but unsaved day shows its pending hours", () => {
  const tree = renderWeek({
    hoursSource: "manual",
    pendingManual: { "2026-09-22": 7.5 },
  });
  expect(textsOf(tree, "7,5")).toHaveLength(1);
});

test("a day with övertid gets a bar under its hours", () => {
  const tree = renderWeek({
    hoursSource: "manual",
    daySourceMs: (_entry, date) => (date === "2026-09-22" ? 10 * 3600000 : 0),
    dayOvertimeOf: (date) =>
      date === "2026-09-22"
        ? { overtimeMs: 2 * 3600000, pending: true }
        : { overtimeMs: 0, pending: false },
  });
  const bars = tree.root
    .findAllByProps({ testID: "shifts-hours-bar" })
    .filter((n) => typeof n.type === "string");
  expect(bars).toHaveLength(1);
});

test("a manager approves or denies övertid that waits", () => {
  const onDecide = jest.fn();
  const shift = {
    id: "s1",
    manualDurationMs: 10 * 3600000,
    overtimeMs: 2 * 3600000,
    overtimeStatus: "pending",
  };
  let tree;
  act(() => {
    tree = TestRenderer.create(
      <ShiftOvertime
        shift={shift}
        styles={{}}
        t={(k) => k}
        canDecide
        busy={false}
        onDecide={onDecide}
      />,
    );
  });
  expect(textsOf(tree, "shifts.overtimePending")).toHaveLength(1);
  const approve = tree.root.find(
    (n) =>
      n.type === TouchableOpacity &&
      n.props.testID === "shifts-approve-overtime",
  );
  act(() => approve.props.onPress());
  expect(onDecide).toHaveBeenCalledWith(true);

  // Approved: the status says so and there is nothing left to decide.
  act(() => {
    tree.update(
      <ShiftOvertime
        shift={{ ...shift, overtimeStatus: "approved" }}
        styles={{}}
        t={(k) => k}
        canDecide
        busy={false}
        onDecide={onDecide}
      />,
    );
  });
  expect(textsOf(tree, "shifts.overtimeApproved")).toHaveLength(1);
  expect(
    tree.root.findAllByProps({ testID: "shifts-approve-overtime" }),
  ).toHaveLength(0);
});

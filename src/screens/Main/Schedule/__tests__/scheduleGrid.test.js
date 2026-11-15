import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text } from "react-native";

import AuthContext from "../../../../contexts/AuthContext";
import { ThemeProvider } from "../../../../theme/ThemeContext";
import ScheduleScreen from "../ScheduleScreen";
import { toDayKey } from "../../../../utils/scheduleBooking";

const mockNavigate = jest.fn();

jest.mock("react-native-vector-icons/Feather", () => "Icon");
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: "sv" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    useNavigation: () => ({ navigate: mockNavigate, goBack: jest.fn() }),
    useFocusEffect: (cb) => React.useEffect(cb, [cb]),
    createNavigationContainerRef: () => ({
      isReady: () => false,
      navigate: jest.fn(),
    }),
  };
});
jest.mock("../../../../components/common/BottomBar/BottomBar", () => ({
  BottomBar: () => null,
}));
jest.mock("../../../../components/common/BackButton/BackButton", () => ({
  BackButton: () => null,
}));
jest.mock("../../../../services", () => ({ taskService: {} }));
jest.mock("../../../../hooks/useScheduleData", () => ({
  useScheduleData: () => ({
    loading: false,
    tasks: [],
    projects: [{ _id: "p1", name: "Kök Berg", workers: ["u1"] }],
    workers: [{ _id: "u1", name: "Anna" }],
    leaves: [],
    reload: jest.fn(),
  }),
}));
jest.mock("../../../../services/assignment.service", () => ({
  assignmentService: {
    getRange: jest.fn(() =>
      Promise.resolve([
        {
          _id: "a1",
          userId: "u1",
          projectId: "p1",
          date: `${require("../../../../utils/scheduleBooking").toDayKey(
            new Date(),
          )}T00:00:00.000Z`,
          startTime: "08:00",
          hours: 2,
        },
      ]),
    ),
  },
}));

const renderScreen = async (role) => {
  let tree;
  await act(async () => {
    tree = TestRenderer.create(
      <AuthContext.Provider value={{ user: { _id: "admin", role } }}>
        <ThemeProvider>
          <ScheduleScreen />
        </ThemeProvider>
      </AuthContext.Provider>,
    );
  });
  await act(async () => {});
  return tree;
};

const texts = (tree) =>
  tree.root.findAllByType(Text).map((node) => node.props.children);

// The pressable itself (the node that carries the handler), by testID.
const pressables = (tree, prefix) =>
  tree.root.findAll(
    (node) =>
      typeof node.props.testID === "string" &&
      node.props.testID.startsWith(prefix) &&
      typeof node.props.onPress === "function" &&
      typeof node.type !== "string",
  );
const todayColumn = (tree) =>
  pressables(tree, `grid-day-${toDayKey(new Date())}`)[0];

describe("Planning — one grid", () => {
  beforeEach(() => mockNavigate.mockClear());

  it("opens on the week grid with the booking as a block", async () => {
    const tree = await renderScreen("companyAdmin");
    const shown = texts(tree).flat();
    expect(shown).toContain("08:00");
    expect(shown).toContain("Kök Berg");
    const days = new Set(
      pressables(tree, "grid-day-").map((node) => node.props.testID),
    );
    expect(days.size).toBe(7);
    expect(pressables(tree, "grid-block-a1").length).toBeGreaterThan(0);
  });

  it("a tap on a free hour opens a new booking for that day and hour", async () => {
    const tree = await renderScreen("companyAdmin");
    act(() =>
      todayColumn(tree).props.onPress({ nativeEvent: { locationY: 48 * 9 } }),
    );
    expect(mockNavigate).toHaveBeenCalledWith("Booking", {
      date: toDayKey(new Date()),
      start: "09:00",
      end: "10:00",
      workerId: "u1",
    });
  });

  it("a tap on a block opens its order", async () => {
    const tree = await renderScreen("companyAdmin");
    act(() => pressables(tree, "grid-block-a1")[0].props.onPress());
    expect(mockNavigate).toHaveBeenCalledWith(
      "Booking",
      expect.objectContaining({ projectId: "p1" }),
    );
  });

  it("a worker sees the grid but cannot book", async () => {
    const tree = await renderScreen("worker");
    expect(todayColumn(tree).props.disabled).toBe(true);
    act(() => pressables(tree, "grid-block-a1")[0].props.onPress());
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("month is the same grid: every week of the month, a tap opens that day", async () => {
    const tree = await renderScreen("companyAdmin");
    const monthTab = tree.root.findAll(
      (node) =>
        typeof node.props.onPress === "function" &&
        node.findAllByType(Text).length === 1 &&
        node.findAllByType(Text)[0].props.children === "schedule.views.month",
    )[0];
    await act(async () => monthTab.props.onPress());
    const days = new Set(
      pressables(tree, "grid-day-").map((node) => node.props.testID),
    );
    expect(days.size % 7).toBe(0);
    expect(days.size).toBeGreaterThanOrEqual(28);
    expect(pressables(tree, "grid-block-a1").length).toBeGreaterThan(0);
    expect(texts(tree).flat()).not.toContain("08:00");

    await act(async () => todayColumn(tree).props.onPress());
    expect(
      new Set(pressables(tree, "grid-day-").map((node) => node.props.testID))
        .size,
    ).toBe(1);
    expect(texts(tree).flat()).toContain("08:00");
  });

  it("custom is the same grid over the chosen dates", async () => {
    const tree = await renderScreen("companyAdmin");
    const tab = tree.root.findAll(
      (node) =>
        typeof node.props.onPress === "function" &&
        node.findAllByType(Text).length === 1 &&
        node.findAllByType(Text)[0].props.children === "schedule.views.custom",
    )[0];
    await act(async () => tab.props.onPress());
    // Opens on two weeks from today: every whole week they touch.
    const days = new Set(
      pressables(tree, "grid-day-").map((node) => node.props.testID),
    );
    expect(days.size % 7).toBe(0);
    expect(days.size).toBeGreaterThanOrEqual(14);
    expect(days.size).toBeLessThanOrEqual(21);
    expect(pressables(tree, "grid-block-a1").length).toBeGreaterThan(0);
  });

  it("a long press on a day of the month books that day", async () => {
    const tree = await renderScreen("companyAdmin");
    const monthTab = tree.root.findAll(
      (node) =>
        typeof node.props.onPress === "function" &&
        node.findAllByType(Text).length === 1 &&
        node.findAllByType(Text)[0].props.children === "schedule.views.month",
    )[0];
    await act(async () => monthTab.props.onPress());
    await act(async () => todayColumn(tree).props.onLongPress());
    await act(async () => todayColumn(tree).props.onPressOut());
    expect(mockNavigate).toHaveBeenCalledWith("Booking", {
      date: toDayKey(new Date()),
      workerId: "u1",
    });
  });
});

describe("Custom period sheet", () => {
  it("first tap is the start, the next tap the end", () => {
    const {
      PeriodSheet,
    } = require("../../../../components/common/PeriodSheet/PeriodSheet");
    const Harness = () => {
      const [range, setRange] = React.useState({
        from: "2026-11-15",
        to: "2026-11-15",
      });
      return (
        <ThemeProvider>
          <PeriodSheet
            visible
            from={range.from}
            to={range.to}
            onChange={setRange}
            onApply={() => mockNavigate(range)}
            onClose={() => {}}
          />
        </ThemeProvider>
      );
    };
    let tree;
    act(() => {
      tree = TestRenderer.create(<Harness />);
    });
    const press = (id) =>
      act(() => tree.root.findAllByProps({ testID: id })[0].props.onPress());
    press("period-day-2026-11-10");
    press("period-day-2026-11-13");
    press("period-apply");
    expect(mockNavigate).toHaveBeenCalledWith({
      from: "2026-11-10",
      to: "2026-11-13",
    });
  });
});

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

describe("Planning — hour grid", () => {
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
      todayColumn(tree).props.onPress({ nativeEvent: { locationY: 48 * 3 } }),
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
});

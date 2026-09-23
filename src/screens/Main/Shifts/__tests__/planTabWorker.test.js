import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, TouchableOpacity } from "react-native";

import AuthContext from "../../../../contexts/AuthContext";
import { ThemeProvider } from "../../../../theme/ThemeContext";
import ShiftsScreen from "../ShiftsScreen";
import { hoursService } from "../../../../services";

jest.mock("react-native-vector-icons/Feather", () => "Icon");
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("expo-image", () => ({ Image: "ExpoImage" }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: "ru" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      setParams: jest.fn(),
      goBack: jest.fn(),
      addListener: () => () => {},
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: (cb) => React.useEffect(cb, [cb]),
    useIsFocused: () => true,
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

const PROJECT = "6ab3927bb3d18f9b9059b4de";
const H = 3600000;
jest.mock("../../../../services", () => ({
  shiftService: {
    getMonths: jest.fn(async () => ["2026-09"]),
    getHistory: jest.fn(async () => ({
      month: "2026-09",
      availableMonths: ["2026-09"],
      monthTotalDurationMs: 4 * 3600000,
      previousMonthTotalDurationMs: 0,
      days: [
        {
          date: "2026-09-23",
          totalDurationMs: 4 * 3600000,
          plannedDurationMs: 8 * 3600000,
          shifts: [],
        },
      ],
    })),
  },
  hoursService: {
    getGrid: jest.fn(async () => ({
      workers: [
        {
          workerId: "w1",
          cells: Object.fromEntries(
            ["23", "24", "25", "28", "29", "30"].map((d) => [
              `2026-09-${d}`,
              { planned: 8 },
            ]),
          ),
        },
      ],
    })),
  },
  projectService: {
    getAll: jest.fn(async () => []),
    getMyProjects: jest.fn(async () => []),
  },
  userService: { getColleagues: jest.fn(async () => []) },
}));

jest.mock("../../../../utils/shifts", () => {
  const actual = jest.requireActual("../../../../utils/shifts");
  return {
    ...actual,
    getCurrentMonthKey: () => "2026-09",
    getTodayDateKey: () => "2026-09-23",
  };
});

test("a worker's plan tab shows every planned day of the home project", async () => {
  let tree;
  await act(async () => {
    tree = TestRenderer.create(
      <ThemeProvider>
        <AuthContext.Provider
          value={{
            user: { _id: "w1", role: "worker" },
            selectedProject: { _id: PROJECT },
          }}
        >
          <ShiftsScreen />
        </AuthContext.Provider>
      </ThemeProvider>,
    );
  });
  await act(async () => {});
  const planBtn = tree.root.findAll(
    (n) =>
      n.type === TouchableOpacity &&
      n
        .findAllByType(Text)
        .some((t) => t.props.children === "shifts.hoursSourcePlanned"),
  );
  if (planBtn[0]) await act(async () => planBtn[0].props.onPress());
  await act(async () => {});
  // Scoped to the project picked on the home screen.
  expect(hoursService.getGrid.mock.calls[0][0].projectId).toBe(PROJECT);
  const eights = tree.root
    .findAllByType(Text)
    .filter((n) => n.props.children === "8");
  expect(eights.length).toBe(6);
});

import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { Text, TextInput, TouchableOpacity } from "react-native";

import AuthContext from "../../../../contexts/AuthContext";
import { ThemeProvider } from "../../../../theme/ThemeContext";
import ShiftsScreen from "../ShiftsScreen";
import { projectService, shiftService } from "../../../../services";

jest.mock("react-native-vector-icons/Feather", () => "Icon");
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);
jest.mock("expo-image", () => ({ Image: "ExpoImage" }));
jest.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (k) => k, i18n: { language: "sv" } }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));
// Opened from the "log your hours" reminder: today's cell is ready for typing.
jest.mock("@react-navigation/native", () => {
  const React = require("react");
  return {
    useNavigation: () => ({
      navigate: jest.fn(),
      setParams: jest.fn(),
      goBack: jest.fn(),
      addListener: () => () => {},
    }),
    useRoute: () => ({ params: { openHoursEntry: true, date: "2026-10-21" } }),
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
jest.mock("../../../../services", () => ({
  shiftService: {
    getMonths: jest.fn(async () => ["2026-10"]),
    getHistory: jest.fn(async () => ({
      month: "2026-10",
      availableMonths: ["2026-10"],
      monthTotalDurationMs: 0,
      previousMonthTotalDurationMs: 0,
      days: [],
    })),
    addManualHours: jest.fn(async () => ({})),
  },
  hoursService: { getGrid: jest.fn(async () => ({ workers: [] })) },
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
    getCurrentMonthKey: () => "2026-10",
    getTodayDateKey: () => "2026-10-21",
  };
});

// The whole screen renders here; on a busy CI runner that takes longer than
// jest's default 5 s, and a timed-out test kept saving into the next one.
jest.setTimeout(30000);

const BYGGTOTALEN = { _id: "p1", name: "Byggtotalen steypa AB" };
const OTHER = { _id: "p2", name: "Villa Bromma" };
let mounted = null;

// A worker who never picked a project on the home screen types 8 h and saves.
async function typeEightAndSave(projects, setSelectedProject = jest.fn()) {
  projectService.getMyProjects.mockResolvedValue(projects);
  let tree;
  await act(async () => {
    tree = TestRenderer.create(
      <ThemeProvider>
        <AuthContext.Provider
          value={{
            user: { _id: "w1", role: "worker" },
            selectedProject: null,
            setSelectedProject,
          }}
        >
          <ShiftsScreen />
        </AuthContext.Provider>
      </ThemeProvider>,
    );
  });
  mounted = tree;
  await act(async () => {});
  const input = tree.root.findAllByType(TextInput)[0];
  await act(async () => input.props.onChangeText("8"));
  const save = tree.root.find(
    (n) =>
      n.type === TouchableOpacity && n.props.testID === "shifts-save-manual",
  );
  await act(async () => save.props.onPress());
  await act(async () => {});
  return tree;
}

beforeEach(() => {
  shiftService.addManualHours.mockClear();
});

afterEach(async () => {
  if (mounted) await act(async () => mounted.unmount());
  mounted = null;
});

test("with one project the hours are saved to it, no project error", async () => {
  await typeEightAndSave([BYGGTOTALEN]);
  expect(shiftService.addManualHours).toHaveBeenCalledWith({
    workerId: "w1",
    projectId: "p1",
    date: "2026-10-21",
    durationMs: 8 * 3600000,
  });
});

test("with several projects the worker picks one, and it is remembered", async () => {
  const setSelectedProject = jest.fn();
  const tree = await typeEightAndSave([BYGGTOTALEN, OTHER], setSelectedProject);
  expect(shiftService.addManualHours).not.toHaveBeenCalled();
  const option = tree.root.find(
    (n) =>
      n.type === TouchableOpacity &&
      n.findAllByType(Text).some((t) => t.props.children === "Villa Bromma"),
  );
  await act(async () => option.props.onPress());
  await act(async () => {});
  expect(setSelectedProject).toHaveBeenCalledWith(OTHER);
  expect(shiftService.addManualHours).toHaveBeenCalledWith(
    expect.objectContaining({ projectId: "p2", date: "2026-10-21" }),
  );
});

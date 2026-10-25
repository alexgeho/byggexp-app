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

// A worker who never picked a project on the home screen types hours and saves.
async function typeEightAndSave(
  projects,
  setSelectedProject = jest.fn(),
  hours = "8",
  beforeSave = async () => {},
) {
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
  await act(async () => input.props.onChangeText(hours));
  await beforeSave(tree);
  const save = tree.root.find(
    (n) =>
      n.type === TouchableOpacity && n.props.testID === "shifts-save-hours",
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
    overtimeMs: 0,
    obMs: 0,
    travelMinutes: 0,
    travelKm: 0,
    perDiem: "none",
    dayNote: "",
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

// The typed number is arbetstid; övertid and OB are added on top with + / −.
test("typed hours are arbetstid; nothing becomes övertid by itself", async () => {
  await typeEightAndSave([BYGGTOTALEN], jest.fn(), "10");
  expect(shiftService.addManualHours).toHaveBeenCalledWith(
    expect.objectContaining({ durationMs: 10 * 3600000, overtimeMs: 0 }),
  );
});

test("övertid from + comes on top of the arbetstid", async () => {
  await typeEightAndSave([BYGGTOTALEN], jest.fn(), "8", async (tree) => {
    const more = tree.root.find(
      (n) =>
        n.type === TouchableOpacity &&
        n.props.accessibilityLabel === "more overtime",
    );
    await act(async () => more.props.onPress());
    await act(async () => more.props.onPress());
  });
  expect(shiftService.addManualHours).toHaveBeenCalledWith(
    expect.objectContaining({
      durationMs: 9 * 3600000,
      overtimeMs: 1 * 3600000,
    }),
  );
});

// Autosave: a second after typing the day is saved with no button, and the
// card says so.
test("saves the day by itself a second after typing, then shows Sparat", async () => {
  projectService.getMyProjects.mockResolvedValue([BYGGTOTALEN]);
  let tree;
  await act(async () => {
    tree = TestRenderer.create(
      <ThemeProvider>
        <AuthContext.Provider
          value={{
            user: { _id: "w1", role: "worker" },
            selectedProject: null,
            setSelectedProject: jest.fn(),
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
  expect(shiftService.addManualHours).not.toHaveBeenCalled();

  await act(async () => new Promise((r) => setTimeout(r, 1200)));
  expect(shiftService.addManualHours).toHaveBeenCalledWith(
    expect.objectContaining({ projectId: "p1", durationMs: 8 * 3600000 }),
  );
  const texts = tree.root
    .findAllByType(Text)
    .map((n) => [].concat(n.props.children).join(""));
  expect(texts.some((s) => s.includes("shifts.saved ✓"))).toBe(true);
});

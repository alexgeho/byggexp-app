import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DEFAULT_SECONDARY_ACTION,
  getSecondaryAction,
  saveSecondaryAction,
  getEnabledButtons,
  saveEnabledButtons,
  getEnabledSections,
  saveEnabledSections,
  getSectionsOrder,
  saveSectionsOrder,
  getButtonsOrder,
  getDismissedSections,
  saveDismissedSections,
} from "../homeButtonsStorage";
import { homeSections, mainButtons } from "../../constants/mainButtons";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe("secondary action", () => {
  it("defaults to camera when unset", async () => {
    expect(await getSecondaryAction()).toBe(DEFAULT_SECONDARY_ACTION);
  });

  it("round-trips a valid action", async () => {
    await saveSecondaryAction("play");
    expect(await getSecondaryAction()).toBe("play");
  });

  it("ignores an invalid stored value", async () => {
    await saveSecondaryAction("teleport");
    expect(await getSecondaryAction()).toBe(DEFAULT_SECONDARY_ACTION);
  });
});

describe("enabled buttons", () => {
  it("returns null when nothing is stored", async () => {
    expect(await getEnabledButtons()).toBeNull();
  });

  it("returns (at least) the saved buttons", async () => {
    await saveEnabledButtons(["employees", "camera"]);
    const result = await getEnabledButtons();
    expect(result).toEqual(expect.arrayContaining(["employees", "camera"]));
  });
});

describe("enabled sections", () => {
  it("returns null when nothing is stored (caller applies role default)", async () => {
    expect(await getEnabledSections()).toBeNull();
  });

  it("round-trips a saved list", async () => {
    await saveEnabledSections(["shift-history"]);
    expect(await getEnabledSections()).toEqual(["shift-history"]);
  });
});

describe("sections order", () => {
  it("returns every section id when unset", async () => {
    const allIds = homeSections.map((s) => s.id);
    expect(await getSectionsOrder()).toEqual(allIds);
  });

  it("keeps the saved order first and appends any new/missing ids", async () => {
    const allIds = homeSections.map((s) => s.id);
    // Save only the last id — the rest must be appended after it.
    await saveSectionsOrder([allIds[allIds.length - 1]]);
    const result = await getSectionsOrder();
    expect(result[0]).toBe(allIds[allIds.length - 1]);
    expect(new Set(result)).toEqual(new Set(allIds));
    expect(result).toHaveLength(allIds.length);
  });
});

describe("buttons order", () => {
  it("returns every button id when unset", async () => {
    expect(await getButtonsOrder()).toEqual(mainButtons.map((b) => b.id));
  });
});

describe("dismissed sections", () => {
  it("defaults to an empty list", async () => {
    expect(await getDismissedSections()).toEqual([]);
  });

  it("round-trips a saved list", async () => {
    await saveDismissedSections(["tasks-history"]);
    expect(await getDismissedSections()).toEqual(["tasks-history"]);
  });
});

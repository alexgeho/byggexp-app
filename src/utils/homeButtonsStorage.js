import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  defaultEnabledButtons,
  defaultEnabledSections,
  homeSections,
  mainButtons,
} from "../constants/mainButtons";

const STORAGE_KEY = "enabled-home-buttons";

const SECTIONS_ORDER_KEY = "home-sections-order";

const BUTTONS_ORDER_KEY = "home-buttons-order";

const STORAGE_MIGRATIONS_KEY = "enabled-home-buttons-migrations";

const ENABLED_BUTTON_MIGRATIONS = ["tasks"];

const ENABLED_SECTIONS_KEY = "enabled-home-sections";

const DISMISSED_SECTIONS_KEY = "dismissed-home-sections";

// The secondary round action on the home screen (next to Play). One of
// "camera" | "hours" | "play". Configurable in Customize Home Screen.
const SECONDARY_ACTION_KEY = "home-secondary-action";
export const SECONDARY_ACTIONS = ["camera", "hours", "play"];
export const DEFAULT_SECONDARY_ACTION = "camera";

export async function getSecondaryAction() {
  const data = await AsyncStorage.getItem(SECONDARY_ACTION_KEY);
  if (data && SECONDARY_ACTIONS.includes(data)) {
    return data;
  }
  return DEFAULT_SECONDARY_ACTION;
}

export async function saveSecondaryAction(action) {
  await AsyncStorage.setItem(SECONDARY_ACTION_KEY, action);
}

export async function saveEnabledButtons(buttons) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(buttons));
}

export async function getEnabledButtons() {
  const data = await AsyncStorage.getItem(STORAGE_KEY);

  if (!data) {
    return null;
  }

  const savedButtons = JSON.parse(data);
  const appliedMigrationsData = await AsyncStorage.getItem(
    STORAGE_MIGRATIONS_KEY,
  );
  const appliedMigrations = appliedMigrationsData
    ? JSON.parse(appliedMigrationsData)
    : [];
  const pendingButtonIds = ENABLED_BUTTON_MIGRATIONS.filter(
    function filterPendingMigration(buttonId) {
      return !appliedMigrations.includes(buttonId);
    },
  );

  if (pendingButtonIds.length === 0) {
    return savedButtons;
  }

  const migratedButtons = [
    ...savedButtons,
    ...pendingButtonIds.filter(function filterDefaultButton(buttonId) {
      return (
        defaultEnabledButtons.includes(buttonId) &&
        !savedButtons.includes(buttonId)
      );
    }),
  ];

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migratedButtons));
  await AsyncStorage.setItem(
    STORAGE_MIGRATIONS_KEY,
    JSON.stringify([...appliedMigrations, ...pendingButtonIds]),
  );

  return migratedButtons;
}

export async function getEnabledSections() {
  const savedSections = await AsyncStorage.getItem(ENABLED_SECTIONS_KEY);

  if (!savedSections) {
    return defaultEnabledSections;
  }

  return JSON.parse(savedSections);
}

export async function saveEnabledSections(sections) {
  await AsyncStorage.setItem(ENABLED_SECTIONS_KEY, JSON.stringify(sections));
}

// Full ordered list of home section ids (enabled or not). New sections
// added to the app are appended so a saved order never hides them.
export async function getSectionsOrder() {
  const allIds = homeSections.map((section) => section.id);
  const data = await AsyncStorage.getItem(SECTIONS_ORDER_KEY);

  if (!data) {
    return allIds;
  }

  const saved = JSON.parse(data);
  const known = saved.filter((id) => allIds.includes(id));
  const missing = allIds.filter((id) => !known.includes(id));

  return [...known, ...missing];
}

export async function saveSectionsOrder(order) {
  await AsyncStorage.setItem(SECTIONS_ORDER_KEY, JSON.stringify(order));
}

// Full ordered list of home button ids. New buttons added to the app are
// appended so a saved order never hides them.
export async function getButtonsOrder() {
  const allIds = mainButtons.map((button) => button.id);
  const data = await AsyncStorage.getItem(BUTTONS_ORDER_KEY);

  if (!data) {
    return allIds;
  }

  const saved = JSON.parse(data);
  const known = saved.filter((id) => allIds.includes(id));
  const missing = allIds.filter((id) => !known.includes(id));

  return [...known, ...missing];
}

export async function saveButtonsOrder(order) {
  await AsyncStorage.setItem(BUTTONS_ORDER_KEY, JSON.stringify(order));
}

export async function getDismissedSections() {
  const data = await AsyncStorage.getItem(DISMISSED_SECTIONS_KEY);

  if (!data) {
    return [];
  }

  return JSON.parse(data);
}

export async function saveDismissedSections(sections) {
  await AsyncStorage.setItem(DISMISSED_SECTIONS_KEY, JSON.stringify(sections));
}

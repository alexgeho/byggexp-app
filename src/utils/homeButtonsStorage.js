import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  defaultEnabledSections,
} from "../constants/mainButtons";

const STORAGE_KEY = "enabled-home-buttons";

const ENABLED_SECTIONS_KEY = "enabled-home-sections";

const DISMISSED_SECTIONS_KEY = "dismissed-home-sections";

export async function saveEnabledButtons(buttons) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(buttons),
  );
}

export async function getEnabledButtons() {
  const data = await AsyncStorage.getItem(STORAGE_KEY);

  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

export async function getEnabledSections() {
  const savedSections = await AsyncStorage.getItem(
    ENABLED_SECTIONS_KEY,
  );

  if (!savedSections) {
    return defaultEnabledSections;
  }

  return JSON.parse(savedSections);
}

export async function saveEnabledSections(sections) {
  await AsyncStorage.setItem(
    ENABLED_SECTIONS_KEY,
    JSON.stringify(sections),
  );
}

export async function getDismissedSections() {
  const data = await AsyncStorage.getItem(
    DISMISSED_SECTIONS_KEY,
  );

  if (!data) {
    return [];
  }

  return JSON.parse(data);
}

export async function saveDismissedSections(sections) {
  await AsyncStorage.setItem(
    DISMISSED_SECTIONS_KEY,
    JSON.stringify(sections),
  );
}
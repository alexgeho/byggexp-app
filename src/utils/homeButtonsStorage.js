import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "enabled-home-buttons";

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
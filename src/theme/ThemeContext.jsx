import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  greenTheme,
  blueTheme,
  blueDarkTextTheme,
  lightBlueTheme,
  orangeTheme,
  darkGrayTheme,
} from "./themes";

const ThemeContext = createContext();

const themes = {
  green: greenTheme,
  blue: blueTheme,
  blueDarkText: blueDarkTextTheme,
  lightBlue: lightBlueTheme,
  orange: orangeTheme,
  darkGray: darkGrayTheme,
};

const THEME_STORAGE_KEY = "app-theme";

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState("blue");

  useEffect(function loadSavedTheme() {
    let isMounted = true;

    async function hydrateTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem(
          THEME_STORAGE_KEY,
        );

        if (
          isMounted &&
          savedTheme &&
          themes[savedTheme]
        ) {
          setThemeName(savedTheme);
        }
      } catch (error) {
        console.error("Failed to load theme:", error);
      }
    }

    hydrateTheme();

    return function cleanup() {
      isMounted = false;
    };
  }, []);

  const changeTheme = useCallback((nextTheme) => {
    if (!themes[nextTheme]) {
      return;
    }

    setThemeName(nextTheme);

    AsyncStorage.setItem(
      THEME_STORAGE_KEY,
      nextTheme,
    ).catch((error) => {
      console.error("Failed to save theme:", error);
    });
  }, []);

  const value = useMemo(
    () => ({
      theme: themes[themeName],
      themeName,
      changeTheme,
    }),
    [changeTheme, themeName],
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
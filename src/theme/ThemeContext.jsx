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
  blueTheme,
  blackTheme,
  lightBlueTheme,
  lightGrayTheme,
  colorfulTheme,
} from "./themes";

const ThemeContext = createContext();

const themes = {
  blue: blueTheme,
  black: blackTheme,
  lightBlue: lightBlueTheme,
  lightGray: lightGrayTheme,
  colorful: colorfulTheme,
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
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);

        if (isMounted && savedTheme && themes[savedTheme]) {
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

    AsyncStorage.setItem(THEME_STORAGE_KEY, nextTheme).catch((error) => {
      console.error("Failed to save theme:", error);
    });
  }, []);

  // DEV only: `byggexp://dev-theme/<name>` switches the theme for screenshots.
  useEffect(() => {
    if (!__DEV__) return undefined;

    const { Linking } = require("react-native");
    const sub = Linking.addEventListener("url", ({ url }) => {
      const m = /dev-theme\/(\w+)/.exec(url || "");
      if (m) changeTheme(m[1]);
    });
    return () => sub.remove();
  }, [changeTheme]);

  const value = useMemo(
    () => ({
      theme: themes[themeName],
      themeName,
      changeTheme,
    }),
    [changeTheme, themeName],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

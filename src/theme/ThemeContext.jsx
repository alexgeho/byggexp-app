import React, { createContext, useContext, useState } from "react";

import {
  greenTheme,
  blueTheme,
  orangeTheme,
  darkGrayTheme,
} from "./themes";

const ThemeContext = createContext();

const themes = {
  green: greenTheme,
  blue: blueTheme,
  orange: orangeTheme,
  darkGray: darkGrayTheme,
};

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState("blue");

  const changeTheme = (nextTheme) => {
    if (!themes[nextTheme]) {
      return;
    }

    setThemeName(nextTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: themes[themeName],
        themeName,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
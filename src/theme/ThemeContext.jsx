import React, { createContext, useContext } from 'react';
import { greenTheme } from './themes';

const ThemeContext = createContext();

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider
      value={{
        theme: greenTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
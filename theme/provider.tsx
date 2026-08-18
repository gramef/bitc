import React, { createContext, useContext, ReactNode } from "react";
import { colors, fonts, radii, spacing, shadow } from "./tokens";

type Theme = {
  colors: typeof colors;
  fonts: typeof fonts;
  radii: typeof radii;
  spacing: typeof spacing;
  shadow: typeof shadow;
};

const ThemeContext = createContext<Theme>({
  colors,
  fonts,
  radii,
  spacing,
  shadow,
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeContext.Provider value={{ colors, fonts, radii, spacing, shadow }}>
      {children}
    </ThemeContext.Provider>
  );
}


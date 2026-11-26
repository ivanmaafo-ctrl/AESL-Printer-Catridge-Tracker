import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type TextScale = 'normal' | 'large';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  textScale: TextScale;
  isLargeText: boolean;
  toggleTextScale: () => void;
  setTextScale: (scale: TextScale) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'aesl_printflow_theme';
const TEXT_SCALE_STORAGE_KEY = 'aesl_printflow_text_scale';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore storage errors
    }
    return 'light';
  });

  const [textScale, setTextScaleState] = useState<TextScale>(() => {
    try {
      const saved = localStorage.getItem(TEXT_SCALE_STORAGE_KEY);
      if (saved === 'large' || saved === 'normal') return saved;
    } catch {
      // ignore storage errors
    }
    return 'normal';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (textScale === 'large') {
      root.classList.add('text-large');
    } else {
      root.classList.remove('text-large');
    }
    try {
      localStorage.setItem(TEXT_SCALE_STORAGE_KEY, textScale);
    } catch {
      // ignore storage errors
    }
  }, [textScale]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const toggleTextScale = () => {
    setTextScaleState((prev) => (prev === 'large' ? 'normal' : 'large'));
  };

  const setTextScale = (scale: TextScale) => {
    setTextScaleState(scale);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        toggleTheme,
        setTheme,
        textScale,
        isLargeText: textScale === 'large',
        toggleTextScale,
        setTextScale,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

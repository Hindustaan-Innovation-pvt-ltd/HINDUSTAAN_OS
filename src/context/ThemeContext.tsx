import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'orange' | 'blue' | 'emerald' | 'rose' | 'purple' | 'cosmic';

interface ThemeContextType {
  theme: 'light' | 'dark'; // Computed actual theme
  themeMode: ThemeMode; // User preference
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  
  compactMode: boolean;
  setCompactMode: (compact: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getUserKey = () => {
  try {
    const userStr = localStorage.getItem('hindustaan_user') || sessionStorage.getItem('hindustaan_user');
    if (userStr) {
      return JSON.parse(userStr).email || 'guest';
    }
  } catch (e) {}
  return 'guest';
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const userKey = getUserKey();

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const val = localStorage.getItem(`themeMode_${userKey}`) as ThemeMode;
    return (val === 'system' ? 'dark' : val) || 'dark';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    return (localStorage.getItem(`accentColor_${userKey}`) as AccentColor) || 'cosmic';
  });

  const [compactMode, setCompactMode] = useState<boolean>(() => {
    return localStorage.getItem(`compactMode_${userKey}`) === 'true';
  });

  // Calculate actual theme based on mode and system preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = () => {
      if (themeMode === 'system') {
        setTheme(mediaQuery.matches ? 'dark' : 'light');
      }
    };
    
    handleChange();
    
    if (themeMode === 'light') setTheme('light');
    if (themeMode === 'dark') setTheme('dark');
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [themeMode]);

  // Apply actual theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(`themeMode_${userKey}`, themeMode);
  }, [theme, themeMode, userKey]);

  // Apply Accent Color to DOM
  useEffect(() => {
    localStorage.setItem(`accentColor_${userKey}`, accentColor);
  }, [accentColor, userKey]);

  // Apply Compact Mode to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
    localStorage.setItem(`compactMode_${userKey}`, String(compactMode));
  }, [compactMode, userKey]);

  const toggleTheme = () => {
    setThemeMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, themeMode, setThemeMode, toggleTheme, accentColor, setAccentColor, compactMode, setCompactMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

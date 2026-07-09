import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark' | 'system';
type AccentColor = 'orange' | 'blue' | 'emerald' | 'rose' | 'purple';

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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('themeMode') as ThemeMode) || 'system';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    return (localStorage.getItem('accentColor') as AccentColor) || 'orange';
  });

  const [compactMode, setCompactMode] = useState<boolean>(() => {
    return localStorage.getItem('compactMode') === 'true';
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
    localStorage.setItem('themeMode', themeMode);
  }, [theme, themeMode]);

  // Apply Accent Color to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    ['theme-orange', 'theme-blue', 'theme-emerald', 'theme-rose', 'theme-purple'].forEach(c => root.classList.remove(c));
    root.classList.add(`theme-${accentColor}`);
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  // Apply Compact Mode to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
    localStorage.setItem('compactMode', String(compactMode));
  }, [compactMode]);

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

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('dlmm-theme') as Theme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      setTheme(savedTheme);
    } else {
      // Default to dark theme as specified in requirements
      setTheme('dark');
    }
  }, []);

  // Apply theme to document root
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('dlmm-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
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

// Theme configuration object for easy access to theme values
export const themeConfig = {
  dark: {
    primary: '#1a1b23',
    accent: '#00d4aa',
    textPrimary: '#ffffff',
    textSecondary: '#a0a0a0',
    cardBackground: '#2a2b33',
    success: '#00d4aa',
    warning: '#ffa500',
    error: '#ff4444',
  },
  light: {
    primary: '#ffffff',
    accent: '#00d4aa',
    textPrimary: '#1a1b23',
    textSecondary: '#666666',
    cardBackground: '#f8f9fa',
    success: '#00d4aa',
    warning: '#ffa500',
    error: '#ff4444',
  },
};
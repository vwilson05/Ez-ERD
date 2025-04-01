'use client';

import { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ColorPalette, getDefaultTheme, getThemeById, themes } from '../utils/themes';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  currentTheme: ColorPalette;
  setTheme: (themeId: string) => void;
  availableThemes: ColorPalette[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [currentThemeId, setCurrentThemeId] = useState<string>('');
  
  useEffect(() => {
    // Initialize with system preference or stored preference
    const storedDarkMode = localStorage.getItem('darkMode');
    const storedThemeId = localStorage.getItem('themeId');
    
    if (storedDarkMode !== null) {
      setIsDarkMode(storedDarkMode === 'true');
    } else {
      // Use system preference as fallback
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPrefersDark);
    }
    
    if (storedThemeId) {
      setCurrentThemeId(storedThemeId);
    } else {
      // Set default based on dark/light mode
      const defaultTheme = getDefaultTheme(isDarkMode);
      setCurrentThemeId(defaultTheme.id);
    }
  }, []);
  
  // Apply dark mode to document when it changes
  useEffect(() => {
    const htmlElement = document.documentElement;
    
    if (isDarkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
    
    localStorage.setItem('darkMode', isDarkMode.toString());
  }, [isDarkMode]);
  
  // Get the current theme object
  const currentTheme = currentThemeId 
    ? getThemeById(currentThemeId) || getDefaultTheme(isDarkMode)
    : getDefaultTheme(isDarkMode);
  
  // Get available themes for the current mode
  const availableThemes = themes.filter(theme => theme.mode === (isDarkMode ? 'dark' : 'light'));
  
  // Apply theme CSS variables
  useEffect(() => {
    if (!currentTheme) return;
    
    const root = document.documentElement;
    Object.entries(currentTheme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    localStorage.setItem('themeId', currentTheme.id);
  }, [currentTheme]);
  
  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
    // Set default theme for the new mode
    const newDefaultTheme = getDefaultTheme(!isDarkMode);
    setCurrentThemeId(newDefaultTheme.id);
  };
  
  const setTheme = (themeId: string) => {
    const theme = getThemeById(themeId);
    if (theme && theme.mode === (isDarkMode ? 'dark' : 'light')) {
      setCurrentThemeId(themeId);
    }
  };
  
  return (
    <ThemeContext.Provider 
      value={{ 
        isDarkMode, 
        toggleDarkMode, 
        currentTheme, 
        setTheme,
        availableThemes
      }}
    >
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
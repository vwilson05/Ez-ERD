export interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
  };
  mode: 'light' | 'dark';
}

export const themes: ColorPalette[] = [
  // Light mode themes
  {
    id: 'light-default',
    name: 'Default Light',
    mode: 'light',
    colors: {
      primary: '#3b82f6', // blue-500
      secondary: '#10b981', // emerald-500
      accent: '#8b5cf6', // violet-500
      background: '#ffffff', // white
      surface: '#f3f4f6', // gray-100
      text: '#1f2937', // gray-800
    }
  },
  {
    id: 'light-teal',
    name: 'Teal Light',
    mode: 'light',
    colors: {
      primary: '#0d9488', // teal-600
      secondary: '#d946ef', // fuchsia-500
      accent: '#f59e0b', // amber-500
      background: '#ffffff', // white
      surface: '#f0fdfa', // teal-50
      text: '#134e4a', // teal-900
    }
  },
  {
    id: 'light-rose',
    name: 'Rose Light',
    mode: 'light',
    colors: {
      primary: '#e11d48', // rose-600
      secondary: '#0ea5e9', // sky-500
      accent: '#84cc16', // lime-500
      background: '#ffffff', // white
      surface: '#fff1f2', // rose-50
      text: '#881337', // rose-900
    }
  },
  
  // Dark mode themes
  {
    id: 'dark-default',
    name: 'Default Dark',
    mode: 'dark',
    colors: {
      primary: '#3b82f6', // blue-500
      secondary: '#10b981', // emerald-500
      accent: '#8b5cf6', // violet-500
      background: '#111827', // gray-900
      surface: '#1f2937', // gray-800
      text: '#f3f4f6', // gray-100
    }
  },
  {
    id: 'dark-purple',
    name: 'Purple Dark',
    mode: 'dark',
    colors: {
      primary: '#8b5cf6', // violet-500
      secondary: '#ec4899', // pink-500
      accent: '#f59e0b', // amber-500
      background: '#2e1065', // violet-950
      surface: '#4c1d95', // violet-900
      text: '#ede9fe', // violet-50
    }
  },
  {
    id: 'dark-cyan',
    name: 'Cyan Dark',
    mode: 'dark',
    colors: {
      primary: '#06b6d4', // cyan-500
      secondary: '#f43f5e', // rose-500
      accent: '#d97706', // amber-600
      background: '#083344', // cyan-950
      surface: '#155e75', // cyan-800
      text: '#ecfeff', // cyan-50
    }
  }
];

export function getDefaultTheme(isDarkMode: boolean): ColorPalette {
  return isDarkMode ? 
    themes.find(theme => theme.id === 'dark-default')! : 
    themes.find(theme => theme.id === 'light-default')!;
}

export function getThemeById(themeId: string): ColorPalette | undefined {
  return themes.find(theme => theme.id === themeId);
}

export function getThemesByMode(mode: 'light' | 'dark'): ColorPalette[] {
  return themes.filter(theme => theme.mode === mode);
} 
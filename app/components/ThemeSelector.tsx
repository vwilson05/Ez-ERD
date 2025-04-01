'use client';

import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeSelector() {
  const { isDarkMode, toggleDarkMode, currentTheme, setTheme, availableThemes } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 relative focus:outline-none"
        title="Change color theme"
      >
        <div className="w-5 h-5 rounded-full" style={{ backgroundColor: currentTheme.colors.primary }}></div>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1 border-b border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Theme Settings</p>
              <div className="mt-2 flex items-center">
                <label className="inline-flex items-center cursor-pointer">
                  <span className="mr-3 text-sm font-medium text-gray-600 dark:text-gray-400">
                    {isDarkMode ? 'Dark' : 'Light'}
                  </span>
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={isDarkMode} 
                      onChange={toggleDarkMode} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="py-2 px-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Color Palettes
            </p>
            <div className="grid grid-cols-3 gap-2">
              {availableThemes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => {
                    setTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`rounded-md p-2 flex flex-col items-center ${
                    currentTheme.id === theme.id ? 'ring-2 ring-primary' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  title={theme.name}
                >
                  <div className="flex space-x-1 mb-1">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.primary }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.secondary }}></div>
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: theme.colors.accent }}></div>
                  </div>
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate w-full text-center">
                    {theme.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
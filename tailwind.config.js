/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light: 'var(--color-primary)',
          dark: 'var(--color-primary)',
        },
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          light: 'var(--color-secondary)',
          dark: 'var(--color-secondary)',
        },
        accent: {
          DEFAULT: 'var(--color-accent)',
          light: 'var(--color-accent)',
          dark: 'var(--color-accent)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          light: 'var(--color-surface)',
          dark: 'var(--color-surface)'
        }
      }
    },
  },
  plugins: [],
} 
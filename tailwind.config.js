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
          light: '#4a86e8',
          DEFAULT: '#3b71ca',
          dark: '#2c5ba9'
        },
        background: {
          light: '#ffffff',
          dark: '#121212'
        },
        surface: {
          light: '#f5f5f5',
          dark: '#1e1e1e'
        }
      }
    },
  },
  plugins: [],
} 
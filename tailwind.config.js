/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        forgetica: ['"Sans Forgetica"', 'sans-serif'],
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      colors: {
        warmgray: {
          50: '#faf7f2',
          100: '#f5f0e8',
          200: '#e0d9cf',
          300: '#c4bbb0',
          400: '#a69d93',
          500: '#8a7e6e',
          600: '#6e6459',
          700: '#524a40',
          800: '#24211c',
          850: '#1f1c18',
          900: '#1a1714',
          950: '#110f0c',
        },
        amber: {
          accent: '#b8863a',
        },
      },
    },
  },
  plugins: [],
}

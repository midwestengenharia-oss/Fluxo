/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './index.tsx',
    './App.{ts,tsx,jsx,js}',
    './components/**/*.{ts,tsx,jsx,js}',
    './styles/**/*.{css,scss,ts}',
    './utils/**/*.{ts,tsx,jsx,js}',
    './types.ts'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

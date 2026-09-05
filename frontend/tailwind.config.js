/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        clinical: {
          50: '#f0f7f9',
          100: '#d9eef2',
          200: '#b8dee6',
          300: '#89c6d4',
          400: '#53a6bc',
          500: '#3589a1',
          600: '#2a6e84',
          700: '#26596b',
          800: '#244b59',
          900: '#22404b',
          950: '#122932',
        },
        navy: {
          800: '#111d2e',
          900: '#0b1320',
          950: '#070b13',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

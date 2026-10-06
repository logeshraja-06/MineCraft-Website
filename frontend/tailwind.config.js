/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          900: '#14532d',
        },
        orange: {
          400: '#faba7b',
          500: '#F28C0F',
          600: '#d97c0d',
        },
        portal: {
          dark: '#07080D',
          obsidian: '#0B0C14',
          card: '#0D0F18',
          border: 'rgba(168, 85, 247, 0.25)',
          purple: '#A855F7',
          violet: '#C084FC',
          neon: '#9333EA',
          deep: '#3B0764',
          creeper: '#22C55E',
        },
        cyber: {
          dark: '#07080D',
          card: '#0D0F18',
          border: 'rgba(168, 85, 247, 0.2)',
          neon: '#A855F7',
          accent: '#C084FC',
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'monospace', 'Consolas'],
        sans: ['Montserrat', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

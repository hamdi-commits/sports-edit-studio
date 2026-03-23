/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#7c3aed',
          pink:   '#ec4899',
          yellow: '#fbbf24',
          cyan:   '#06b6d4',
          dark:   '#0f0f1a',
        }
      },
      fontFamily: {
        display: ['system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}

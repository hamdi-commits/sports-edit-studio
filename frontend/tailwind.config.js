/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg:        '#080818',
        card:      '#0f0f28',
        card2:     '#161640',
        primary:   '#00ff87',
        secondary: '#00c8ff',
        accent:    '#ff3366',
        gold:      '#ffd700',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
    }
  },
  plugins: []
}

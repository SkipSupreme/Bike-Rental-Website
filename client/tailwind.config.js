/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bike-orange': '#FF6B35',
        'bike-dark': '#1A1A2E',
        'bike-blue': '#16213E',
        'bike-gray': '#0F3460',
        'bike-accent': '#E94560',
      },
      fontFamily: {
        'heading': ['Russo One', 'sans-serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

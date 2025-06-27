/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        'xl': '1200px', // Adjusted from default 1280px to match your screen size
        '2xl': '1400px', // Adjusted accordingly
      },
    },
  },
  plugins: [],
};

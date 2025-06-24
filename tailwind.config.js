/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // enables dark mode via .dark class
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#d0f0fd',
          DEFAULT: '#3aa9d6',
          dark: '#256b93',
        },
        accent: {
          light: '#fcefc7',
          DEFAULT: '#f4b400',
          dark: '#c28f00',
        },
        base: {
          light: '#ffffff',
          dark: '#1a1a1a',
        },
        text: {
          light: '#1a1a1a',
          dark: '#f1f1f1',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // enables dark mode via .dark class
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
        display: ['"DM Serif Display"', 'serif'],
        body: ['"Poppins"', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#d6e3fc',
          200: '#adc8f7',
          300: '#84aaf0',
          400: '#5a8ae9',
          500: '#326de2', // Updated for depth
          600: '#2755c7',
          700: '#1f41a0',
          800: '#1b3987',
          900: '#162e6f',
          DEFAULT: '#326de2',
          light: '#adc8f7',
          dark: '#1b3987',
        },
        accent: {
          50: '#fffdf3',
          100: '#fef9e7',
          200: '#fcf1c4',
          300: '#f9e08b',
          400: '#f6cb51',
          500: '#fcd34d', // ✨ primary gold — light and bright
          600: '#eab308', // deeper gold
          700: '#c28700', // warm gold accent
          DEFAULT: '#fcd34d',
          light: '#fcf1c4',
          dark: '#c28700',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          light: '#a7f3d0',
          DEFAULT: '#10b981',
          dark: '#059669',
        },
        base: {
          light: '#fefefe',
          dark: '#111827',
        },
        text: {
          light: '#1f2937',
          dark: '#f3f4f6',
        },
        surface: {
          light: '#f8fafc',
          dark: '#1e293b',
        },

        tiger: {
          500: '#e1b773',
          600: '#d97706',
          700: '#9a6728',
        },
        gold: {
          500: '#fcd34d',
        },
      }
    }
  },

  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
    function({ addUtilities }) {
      const newUtilities = {
        '.perspective': {
          perspective: '1000px',
        },
        '.preserve-3d': {
          transformStyle: 'preserve-3d',
        },
        '.backface-hidden': {
          backfaceVisibility: 'hidden',
          '-webkit-backface-visibility': 'hidden',
        },
        '.rotate-y-180': {
          transform: 'rotateY(180deg)',
        },
        '.origin-center': {
          transformOrigin: 'center center',
        },
      }
      addUtilities(newUtilities)
    }
  ],
  safelist: [
    'perspective',
    'preserve-3d',
    'backface-hidden',
    'rotate-y-180',
    'transform-gpu',
  ]
}

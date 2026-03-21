/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ono: {
          50:  '#f6f6f5',
          100: '#e9e9e8',
          200: '#d0d0ce',
          300: '#94b894',
          400: '#5a9e6e',
          500: '#3d7a52',
          600: '#2d6441',
          700: '#235233',
          800: '#1a3d27',
          900: '#122a1c',
          950: '#0b1c12',
        },
        night: {
          bg:     '#181818',
          card:   '#1f1f1f',
          card2:  '#232323',
          nav:    '#141414',
          border: '#2a2a2a',
          muted:  '#2d2d2d',
        },
      },
      boxShadow: {
        'ono':    '0 8px 32px rgba(45,100,65,0.08)',
        'ono-lg': '0 16px 48px rgba(45,100,65,0.12)',
        'glass':  '0 8px 32px rgba(0,0,0,0.10)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
      },
    },
  },
  plugins: [],
}

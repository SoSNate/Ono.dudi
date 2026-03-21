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
          50:  '#f8fbff',
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
      fontFamily: {
        sans: ['Heebo', '"Noto Sans Hebrew"', 'sans-serif'],
      },
      boxShadow: {
        'ono':       '0 8px 32px rgba(30,58,138,0.05)',
        'ono-lg':    '0 16px 48px rgba(30,58,138,0.08)',
        'glass':     '0 4px 24px rgba(30,58,138,0.06)',
        'glass-dark':'0 4px 24px rgba(15,23,42,0.22)',
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

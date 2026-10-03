/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warm: {
          50: '#FDFBF7',
          100: '#FAF8F5',
          200: '#F3EFEA',
          300: '#E8E2D9',
          400: '#D5CCC0',
          500: '#B0A391',
        },
        ink: {
          900: '#141416',
          800: '#1F2024',
          700: '#2E3038',
          600: '#525560',
          500: '#757989',
          400: '#9Ea3B2',
          300: '#D1D5E0',
        },
        accent: {
          DEFAULT: '#FF553E',
          hover: '#E5452F',
          soft: '#FFF0ED',
          border: '#FFD7D0',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.03)',
        'card': '0 8px 30px rgba(20, 20, 22, 0.06), 0 2px 8px rgba(20, 20, 22, 0.03)',
        'card-hover': '0 20px 40px rgba(20, 20, 22, 0.1), 0 4px 12px rgba(20, 20, 22, 0.04)',
        'vote': '0 12px 35px rgba(255, 85, 62, 0.28)',
      }
    },
  },
  plugins: [],
}

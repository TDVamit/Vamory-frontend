/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pink: '#ff1aff',
          blue: '#00e5ff',
          green: '#00ffa3',
          purple: '#a64dff',
          cyan: '#00ffff',
        },
        surface: {
          DEFAULT: '#000000',   // pure black
          alt: '#0f0f0f',       // very dark gray
          darker: '#050505',    // almost black
        },
        gray: {
          750: '#171717',
          850: '#0a0a0a',
          950: '#030303',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(0, 229, 255, 0.8)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 229, 255, 0.4)',
        'glow-pink': '0 0 20px rgba(255, 26, 255, 0.4)',
        'glow-green': '0 0 20px rgba(0, 255, 163, 0.4)',
        'glow-lg': '0 0 40px rgba(0, 229, 255, 0.3)',
      },
    },
  },
  plugins: [],
} 
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#722f37',
          dark: '#5a2229',
          light: '#8f3a45',
          50: '#fdf2f3',
          100: '#fce7e9',
          200: '#f9d0d4',
          300: '#f4aab2',
          400: '#ec7a87',
          500: '#e04d5f',
          600: '#cb2e42',
          700: '#ab2235',
          800: '#722f37',
          900: '#631f2c',
        },
        cream: {
          DEFAULT: '#EFDFBB',
          light: '#F5EDD8',
          dark: '#E8D4A0',
          50: '#fdfaf3',
          100: '#F5EDD8',
          200: '#EFDFBB',
          300: '#E8D4A0',
          400: '#ddc47f',
          500: '#d0b05e',
        },
        dark: {
          DEFAULT: '#1a0a0c',
          secondary: '#2d1219',
          text: '#3d1a20',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'count-up': 'countUp 2s ease-out',
        'gauge-fill': 'gaugeFill 1.5s ease-out',
        'fade-in-up': 'fadeInUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'pulse-ring': 'pulseRing 2s infinite',
        'shimmer': 'shimmer 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseRing: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-8px)' },
          '40%': { transform: 'translateX(8px)' },
          '60%': { transform: 'translateX(-6px)' },
          '80%': { transform: 'translateX(6px)' },
        },
      },
      boxShadow: {
        'card': '0 2px 8px rgba(26, 10, 12, 0.08)',
        'card-hover': '0 4px 16px rgba(26, 10, 12, 0.12)',
        'primary': '0 4px 14px rgba(114, 47, 55, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-red': '0 0 20px rgba(239, 68, 68, 0.3)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.3)',
      },
    },
  },
  plugins: [],
}

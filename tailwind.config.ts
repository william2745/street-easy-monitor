import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      colors: {
        warm: {
          50: '#FEFDFB',
          100: '#F8F6F3',
          200: '#F3F0EB',
          300: '#EDE9E3',
          400: '#E7E5E4',
          500: '#D6D3D1',
          600: '#A8A29E',
          700: '#78716C',
          800: '#44403C',
          900: '#1C1917',
        },
        brand: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          dark: '#1D4ED8',
          light: '#EFF6FF',
          medium: '#DBEAFE',
        },
      },
    },
  },
}

export default config

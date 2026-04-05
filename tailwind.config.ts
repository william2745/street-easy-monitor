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
        cream: {
          DEFAULT: '#FAF7F2',
          dark: '#F0EBE1',
        },
        sand: '#E8E0D5',
        warm: {
          DEFAULT: '#6B5E52',
          dark: '#2C2420',
        },
        accent: {
          DEFAULT: '#C4703A',
          dark: '#A85C2E',
          light: '#F5E8DC',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 4px rgba(44, 36, 32, 0.08), 0 0 0 1px rgba(44, 36, 32, 0.05)',
        'card-hover': '0 4px 16px rgba(44, 36, 32, 0.12), 0 0 0 1px rgba(44, 36, 32, 0.08)',
      },
    },
  },
}

export default config

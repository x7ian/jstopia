// tailwind.config.ts
import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import animate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: [
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#60a5fa',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow-sky': '0 18px 38px rgba(59,130,246,0.18)',
      },
    },
  },
  plugins: [forms, typography, animate],
} satisfies Config

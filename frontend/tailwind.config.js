import animate from 'tailwindcss-animate'

/*
 * Colour scales are driven by CSS variables (src/styles/palette.css, generated
 * by scripts/generate-palette.mjs). :root holds Tailwind's stock values; the
 * patient experience (html[data-audience='patient']) swaps in its own palette
 * without touching any component class names.
 */
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
const VAR_PALETTES = [
  'primary', 'blue', 'teal', 'sky', 'cyan', 'indigo', 'violet', 'purple',
  'emerald', 'green', 'amber', 'orange', 'yellow', 'rose', 'red', 'pink',
  'slate', 'gray', 'zinc', 'neutral',
]

const varScale = (name) =>
  Object.fromEntries(STEPS.map((step) => [step, `rgb(var(--c-${name}-${step}) / <alpha-value>)`]))

const varColors = Object.fromEntries(VAR_PALETTES.map((name) => [name, varScale(name)]))
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...varColors,
        background: token('app-bg'),
        muted: {
          DEFAULT: '#94a3b8',
          foreground: '#475569',
        },
        // Dark-mode surfaces (previously hard-coded hex values).
        night: {
          DEFAULT: token('night'),
          surface: token('night-surface'),
          elevated: token('night-elevated'),
          border: token('night-border'),
        },
        // Deep heading ink (previously hard-coded navy).
        navy: {
          DEFAULT: token('navy'),
          deep: token('navy-deep'),
        },
        success: {
          50: '#ecfdf3',
          500: '#16a34a',
          600: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#d97706',
          600: '#b45309',
        },
        danger: {
          50: '#fff1f2',
          500: '#e11d48',
          600: '#be123c',
        },
      },
      boxShadow: {
        soft: '0 10px 25px -15px rgba(13, 42, 74, 0.35)',
        lift: '0 1px 2px rgb(var(--shadow-tint) / 0.06), 0 12px 32px -18px rgb(var(--shadow-tint) / 0.28)',
      },
      spacing: {
        4.5: '1.125rem',
      },
      fontFamily: {
        sans: ['var(--app-font-sans)', 'Inter', 'Noto Sans Khmer', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--app-font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [animate],
}

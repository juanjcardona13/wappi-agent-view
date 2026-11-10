/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        elev: 'var(--bg-elev)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        accent: 'var(--accent)',
        clay: 'var(--clay)',
        wa: 'var(--wa)',
        box: 'var(--box)',
        brain: 'var(--brain)',
        danger: 'var(--danger)',
      },
      fontFamily: {
        serif: 'var(--serif)',
        sans: 'var(--sans)',
        mono: 'var(--mono)',
      },
      boxShadow: { card: 'var(--shadow)' },
    },
  },
  plugins: [],
};

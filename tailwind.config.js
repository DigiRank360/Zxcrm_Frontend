/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eef4ff', 100: '#dbe7ff', 200: '#bcd2ff', 500: '#3b6df0', 600: '#2f57d6', 700: '#2645b0', 800: '#1f388f', 900: '#172a6b' },
        sun: { 400: '#fbbf24', 500: '#f59e0b' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        soft: '0 1px 2px rgba(16,24,40,.04), 0 4px 16px rgba(16,24,40,.06)',
        lift: '0 12px 32px rgba(23,42,107,.14)',
        glow: '0 0 0 4px rgba(251,191,36,.25)',
      },
      keyframes: { float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } }, fadeUp: { '0%': { opacity: 0, transform: 'translateY(8px)' }, '100%': { opacity: 1, transform: 'none' } }, slideIn: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'none' } } },
      animation: { float: 'float 6s ease-in-out infinite', fadeUp: 'fadeUp .35s ease-out both', slideIn: 'slideIn .25s ease-out both' },
    },
  },
  plugins: [],
}

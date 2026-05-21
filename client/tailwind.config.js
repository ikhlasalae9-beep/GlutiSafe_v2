/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 28px rgba(45, 212, 191, 0.32)',
        phone: '0 28px 80px rgba(0, 0, 0, 0.45)',
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: '#D97773',
        'accent-light': '#FCE7E3',
        danger: '#B91C1C',
        'danger-light': '#FEE2E2',
        warning: '#C8953E',
        'warning-light': '#FDF3E3',
        success: '#2E7D32',
        'success-light': '#E8F5E9',
        bg: '#FFF7EE',
        'text-main': '#2B1A14',
        'text-sub': '#7a5c54',
        border: '#e8d5cf',
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2e83c2',
        'page-bg': '#d3e5f3',
        'text-primary': '#000000',
        'text-secondary': '#404040',
        'box-bg': '#ffffff',
      },
      fontFamily: {
        'sans': ['Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}


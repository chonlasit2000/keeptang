/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FBF3E7',
        coral: '#D85A30',
        income: '#1D9E75',
        incomeSoft: '#E1F5EE',
        expense: '#993C1D',
        expenseSoft: '#FBEAF0',
        ink: '#33251F',
        muted: '#8B7569',
        card: '#FFFFFF',
        amberSoft: '#FFE6A8',
        skySoft: '#DDEEFF',
        pinkSoft: '#FBDDE8',
        mintSoft: '#DDF2DD'
      },
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'Noto Sans Thai', 'sans-serif']
      },
      boxShadow: {
        soft: '0 14px 35px rgba(51, 37, 31, 0.08)'
      }
    }
  },
  plugins: []
};

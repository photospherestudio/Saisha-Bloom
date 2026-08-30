import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2B2A28',
        sprig: '#F2F5EE',
        moss: '#35513E',
        berry: '#C1587A',
        sunbeam: '#F0B429',
        dusk: '#6B5B7A',
      },
    },
  },
  plugins: [],
};

export default config;

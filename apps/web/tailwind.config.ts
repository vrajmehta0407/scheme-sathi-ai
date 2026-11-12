import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          DEFAULT: '#1479FF',
          50: '#EAF3FF',
          100: '#D1E5FF',
          500: '#1479FF',
          700: '#0B57C4',
        },
        yellow: {
          DEFAULT: '#FFC20E',
          50: '#FFF7DA',
          100: '#FFEBA6',
          500: '#FFC20E',
          700: '#D69E00',
        },
        green: {
          DEFAULT: '#12B76A',
          50: '#E3F8EE',
          100: '#BDEFD6',
          500: '#12B76A',
          700: '#0B8A50',
        },
        ink: '#0A1A3C',
        mist: '#F0F6FF',
      },
      fontFamily: {
        display: ['"Sora"', '"Noto Sans Devanagari"', '"Noto Sans Gujarati"', 'sans-serif'],
        sans: ['"Manrope"', '"Noto Sans Devanagari"', '"Noto Sans Gujarati"', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        chip: '12px',
        input: '20px',
        card: '26px',
        pill: '999px',
      },
      boxShadow: {
        glass: '0 10px 34px rgba(20,121,255,0.14), inset 0 1px 0 rgba(255,255,255,0.9)',
        'glass-hover': '0 18px 46px rgba(20,121,255,0.22), inset 0 1px 0 rgba(255,255,255,0.95)',
      },
    },
  },
  plugins: [],
};

export default config;


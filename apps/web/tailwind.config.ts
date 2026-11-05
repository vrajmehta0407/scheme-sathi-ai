import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FFF9F1',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#243047',
          light: '#334155',
          muted: '#687386',
        },
        primary: {
          DEFAULT: '#5B5FEF',
          hover: '#4C50DF',
          soft: 'rgba(91, 95, 239, 0.08)',
        },
        secondary: {
          DEFAULT: '#16A085',
          hover: '#138D75',
          soft: 'rgba(22, 160, 133, 0.08)',
        },
        accent: {
          coral: '#FF806E',
          'coral-soft': 'rgba(255, 128, 110, 0.12)',
          mango: '#FFC857',
          'mango-soft': 'rgba(255, 200, 87, 0.15)',
          sky: '#8CCBFF',
          'sky-soft': 'rgba(140, 203, 255, 0.15)',
          lavender: '#C7B8FF',
          'lavender-soft': 'rgba(199, 184, 255, 0.18)',
        },
        status: {
          success: '#238B65',
          'success-soft': 'rgba(35, 139, 101, 0.12)',
          caution: '#B7791F',
          'caution-soft': 'rgba(183, 121, 31, 0.12)',
          error: '#C44545',
          'error-soft': 'rgba(196, 69, 69, 0.12)',
        },
        editorial: {
          border: 'rgba(36, 48, 71, 0.10)',
          'border-hover': 'rgba(36, 48, 71, 0.20)',
          glass: 'rgba(255, 255, 255, 0.72)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Shruti', 'Gujarati Sangam MN', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'editorial': '24px',
        'editorial-sm': '16px',
        'editorial-lg': '32px',
      },
      boxShadow: {
        'paper': '0 4px 20px -2px rgba(36, 48, 71, 0.05), 0 2px 6px -1px rgba(36, 48, 71, 0.03)',
        'paper-hover': '0 12px 30px -4px rgba(36, 48, 71, 0.10), 0 4px 10px -2px rgba(36, 48, 71, 0.04)',
        'glass': '0 8px 32px 0 rgba(36, 48, 71, 0.06)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'float-slow': 'float 5s ease-in-out infinite',
        'float-medium': 'float 3.5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};

export default config;

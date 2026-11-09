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
        canvas: '#FFFDF9',
        surface: '#FFFFFF',
        ink: {
          DEFAULT: '#141D2E',
          light: '#28374F',
          muted: '#52627A',
        },
        primary: {
          DEFAULT: '#5457EB',
          hover: '#4346E0',
          soft: 'rgba(84, 87, 235, 0.09)',
          glow: 'rgba(84, 87, 235, 0.35)',
        },
        secondary: {
          DEFAULT: '#0EA584',
          hover: '#0C8F72',
          soft: 'rgba(14, 165, 132, 0.09)',
          glow: 'rgba(14, 165, 132, 0.35)',
        },
        radiant: {
          indigo: '#6366F1',
          violet: '#8B5CF6',
          emerald: '#10B981',
          amber: '#F59E0B',
          coral: '#F43F5E',
          cyan: '#06B6D4',
          fuchsia: '#D946EF',
        },
        accent: {
          coral: '#FF6B6B',
          'coral-soft': 'rgba(255, 107, 107, 0.12)',
          mango: '#FFAA00',
          'mango-soft': 'rgba(255, 170, 0, 0.14)',
          sky: '#38BDF8',
          'sky-soft': 'rgba(56, 189, 248, 0.14)',
          lavender: '#C084FC',
          'lavender-soft': 'rgba(192, 132, 252, 0.16)',
        },
        status: {
          success: '#10B981',
          'success-soft': 'rgba(16, 185, 129, 0.12)',
          caution: '#F59E0B',
          'caution-soft': 'rgba(245, 158, 11, 0.12)',
          error: '#EF4444',
          'error-soft': 'rgba(239, 68, 68, 0.12)',
        },
        editorial: {
          border: 'rgba(20, 29, 46, 0.08)',
          'border-hover': 'rgba(84, 87, 235, 0.28)',
          glass: 'rgba(255, 255, 255, 0.82)',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'Shruti', 'Gujarati Sangam MN', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'editorial': '28px',
        'editorial-sm': '16px',
        'editorial-lg': '36px',
      },
      boxShadow: {
        'paper': '0 8px 30px -4px rgba(20, 29, 46, 0.05), 0 2px 6px -1px rgba(20, 29, 46, 0.02)',
        'paper-hover': '0 24px 50px -10px rgba(84, 87, 235, 0.14), 0 8px 16px -4px rgba(20, 29, 46, 0.04)',
        'hologram': '0 20px 50px -10px rgba(99, 102, 241, 0.28), 0 0 25px rgba(6, 182, 212, 0.18)',
        'glass': '0 12px 36px 0 rgba(20, 29, 46, 0.06)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(1.5deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.06)' },
        },
        gradientMove: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        }
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-medium': 'float 4.2s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 5s ease-in-out infinite',
        'gradient-flow': 'gradientMove 8s ease infinite',
      }
    },
  },
  plugins: [],
};

export default config;

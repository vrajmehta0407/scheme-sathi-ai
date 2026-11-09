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
        canvas: '#FAF7F2', // Editorial Warm Cream Canvas
        surface: '#FFFFFF',
        cream: {
          DEFAULT: '#FAF7F2',
          light: '#FFFDF9',
          warm: '#F5ECE1',
          biscuit: '#EFE3D3',
        },
        navy: {
          DEFAULT: '#0B192C', // Deep Luxury Midnight Navy
          deep: '#060E18',
          light: '#1E3E62',
          slate: '#2B4865',
          muted: '#4E6178',
          soft: 'rgba(11, 25, 44, 0.08)',
          glow: 'rgba(11, 25, 44, 0.35)',
        },
        coral: {
          DEFAULT: '#FF6542', // Luminous Sunset Coral
          hover: '#E8502D',
          light: '#FF876C',
          rose: '#F43F5E',
          soft: 'rgba(255, 101, 66, 0.12)',
          glow: 'rgba(255, 101, 66, 0.40)',
        },
        ink: {
          DEFAULT: '#0B192C', // Navy as primary ink
          light: '#1E3E62',
          muted: '#52667E',
        },
        primary: {
          DEFAULT: '#0B192C', // Luxury Navy
          hover: '#1E3E62',
          soft: 'rgba(11, 25, 44, 0.08)',
          glow: 'rgba(11, 25, 44, 0.35)',
        },
        secondary: {
          DEFAULT: '#FF6542', // Electric Coral
          hover: '#E8502D',
          soft: 'rgba(255, 101, 66, 0.12)',
          glow: 'rgba(255, 101, 66, 0.40)',
        },
        radiant: {
          navy: '#0B192C',
          coral: '#FF6542',
          amber: '#F59E0B',
          teal: '#134E4A',
          rose: '#FF7E67',
          terracotta: '#E05A47',
          cream: '#FAF7F2',
        },
        accent: {
          coral: '#FF6542',
          'coral-soft': 'rgba(255, 101, 66, 0.12)',
          navy: '#0B192C',
          'navy-soft': 'rgba(11, 25, 44, 0.08)',
          mango: '#F59E0B',
          'mango-soft': 'rgba(245, 158, 11, 0.12)',
          sky: '#38BDF8',
          'sky-soft': 'rgba(56, 189, 248, 0.12)',
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
          border: 'rgba(11, 25, 44, 0.09)',
          'border-hover': 'rgba(255, 101, 66, 0.35)',
          glass: 'rgba(250, 247, 242, 0.88)',
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
        'paper': '0 8px 30px -4px rgba(11, 25, 44, 0.06), 0 2px 6px -1px rgba(11, 25, 44, 0.03)',
        'paper-hover': '0 24px 50px -10px rgba(11, 25, 44, 0.14), 0 8px 24px -4px rgba(255, 101, 66, 0.22)',
        'glow-coral': '0 10px 32px -4px rgba(255, 101, 66, 0.45)',
        'glow-navy': '0 10px 32px -4px rgba(11, 25, 44, 0.35)',
        'hologram': '0 20px 50px -10px rgba(11, 25, 44, 0.25), 0 0 25px rgba(255, 101, 66, 0.25)',
        'glass': '0 12px 36px 0 rgba(11, 25, 44, 0.08)',
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

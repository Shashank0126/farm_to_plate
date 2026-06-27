/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50:  '#fdf8f0',
          100: '#faecd8',
          200: '#f5d5a8',
          300: '#eeb96e',
          400: '#e69332',
          500: '#d97316',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        },
        glass: {
          white: 'rgba(255,255,255,0.08)',
          border: 'rgba(255,255,255,0.12)',
          hover:  'rgba(255,255,255,0.14)',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'farm-gradient': 'linear-gradient(135deg, #052e16 0%, #14532d 30%, #1a3a2a 60%, #0f2218 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
        'green-glow':    'radial-gradient(ellipse at top, #16a34a22 0%, transparent 60%)',
      },
      boxShadow: {
        glass:  '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
        glow:   '0 0 24px rgba(34,197,94,0.25)',
        card:   '0 4px 24px rgba(0,0,0,0.4)',
      },
      animation: {
        'fade-in':     'fadeIn 0.5s ease forwards',
        'slide-up':    'slideUp 0.4s ease forwards',
        'pulse-glow':  'pulseGlow 2s ease-in-out infinite',
        'spin-slow':   'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:     { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:    { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseGlow:  { '0%,100%': { boxShadow: '0 0 12px rgba(34,197,94,0.2)' }, '50%': { boxShadow: '0 0 28px rgba(34,197,94,0.5)' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
}

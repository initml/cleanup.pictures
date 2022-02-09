module.exports = {
  mode: 'jit',
  theme: {
    extend: {
      fontFamily: {
        varent: ['VarentGrotesk', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 0.7s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in-up': 'slide-in-up 0.25s cubic-bezier(.01,.77,.35,.98)',
      },
      colors: {
        primary: '#BDFF01',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 0.8 },
          '50%': { opacity: 0.7 },
        },
        'slide-in-up': {
          '0%': { opacity: 0, transform: 'translateY(-100px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
      width: {
        90: '22.5rem',
      },
    },
  },
  variants: {},
  plugins: [],
  purge: {
    // Filenames to scan for classes
    content: [
      './src/**/*.html',
      './src/**/*.js',
      './src/**/*.jsx',
      './src/**/*.ts',
      './src/**/*.tsx',
      './public/index.html',
    ],
    // Options passed to PurgeCSS
    options: {
      // Whitelist specific selectors by name
      // safelist: [],
    },
  },
}

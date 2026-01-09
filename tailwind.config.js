/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    // Custom breakpoints following mobile-first approach
    screens: {
      'mobile': '320px',
      'tablet': '768px', 
      'desktop': '1024px',
      'large-desktop': '1440px',
    },
    extend: {
      colors: {
        brand: {
          50: 'var(--mantine-primary-color-0)',
          100: 'var(--mantine-primary-color-1)',
          200: 'var(--mantine-primary-color-2)',
          300: 'var(--mantine-primary-color-3)',
          400: 'var(--mantine-primary-color-4)',
          500: 'var(--mantine-primary-color-6)', // Primary
          600: 'var(--mantine-primary-color-7)',
          700: 'var(--mantine-primary-color-8)',
          800: 'var(--mantine-primary-color-9)',
          900: 'var(--mantine-primary-color-9)',
        }
      },
      // Responsive spacing system
      spacing: {
        'responsive-xs': 'var(--spacing-responsive-xs)',
        'responsive-sm': 'var(--spacing-responsive-sm)',
        'responsive-md': 'var(--spacing-responsive-md)',
        'responsive-lg': 'var(--spacing-responsive-lg)',
        'responsive-xl': 'var(--spacing-responsive-xl)',
      },
      // Responsive font sizes
      fontSize: {
        'responsive-xs': 'var(--font-size-responsive-xs)',
        'responsive-sm': 'var(--font-size-responsive-sm)',
        'responsive-base': 'var(--font-size-responsive-base)',
        'responsive-lg': 'var(--font-size-responsive-lg)',
        'responsive-xl': 'var(--font-size-responsive-xl)',
        'responsive-2xl': 'var(--font-size-responsive-2xl)',
      },
      // Touch target sizes
      minHeight: {
        'touch-target': '44px',
      },
      minWidth: {
        'touch-target': '44px',
      },
      // Container max widths for each breakpoint
      maxWidth: {
        'mobile': '100%',
        'tablet': '768px',
        'desktop': '1024px',
        'large-desktop': '1440px',
      }
    }
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}

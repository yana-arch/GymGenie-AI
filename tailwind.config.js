/** @type {import('tailwindcss').Config} */
export default {
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
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          900: '#1e3a8a',
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
}
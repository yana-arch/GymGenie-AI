import { createTheme, MantineThemeOverride, MantineTheme } from '@mantine/core';
  import { brandColors } from './colors';
  
  export const theme: MantineThemeOverride = createTheme({
    primaryColor: 'brand',
    colors: {
      brand: brandColors,
    },
    defaultRadius: 'md',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    lineHeights: {
      xs: '1.4',
      sm: '1.45',
      md: '1.5',
      lg: '1.6',
      xl: '1.6',
    },
    headings: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontWeight: '900',
      sizes: {
        h1: { fontSize: '2.5rem', lineHeight: '1.1' },
        h2: { fontSize: '2rem', lineHeight: '1.2' },
      },
    },
    other: {
      transitions: {
        short: '150ms',
        standard: '300ms',
        long: '500ms',
        spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      },
      zIndices: {
        background: -1,
        hud: 500,
        progress: 600,
        modal: 1000,
        overlay: 1100,
        toast: 2000,
      },
    },
    components: {
      Button: {
        defaultProps: {
          radius: 'md',
        },
        styles: {
          root: {
            fontWeight: 700,
            letterSpacing: '0.5px',
            transition: 'transform 150ms ease, box-shadow 300ms ease, background-color 300ms ease',
            '&:active': {
              transform: 'scale(0.96)',
            },
            '&:hover': {
              boxShadow: '0 0 15px var(--mantine-primary-color-light-hover)',
            },
          },
        },
      },
      Card: {
        defaultProps: {
          radius: 'xl',
          withBorder: true,
        },
        styles: (theme: MantineTheme) => ({
          root: {
            backgroundColor: 'light-dark(rgba(255, 255, 255, 0.8), rgba(17, 24, 39, 0.7))',
            backgroundImage: 'light-dark(linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 100%), none)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            transition: 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 300ms ease, border-color 300ms ease',
            borderColor: 'light-dark(var(--mantine-primary-color-light), rgba(255, 255, 255, 0.1))',
            '&:hover': {
              transform: 'translateY(-8px) scale(1.01)',
              boxShadow: 'light-dark(0 20px 40px -15px var(--mantine-primary-color-light), 0 20px 40px -15px var(--mantine-primary-color-light-hover))',
              borderColor: 'var(--mantine-primary-color-filled)',
            },
          },
        }),
      },
      Paper: {
        defaultProps: {
          radius: 'xl',
        },
        styles: {
          root: {
            transition: 'transform 300ms cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 300ms ease, border-color 300ms ease',
            backgroundColor: 'light-dark(rgba(255, 255, 255, 0.8), rgba(17, 24, 39, 0.7))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderColor: 'light-dark(var(--mantine-primary-color-light), rgba(255, 255, 255, 0.1))',
            '&[data-with-border]:hover': {
              borderColor: 'var(--mantine-primary-color-filled)',
              boxShadow: 'light-dark(0 10px 30px -10px var(--mantine-primary-color-light), 0 10px 30px -10px var(--mantine-primary-color-light-hover))',
              transform: 'translateY(-4px)',
            },
          },
        },
      },
      Tabs: {
        styles: {
          tab: {
            fontWeight: 600,
          },
          panel: {
            backgroundColor: 'transparent',
          },
        },
      },
      Input: {
        defaultProps: {
          radius: 'md',
        },
      },
    },
  });

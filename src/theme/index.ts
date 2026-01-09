import { createTheme, MantineThemeOverride, MantineTheme } from '@mantine/core';
  import { brandColors } from './colors';
  
  export const theme: MantineThemeOverride = createTheme({
    primaryColor: 'brand',
    colors: {
      brand: brandColors,
    },
    defaultRadius: 'md',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    headings: {
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontWeight: '700',
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
            transition: 'transform 0.1s ease, box-shadow 0.2s ease, background-color 0.2s ease',
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
            backgroundColor: 'color-mix(in srgb, var(--mantine-color-body), var(--mantine-primary-color-filled) 2%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s ease, border-color 0.3s ease',
            borderColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              transform: 'translateY(-8px) scale(1.01)',
              boxShadow: '0 20px 40px -15px var(--mantine-primary-color-light-hover)',
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
            transition: 'all 0.3s ease',
            backgroundColor: 'color-mix(in srgb, var(--mantine-color-body), var(--mantine-primary-color-filled) 1%)',
            '&[data-with-border]:hover': {
              borderColor: 'var(--mantine-primary-color-filled)',
              boxShadow: '0 10px 30px -10px var(--mantine-primary-color-light-hover)',
            },
          },
        },
      },
      Tabs: {
        styles: {
          tab: {
            fontWeight: 600,
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
  
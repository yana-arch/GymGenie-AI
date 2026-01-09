import React from 'react';
import { Group, ColorSwatch, Text, Paper, Stack, useMantineTheme } from '@mantine/core';
import { useApp } from '@/context/AppContext';

import { brandColors } from './colors';

const THEME_OPTIONS = [
  { label: 'Brand', color: 'brand', value: brandColors[5] },
  { label: 'Classic', color: 'blue', value: '#228be6' },
  { label: 'Energy', color: 'lime', value: '#82c91e' },
  { label: 'Power', color: 'red', value: '#fa5252' },
  { label: 'Premium', color: 'grape', value: '#be4bdb' },
];

export const ThemeCustomizer: React.FC = () => {
  const { themeColor, setThemeColor } = useApp();
  const theme = useMantineTheme();

  return (
    <Paper p="md" withBorder radius="lg">
      <Stack gap="xs">
        <Text size="sm" fw={700}>Select Your Vibe</Text>
        <Group gap="xs">
          {THEME_OPTIONS.map((option) => (
            <Stack key={option.color} align="center" gap={4}>
              <ColorSwatch
                color={option.color === 'brand' ? option.value : theme.colors[option.color][6]}
                onClick={() => setThemeColor(option.color)}
                style={{ 
                  cursor: 'pointer', 
                  border: themeColor === option.color ? '3px solid var(--mantine-color-text)' : 'none',
                  transform: themeColor === option.color ? 'scale(1.2)' : 'scale(1)',
                  boxShadow: themeColor === option.color ? `0 0 15px ${option.value}88` : 'none',
                  transition: 'all 0.2s ease'
                }}
                size={32}
              >
                {themeColor === option.color && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white' }} />
                )}
              </ColorSwatch>
              <Text size="xs">{option.label}</Text>
            </Stack>
          ))}
        </Group>
      </Stack>
    </Paper>
  );
};

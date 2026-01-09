import React from 'react';
import { Group, ColorSwatch, Text, Paper, Stack, useMantineTheme } from '@mantine/core';
import { useApp } from '@/context/AppContext';

import { brandColors, vibeColors } from './colors';

const THEME_OPTIONS = [
  { label: 'Brand', color: 'brand', value: brandColors[5] },
  { label: 'Classic', color: 'blue', value: vibeColors.blue },
  { label: 'Energy', color: 'lime', value: vibeColors.lime },
  { label: 'Power', color: 'red', value: vibeColors.red },
  { label: 'Premium', color: 'grape', value: vibeColors.grape },
];

export const ThemeCustomizer: React.FC = () => {
  const { themeColor, setThemeColor } = useApp();
  const theme = useMantineTheme();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
      <Stack gap="xs">
        <Text size="sm" fw={700} className="dark:text-white">Select Your Vibe</Text>
        <Group gap="xs">
          {THEME_OPTIONS.map((option) => (
            <Stack key={option.color} align="center" gap={4}>
              <ColorSwatch
                color={option.color === 'brand' ? option.value : theme.colors[option.color][6]}
                onClick={() => setThemeColor(option.color)}
                style={{ 
                  cursor: 'pointer', 
                  border: themeColor === option.color ? '3px solid var(--mantine-color-text)' : 'none',
                  transform: themeColor === option.color ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: themeColor === option.color ? `0 8px 20px -5px ${option.value}aa` : 'none',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                size={36}
              >
                {themeColor === option.color && (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'white', boxShadow: '0 0 5px rgba(0,0,0,0.2)' }} />
                )}
              </ColorSwatch>
              <Text size="xs" fw={themeColor === option.color ? 700 : 500} className="dark:text-gray-400">{option.label}</Text>
            </Stack>
          ))}
        </Group>
      </Stack>
    </div>
  );
};

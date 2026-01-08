import React from 'react';
import { Paper, Group, Text, ThemeIcon } from '@mantine/core';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => (
  <Paper withBorder p="md" radius="md" shadow="xs">
    <Group justify="space-between">
      <div>
        <Text size="xs" c="dimmed" fw={700} tt="uppercase">
          {title}
        </Text>
        <Text fw={700} size="xl">
          {value}
        </Text>
      </div>
      <ThemeIcon color={color} variant="light" size={38} radius="md">
        {icon}
      </ThemeIcon>
    </Group>
  </Paper>
);

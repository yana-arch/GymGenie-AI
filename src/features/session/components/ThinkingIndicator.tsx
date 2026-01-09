import React from 'react';
import { Text, Group, Loader, Stack, Paper, Transition } from '@mantine/core';
import { Brain } from 'lucide-react';

interface ThinkingIndicatorProps {
  visible: boolean;
}

/**
 * ThinkingIndicator Component
 * Displays an "AI is thinking" state with motion effects.
 */
export const ThinkingIndicator: React.FC<ThinkingIndicatorProps> = ({ visible }) => {
  return (
    <Transition mounted={visible} transition="fade" duration={400}>
      {(styles) => (
        <Paper 
          style={{ ...styles, position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}
          p="md" 
          radius="xl" 
          withBorder 
          shadow="xl"
          bg="var(--mantine-color-blue-light)"
          role="status"
          aria-busy="true"
        >
          <Group gap="md">
            <Loader size="sm" color="blue" type="bars" />
            <Stack gap={0}>
              <Group gap="xs">
                <Brain size={16} className="text-blue-600" />
                <Text fw={700} size="sm">AI is analyzing</Text>
              </Group>
              <Text size="xs" c="dimmed">Optimizing your workout...</Text>
            </Stack>
          </Group>
        </Paper>
      )}
    </Transition>
  );
};

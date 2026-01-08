import React, { useEffect, useState } from 'react';
import { Paper, Text, RingProgress, Group, Stack } from '@mantine/core';
import { Timer } from 'lucide-react';

interface TransitionPrepProps {
  nextExercise: string;
  secondsRemaining: number;
}

const TransitionPrep: React.FC<TransitionPrepProps> = ({ nextExercise, secondsRemaining }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Assuming 5 second prep window
    setProgress((secondsRemaining / 5) * 100);
  }, [secondsRemaining]);

  if (secondsRemaining <= 0) return null;

  return (
    <Paper
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1100,
        width: '300px'
      }}
      shadow="xl"
      p="xl"
      radius="lg"
      withBorder
    >
      <Stack align="center" gap="md">
        <RingProgress
          size={120}
          roundCaps
          thickness={8}
          sections={[{ value: progress, color: 'brand' }]}
          label={
            <Text fw={700} ta="center" size="xl">
              {secondsRemaining}s
            </Text>
          }
        />
        
        <Stack gap={0} align="center">
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>Next Up</Text>
          <Text size="xl" fw={800} ta="center">{nextExercise}</Text>
        </Stack>

        <Group gap="xs">
          <Timer size={16} />
          <Text size="sm">Get ready to transition</Text>
        </Group>
      </Stack>
    </Paper>
  );
};

export default TransitionPrep;

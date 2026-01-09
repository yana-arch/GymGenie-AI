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
        width: '320px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        color: 'white'
      }}
      shadow="xl"
      p="xl"
      radius="2.5rem"
      withBorder
    >
      <Stack align="center" gap="md">
        <RingProgress
          size={140}
          roundCaps
          thickness={12}
          sections={[{ value: progress, color: 'brand' }]}
          label={
            <Text fw={900} ta="center" size="32px" c="white">
              {secondsRemaining}s
            </Text>
          }
        />
        
        <Stack gap={0} align="center">
          <Text size="xs" c="white" style={{ opacity: 0.6, letterSpacing: '1px' }} tt="uppercase" fw={800}>Next Up</Text>
          <Text size="24px" fw={900} ta="center" c="white">{nextExercise}</Text>
        </Stack>

        <Group gap="xs">
          <Timer size={16} color="white" />
          <Text size="sm" c="white" fw={500}>Get ready to transition</Text>
        </Group>
      </Stack>
    </Paper>
  );
};

export default TransitionPrep;

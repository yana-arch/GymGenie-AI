import React, { useEffect, useState } from 'react';
import { Paper, Text, Transition, Group } from '@mantine/core';
import { Trophy } from 'lucide-react';

interface MilestoneCelebrationProps {
  milestones: number[];
}

const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({ milestones }) => {
  const [currentMilestone, setCurrentMilestone] = useState<number | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (milestones.length > 0) {
      const latest = milestones[milestones.length - 1];
      setCurrentMilestone(latest);
      setOpened(true);

      const timer = setTimeout(() => {
        setOpened(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [milestones]);

  return (
    <Transition mounted={opened} transition="slide-up" duration={400} timingFunction="ease">
      {(styles: React.CSSProperties) => (
        <Paper
          style={{
            ...styles,
            position: 'fixed',
            bottom: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            pointerEvents: 'none'
          }}
          shadow="xl"
          p="md"
          radius="md"
          bg="blue.6" // Changed from brand.6 to blue.6 as brand might not be defined in Mantine theme yet
          c="white"
        >
          <Group gap="xs">
            <Trophy size={24} />
            <Text fw={700} size="lg">
              {currentMilestone}% Complete!
            </Text>
          </Group>
          <Text size="sm">Great job, keep pushing!</Text>
        </Paper>
      )}
    </Transition>
  );
};

export default MilestoneCelebration;

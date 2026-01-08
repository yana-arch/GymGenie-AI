import React, { useEffect, useState } from 'react';
import { Paper, Text, Transition, Group, Box } from '@mantine/core';
import { keyframes } from '@emotion/react';
import { Trophy, Star, Zap, Activity } from 'lucide-react';
import { Milestone } from '../services/MilestoneService';

interface MilestoneCelebrationProps {
  milestones: Milestone[];
}

const popIn = keyframes`
  0% { transform: scale(0.8) translateY(20px); opacity: 0; }
  50% { transform: scale(1.1) translateY(-10px); }
  100% { transform: scale(1) translateY(0); opacity: 1; }
`;

const MilestoneCelebration: React.FC<MilestoneCelebrationProps> = ({ milestones }) => {
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (milestones.length > 0) {
      const latest = milestones[milestones.length - 1];
      setCurrentMilestone(latest);
      setOpened(true);

      const timer = setTimeout(() => {
        setOpened(false);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [milestones]);

  if (!currentMilestone) return null;

  const getCelebrationStyles = () => {
    switch (currentMilestone.type) {
      case 'PROGRESS':
        return {
          bg: 'blue.6',
          icon: <Activity size={24} />,
          title: 'Progress Milestone!'
        };
      case 'PERSONAL_BEST':
        return {
          bg: 'orange.6',
          icon: <Trophy size={24} />,
          title: 'New Personal Best!'
        };
      case 'STREAK':
        return {
          bg: 'green.6',
          icon: <Zap size={24} />,
          title: 'Form Streak!'
        };
      case 'VOLUME':
        return {
          bg: 'grape.6',
          icon: <Star size={24} />,
          title: 'Volume Beast!'
        };
      default:
        return {
          bg: 'blue.6',
          icon: <Trophy size={24} />,
          title: 'Milestone Reached!'
        };
    }
  };

  const { bg, icon, title } = getCelebrationStyles();

  return (
    <Transition mounted={opened} transition="slide-up" duration={400} timingFunction="ease">
      {(styles: React.CSSProperties) => (
        <Paper
          style={{
            ...styles,
            position: 'fixed',
            bottom: '25%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            pointerEvents: 'none',
            animation: `${popIn} 0.5s ease-out`
          }}
          shadow="xl"
          p="xl"
          radius="lg"
          bg={bg}
          c="white"
        >
          <Group gap="md">
            <Box style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '8px', 
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {icon}
            </Box>
            <Box>
              <Text fw={800} size="xl" style={{ lineHeight: 1.2 }}>
                {title}
              </Text>
              <Text fw={600} size="md">
                {currentMilestone.label}
              </Text>
            </Box>
          </Group>
          
          {/* Simple CSS Particle Effect for Major Milestones */}
          {(currentMilestone.value === 100 || currentMilestone.type === 'PERSONAL_BEST') && (
            <Box style={{
              position: 'absolute',
              top: '-20px',
              left: '50%',
              transform: 'translateX(-50%)',
              whiteSpace: 'nowrap'
            }}>
              <Text size="xl">🎉✨🎊🌟🎊✨🎉</Text>
            </Box>
          )}
        </Paper>
      )}
    </Transition>
  );
};

export default MilestoneCelebration;

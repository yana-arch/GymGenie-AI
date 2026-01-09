import React from 'react';
import { Box, Image, ActionIcon } from '@mantine/core';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ExerciseGuideProps {
  gifUrl: string | null;
  exerciseName: string;
  isMinimized: boolean;
  onToggle: () => void;
}

const ExerciseGuide: React.FC<ExerciseGuideProps> = ({ gifUrl, exerciseName, isMinimized, onToggle }) => {
  if (!gifUrl) return null;

  return (
    <Box
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        borderRadius: '24px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        transition: 'all 0.3s ease',
        height: isMinimized ? '48px' : '240px',
      }}
    >
      <Box style={{ padding: '8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isMinimized ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
        <span style={{ fontSize: '10px', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {isMinimized ? `${exerciseName} Guide` : 'Exercise Form Guide'}
        </span>
        <ActionIcon variant="transparent" onClick={onToggle} color="gray" size="sm">
          {isMinimized ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </ActionIcon>
      </Box>
      
      {!isMinimized && (
        <Box style={{ padding: '12px', height: '192px' }}>
          <Image
            src={gifUrl}
            alt={exerciseName}
            radius="xl"
            h="100%"
            w="100%"
            fit="contain"
            style={{ background: 'rgba(0,0,0,0.2)' }}
          />
        </Box>
      )}
    </Box>
  );
};

export default ExerciseGuide;

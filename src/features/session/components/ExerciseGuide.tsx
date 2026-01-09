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
        maxWidth: 'clamp(320px, 80vw, 600px)',
        margin: '0 auto',
        borderRadius: '32px',
        overflow: 'hidden',
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
        maxHeight: isMinimized ? '56px' : '500px',
        height: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        willChange: 'max-height, transform'
      }}
    >
      <Box style={{ padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: isMinimized ? 'none' : '1px solid rgba(255,255,255,0.05)', height: '56px' }}>
        <span style={{ fontSize: 'clamp(10px, 1.2vw, 12px)', fontWeight: 900, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          {isMinimized ? `${exerciseName} Guide` : 'AI Form Intelligence'}
        </span>
        <ActionIcon variant="light" onClick={onToggle} color="gray" size="md" radius="xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
          {isMinimized ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </ActionIcon>
      </Box>
      
      <Box style={{ 
        padding: '20px', 
        opacity: isMinimized ? 0 : 1,
        transform: isMinimized ? 'translateY(-10px)' : 'translateY(0)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        display: isMinimized ? 'none' : 'block'
      }}>
        <Image
          src={gifUrl}
          alt={exerciseName}
          radius="24px"
          h="clamp(200px, 35vh, 400px)"
          w="100%"
          fit="contain"
          style={{ background: 'rgba(0,0,0,0.3)', padding: '10px' }}
        />
      </Box>
    </Box>
  );
};

export default ExerciseGuide;

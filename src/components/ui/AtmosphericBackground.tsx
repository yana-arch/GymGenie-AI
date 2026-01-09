import React from 'react';
import { Box } from '@mantine/core';

interface AtmosphericBackgroundProps {
  intensity?: number; // 0 to 1
}

const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({ intensity = 0.5 }) => {
  // Calculate animation duration based on intensity
  const duration1 = 20 / (intensity + 0.1);
  const duration2 = 30 / (intensity + 0.1);

  return (
    <Box
      data-testid="atmospheric-background"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: 'var(--mantine-color-dark-9)',
      }}
    >
      <style>
        {`
          @keyframes float1 {
            0% { transform: scale(1) translate(0, 0); opacity: 0.3; }
            50% { transform: scale(1.2) translate(50px, -50px); opacity: 0.5; }
            100% { transform: scale(1) translate(0, 0); opacity: 0.3; }
          }
          @keyframes float2 {
            0% { transform: scale(1.2) translate(0, 0); opacity: 0.2; }
            50% { transform: scale(1) translate(-50px, 50px); opacity: 0.4; }
            100% { transform: scale(1.2) translate(0, 0); opacity: 0.2; }
          }
        `}
      </style>
      <Box
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at center, var(--mantine-color-brand-6) 0%, transparent 70%)',
          filter: 'blur(100px)',
          animation: `float1 ${duration1}s linear infinite`,
        }}
      />
      <Box
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 30% 70%, var(--mantine-color-brand-9) 0%, transparent 60%)',
          filter: 'blur(120px)',
          animation: `float2 ${duration2}s linear infinite`,
        }}
      />
    </Box>
  );
};

export default AtmosphericBackground;

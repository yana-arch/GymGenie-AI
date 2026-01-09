import React from 'react';
import { Box, Text, Group, useMantineTheme } from '@mantine/core';
import { Shield, Activity } from 'lucide-react';

interface WorkoutHUDProps {
  safetyStatus?: 'safe' | 'warning' | 'danger';
  aiStatus?: string;
  isThinking?: boolean;
}

const WorkoutHUD: React.FC<WorkoutHUDProps> = ({ 
  safetyStatus = 'safe', 
  aiStatus = 'Monitoring Form',
  isThinking = false
}) => {
  const theme = useMantineTheme();
  
  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: (theme as any).other.zIndices.hud,
        padding: theme.spacing.xl,
      }}
    >
      <style>
        {`
          @keyframes scanline {
            0% { transform: translateY(-100%); }
            100% { transform: translateY(100%); }
          }
          @keyframes pulse-hud {
            0% { opacity: 0.5; }
            50% { opacity: 0.8; }
            100% { opacity: 0.5; }
          }
        `}
      </style>
      
      {/* Scanning Line */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: 'rgba(59, 130, 246, 0.5)',
          boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)',
          animation: 'scanline 4s linear infinite',
        }}
      />

      {/* Top Left: Safety Status */}
      <Box style={{ position: 'absolute', top: 'clamp(10px, 4%, 40px)', left: 'clamp(10px, 4%, 40px)' }}>
        <Group gap="xs" style={{ background: 'rgba(0,0,0,0.6)', padding: 'clamp(4px, 1vw, 8px) clamp(12px, 2vw, 24px)', borderRadius: '12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <Shield size={16} color={safetyStatus === 'safe' ? '#10b981' : safetyStatus === 'warning' ? '#f59e0b' : '#ef4444'} />
          <Text size="xs" fw={800} tt="uppercase" c="white" style={{ letterSpacing: '1.5px', fontSize: 'clamp(10px, 1.2vw, 14px)' }}>
            Safety: {safetyStatus}
          </Text>
        </Group>
      </Box>

      {/* Top Right: AI Status */}
      <Box style={{ position: 'absolute', top: 'clamp(10px, 4%, 40px)', right: 'clamp(10px, 4%, 40px)' }}>
        <Group gap="xs" style={{ background: 'rgba(0,0,0,0.6)', padding: 'clamp(4px, 1vw, 8px) clamp(12px, 2vw, 24px)', borderRadius: '12px', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <Activity size={16} color="#3b82f6" style={{ animation: isThinking ? 'pulse-hud 1.5s infinite' : 'none' }} />
          <Text size="xs" fw={800} tt="uppercase" c="white" style={{ letterSpacing: '1.5px', fontSize: 'clamp(10px, 1.2vw, 14px)' }}>
            {isThinking ? 'AI Thinking...' : aiStatus}
          </Text>
        </Group>
      </Box>

      {/* Corner Markers */}
      <Box style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)' }} />
      <Box style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderTop: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)' }} />
      <Box style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.3)', borderLeft: '2px solid rgba(255,255,255,0.3)' }} />
      <Box style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderBottom: '2px solid rgba(255,255,255,0.3)', borderRight: '2px solid rgba(255,255,255,0.3)' }} />
    </Box>
  );
};

export default WorkoutHUD;

import React from 'react';
import { Transition } from '@mantine/core';
import { useReducedMotion } from '@mantine/hooks';

interface MotionFeedbackProps {
  children: React.ReactNode;
  visible: boolean;
  type?: 'pulse' | 'glow' | 'slide';
  color?: string;
}

/**
 * Reusable component for AI adaptation notifications and critical safety alerts.
 * Uses high-performance transitions and animations.
 */
export const MotionFeedback: React.FC<MotionFeedbackProps> = ({
  children,
  visible,
  type = 'pulse',
  color = 'var(--mantine-primary-color-filled)',
}) => {
  const reducedMotion = useReducedMotion();

  return (
    <Transition
      mounted={visible}
      transition={type === 'slide' ? 'slide-up' : 'fade'}
      duration={reducedMotion ? 0 : 400}
      timingFunction="cubic-bezier(0.175, 0.885, 0.32, 1.275)"
    >
      {(styles) => (
        <div style={styles} className="relative">
          {type === 'pulse' && visible && (
            <div 
              className="absolute inset-0 rounded-inherit animate-pulse opacity-20"
              style={{ backgroundColor: color, pointerEvents: 'none' }}
            />
          )}
          {type === 'glow' && visible && (
            <div 
              className="absolute inset-0 rounded-inherit transition-shadow duration-500"
              style={{ 
                pointerEvents: 'none',
                boxShadow: `0 0 20px ${color}`
              }}
            />
          )}
          {children}
        </div>
      )}
    </Transition>
  );
};

export default MotionFeedback;

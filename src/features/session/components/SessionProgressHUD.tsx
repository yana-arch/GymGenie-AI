import React, { useMemo, useState, useEffect } from 'react';
import { Paper, Text, Progress, Group, Stack, Badge, ThemeIcon, Box, useMantineTheme } from '@mantine/core';
import { Dumbbell, Clock, Trophy } from 'lucide-react';
import { useAppSelector } from '@/store';

const SessionProgressHUD: React.FC = () => {
  const theme = useMantineTheme();
  const { 
    sessionVolume, 
    exercisesCompleted,
    activeExerciseIndex,
    sessionStartTime,
    focusMode
  } = useAppSelector(state => state.liveSession);

  const [duration, setDuration] = useState('0:00');

  useEffect(() => {
    if (!sessionStartTime) {
      setDuration('0:00');
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setDuration(`${mins}:${secs.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const currentRepCount = useAppSelector((state: any) => state.formCorrection.currentRepCount);
  
  const currentPlan = useAppSelector(state => state.workout.currentPlan);
  const currentSession = useAppSelector(state => state.session.currentSession);

  const { totalExercises, targetReps } = useMemo(() => {
    if (!currentPlan || !currentSession) return { totalExercises: 0, targetReps: 0 };
    const week = currentPlan.weeks.find(w => w.id === currentSession.weekId);
    const day = week?.days.find(d => d.id === currentSession.dayId);
    const currentExercise = day?.exercises[activeExerciseIndex];
    
    return { 
      totalExercises: day?.exercises.length || 0,
      targetReps: currentExercise ? (parseInt(currentExercise.reps) || 10) : 10
    };
  }, [currentPlan, currentSession, activeExerciseIndex]);

  const setProgress = targetReps > 0 ? (currentRepCount / targetReps) : 0;
  const overallProgress = totalExercises > 0 ? (exercisesCompleted / totalExercises) * 100 : 0;

  if (focusMode) return null;

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: 'clamp(80px, 10vh, 120px)',
        left: 'clamp(20px, 5vw, 40px)',
        width: 'clamp(280px, 20vw, 360px)',
        zIndex: (theme as any).other.zIndices.progress,
        pointerEvents: 'none'
      }}
    >
      <Paper 
        shadow="xl" 
        p="clamp(12px, 1.5vw, 20px)" 
        radius="24px" 
        withBorder 
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(30px)',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          color: 'white',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}
      >
        <Stack gap="sm">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon color="brand" variant="filled" size="md" radius="md">
                <Dumbbell size={16} />
              </ThemeIcon>
              <Text size="xs" fw={900} tt="uppercase" c="white" style={{ letterSpacing: '1.5px', fontSize: 'clamp(10px, 1vw, 12px)' }}>Live Stats</Text>
            </Group>
            <Badge size="sm" variant="filled" color="brand" style={{ borderRadius: '6px' }}>{sessionVolume.toLocaleString()} kg</Badge>
          </Group>

          <Box>
            <Group justify="space-between" mb={2}>
              <Text size="xs" c="white" style={{ opacity: 0.6 }}>Workout</Text>
              <Text size="xs" fw={700} c="white">{Math.round(overallProgress)}%</Text>
            </Group>
            <Progress value={overallProgress} size="sm" radius="xl" color="brand" animated />
          </Box>

          <Box>
            <Group justify="space-between" mb={2}>
              <Text size="xs" c="white" style={{ opacity: 0.6 }}>Current Set</Text>
              <Text size="xs" fw={700} c="white">{Math.round(setProgress * 100)}%</Text>
            </Group>
            <Progress value={setProgress * 100} size="xs" radius="xl" color="green" />
          </Box>

          <Group justify="space-between" mt={2}>
            <Group gap="xs">
              <Clock size={14} className="text-brand-400" />
              <Text size="xs" fw={700} c="white">{duration}</Text>
            </Group>
            <Group gap="xs">
              <Trophy size={14} className="text-yellow-400" />
              <Text size="xs" fw={700} c="white">{exercisesCompleted} / {totalExercises}</Text>
            </Group>
          </Group>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SessionProgressHUD;

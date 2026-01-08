import React, { useMemo, useState, useEffect } from 'react';
import { Paper, Text, Progress, Group, Stack, Badge, ThemeIcon, Box } from '@mantine/core';
import { Dumbbell, Clock, Trophy } from 'lucide-react';
import { useAppSelector } from '@/store';

const SessionProgressHUD: React.FC = () => {
  const { 
    sessionVolume, 
    exercisesCompleted,
    activeExerciseIndex,
    sessionStartTime
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

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: '80px',
        left: '20px',
        width: '280px',
        zIndex: 900,
        pointerEvents: 'none'
      }}
    >
      <Paper shadow="xl" p="sm" radius="lg" withBorder style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
        <Stack gap="xs">
          <Group justify="space-between">
            <Group gap="xs">
              <ThemeIcon color="brand" variant="light" size="sm">
                <Dumbbell size={14} />
              </ThemeIcon>
              <Text size="xs" fw={700} tt="uppercase">Progress</Text>
            </Group>
            <Badge size="xs" variant="filled" color="brand">{sessionVolume.toLocaleString()} kg</Badge>
          </Group>

          <Box>
            <Group justify="space-between" mb={2}>
              <Text size="xs" c="dimmed">Workout</Text>
              <Text size="xs" fw={700}>{Math.round(overallProgress)}%</Text>
            </Group>
            <Progress value={overallProgress} size="sm" radius="xl" color="brand" animated />
          </Box>

          <Box>
            <Group justify="space-between" mb={2}>
              <Text size="xs" c="dimmed">Current Set</Text>
              <Text size="xs" fw={700}>{Math.round(setProgress * 100)}%</Text>
            </Group>
            <Progress value={setProgress * 100} size="xs" radius="xl" color="green" />
          </Box>

          <Group justify="space-between" mt={2}>
            <Group gap="xs">
              <Clock size={14} className="text-blue-500" />
              <Text size="xs" fw={600}>{duration}</Text>
            </Group>
            <Group gap="xs">
              <Trophy size={14} className="text-yellow-500" />
              <Text size="xs" fw={600}>{exercisesCompleted} / {totalExercises}</Text>
            </Group>
          </Group>
        </Stack>
      </Paper>
    </Box>
  );
};

export default SessionProgressHUD;

import React from 'react';
import { Modal, Text, Button, Group, Stack, RingProgress, List, ThemeIcon, Title, Center, Box, Image, Skeleton } from '@mantine/core';
import { Play, FastForward, Plus, CheckCircle2, Info } from 'lucide-react';
import { useAppSelector } from '@/store';
import { TransitionService } from '../services/TransitionService';

/**
 * TransitionOverlay Component
 * Appears during exercise rest periods to guide the user to the next exercise.
 * Features:
 * - Countdown timer with RingProgress
 * - Next exercise title
 * - Equipment checklist
 * - Rest extension/skipping controls
 */
export const TransitionOverlay: React.FC = () => {
  const { transitionStatus, nextExercise, restRemaining } = useAppSelector(state => state.liveSession);
  
  if (transitionStatus !== 'resting') return null;

  const transitionService = TransitionService.getInstance();

  const handleSkip = () => transitionService.skipRest();
  const handleExtend = () => transitionService.extendRest(30);

  // In a real app, equipment and images would come from an exercise database/API
  const exerciseData: Record<string, { equipment: string[], imageUrl?: string }> = {
    'Squat': { equipment: ['Bodyweight or Dumbbells'], imageUrl: 'https://placehold.co/400x200?text=Squat+Demo' },
    'Push-up': { equipment: ['Exercise Mat'], imageUrl: 'https://placehold.co/400x200?text=Push-up+Demo' },
    'Plank': { equipment: ['Exercise Mat'], imageUrl: 'https://placehold.co/400x200?text=Plank+Demo' },
  };

  const currentExerciseData = nextExercise ? exerciseData[nextExercise] : null;
  const equipment = currentExerciseData?.equipment || ['General Equipment'];
  const imageUrl = currentExerciseData?.imageUrl;

  return (
    <Modal
      opened={transitionStatus === 'resting'}
      onClose={() => {}} // Disable closing via ESC/Overlay click for mandatory transitions
      withCloseButton={false}
      size="lg"
      centered
      radius="md"
      padding="xl"
      transitionProps={{ transition: 'fade', duration: 400 }}
      styles={{
        content: {
          backgroundColor: 'var(--mantine-color-dark-7)',
          border: '1px solid var(--mantine-color-dark-4)'
        }
      }}
    >
      <Stack align="center" gap="xl">
        <Title order={2} c="blue">Rest Period</Title>

        <RingProgress
          size={180}
          roundCaps
          thickness={12}
          sections={[{ value: (restRemaining / 60) * 100, color: 'blue' }]} // Assuming 60s max rest for visualization
          label={
            <Center>
              <Text fw={700} size="xl">{restRemaining}s</Text>
            </Center>
          }
        />

        <Stack gap={5} align="center">
          <Text size="sm" c="dimmed" tt="uppercase" fw={700}>Next Exercise</Text>
          <Title order={1} ta="center">{nextExercise || 'Upcoming'}</Title>
        </Stack>

        <Box style={{ width: '100%', height: 160, borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
          {imageUrl ? (
            <Image src={imageUrl} alt={nextExercise || 'Exercise'} fallbackSrc="https://placehold.co/400x200?text=Exercise+Preview" />
          ) : (
            <Skeleton height={160} />
          )}
          <Box style={{ position: 'absolute', top: 8, right: 8 }}>
             <ThemeIcon variant="filled" color="blue" radius="xl" size="sm">
               <Info size={14} />
             </ThemeIcon>
          </Box>
        </Box>

        <Stack gap="xs" style={{ width: '100%' }}>
          <Text fw={600} size="md">Equipment Needed:</Text>
          <List
            spacing="xs"
            size="sm"
            center
            icon={
              <ThemeIcon color="teal" size={24} radius="xl">
                <CheckCircle2 size={16} />
              </ThemeIcon>
            }
          >
            {equipment.map((item, index) => (
              <List.Item key={index}>{item}</List.Item>
            ))}
          </List>
        </Stack>

        <Group grow gap="md" style={{ width: '100%' }}>
          <Button 
            variant="light" 
            color="blue" 
            onClick={handleExtend}
            leftSection={<Plus size={20} />}
            size="md"
          >
            +30s Rest
          </Button>
          <Button 
            color="green" 
            onClick={handleSkip}
            leftSection={<Play size={20} />}
            rightSection={<FastForward size={20} />}
            size="md"
          >
            Ready Now
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default TransitionOverlay;

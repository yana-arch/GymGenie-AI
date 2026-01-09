import React from 'react';
import { Modal, Text, Button, Group, Stack, Badge, ThemeIcon, Paper } from '@mantine/core';
import { Check, X, Settings2, Info, ArrowRight } from 'lucide-react';
import { AdaptationRecommendation } from '../services/AdaptationGenerator';

interface AdaptationPromptProps {
  opened: boolean;
  onClose: () => void;
  adaptation: AdaptationRecommendation | null;
  onAccept: () => void;
  onManualOverride: () => void;
}

/**
 * AdaptationPrompt Component
 * Displays AI-suggested workout modifications using a Mantine Modal.
 * Supports Quick Accept and Manual Override.
 */
export const AdaptationPrompt: React.FC<AdaptationPromptProps> = ({
  opened,
  onClose,
  adaptation,
  onAccept,
  onManualOverride
}) => {
  if (!adaptation) return null;

  const renderModifications = () => {
    const { modifications } = adaptation;
    const items = [];

    if (modifications.alternativeExerciseName) {
      items.push(
        <Group key="exercise" justify="space-between">
          <Text size="sm">Switch Exercise:</Text>
          <Badge color="blue" variant="light" size="lg">
            {modifications.alternativeExerciseName}
          </Badge>
        </Group>
      );
    }

    if (modifications.suggestedWeight) {
      items.push(
        <Group key="weight" justify="space-between">
          <Text size="sm">Adjust Weight:</Text>
          <Group gap={5}>
            <Text fw={700} size="sm">New: {modifications.suggestedWeight}kg</Text>
            <ArrowRight size={14} />
          </Group>
        </Group>
      );
    }

    if (modifications.suggestedReps) {
      items.push(
        <Group key="reps" justify="space-between">
          <Text size="sm">Adjust Reps:</Text>
          <Text fw={700} size="sm">{modifications.suggestedReps} reps</Text>
        </Group>
      );
    }

    if (modifications.suggestedSets) {
      items.push(
        <Group key="sets" justify="space-between">
          <Text size="sm">Adjust Sets:</Text>
          <Text fw={700} size="sm">{modifications.suggestedSets} sets</Text>
        </Group>
      );
    }

    if (modifications.suggestedRest) {
      items.push(
        <Group key="rest" justify="space-between">
          <Text size="sm">Adjust Rest:</Text>
          <Text fw={700} size="sm">{modifications.suggestedRest}s</Text>
        </Group>
      );
    }

    return items;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <ThemeIcon color="blue" variant="light" size="sm">
            <Info size={16} />
          </ThemeIcon>
          <Text fw={700}>AI Workout Adaptation</Text>
        </Group>
      }
      centered
      radius="md"
      padding="xl"
      transitionProps={{ transition: 'slide-up', duration: 400 }}
      styles={{
        header: { marginBottom: 15 },
        title: { fontSize: '1.1rem' }
      }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed" fs="italic">
          "{adaptation.message}"
        </Text>

        <Paper withBorder p="md" radius="sm" bg="var(--mantine-color-blue-light)" style={{ opacity: 0.9 }}>
          <Stack gap="xs">
            {renderModifications()}
          </Stack>
        </Paper>

        <Stack gap="sm" mt="md">
          <Group grow gap="sm">
            <Button 
              color="blue" 
              onClick={onAccept} 
              leftSection={<Check size={18} />}
              size="md"
            >
              Quick Accept
            </Button>
          </Group>
          
          <Group gap="sm" justify="space-between">
            <Button 
              variant="subtle" 
              color="gray" 
              onClick={onManualOverride} 
              leftSection={<Settings2 size={16} />}
              size="xs"
            >
              Manual Override
            </Button>
            <Button 
              variant="light" 
              color="red" 
              onClick={onClose}
              leftSection={<X size={16} />}
              size="xs"
            >
              Ignore
            </Button>
          </Group>
        </Stack>
      </Stack>
    </Modal>
  );
};

import React from 'react';
import { Modal, Text, Button, Group, Stack, Badge, ThemeIcon, Paper, Indicator } from '@mantine/core';
import { Check, X, Settings2, Info, ArrowRight, Zap, ShieldCheck, Flame, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { AdaptationRecommendation } from '../services/AdaptationGenerator';
import { MotionFeedback } from '@/components/ui/MotionFeedback';

interface AdaptationPromptProps {
  opened: boolean;
  onClose: () => void;
  adaptation: AdaptationRecommendation | null;
  currentValues?: {
    weight?: number;
    reps?: number;
    sets?: number;
    rest?: number;
  };
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
  currentValues,
  onAccept,
  onManualOverride
}) => {
  if (!adaptation) return null;

  const getSemanticIcon = (reasoning: string) => {
    const lowReason = reasoning.toLowerCase();
    if (lowReason.includes('safety') || lowReason.includes('injury')) {
      return { icon: <ShieldCheck size={20} aria-label="Safety Alert" />, color: 'red', label: 'Safety' };
    }
    if (lowReason.includes('performance') || lowReason.includes('fatigue')) {
      return { icon: <Zap size={20} aria-label="Performance Optimization" />, color: 'brand', label: 'Performance' };
    }
    if (lowReason.includes('form')) {
      return { icon: <ShieldCheck size={20} aria-label="Form Correction" />, color: 'orange', label: 'Form' };
    }
    if (lowReason.includes('intensity') || lowReason.includes('challenge')) {
      return { icon: <Flame size={20} aria-label="Intensity Adjustment" />, color: 'brand', label: 'Intensity' };
    }
    if (lowReason.includes('time')) {
      return { icon: <Clock size={20} aria-label="Time Constraint" />, color: 'blue', label: 'Time' };
    }
    return { icon: <Info size={20} aria-label="AI Information" />, color: 'brand', label: 'AI Suggestion' };
  };

  const renderDelta = (current?: number, suggested?: number, unit: string = '') => {
    if (suggested === undefined) return null;
    if (current === undefined || current === suggested) {
      return <Text fw={700} size="sm" c="brand">{suggested}{unit}</Text>;
    }

    const delta = suggested - current;
    const isPositive = delta > 0;
    const deltaColor = isPositive ? 'teal' : 'red';
    const DeltaIcon = isPositive ? TrendingUp : TrendingDown;

    return (
      <Group gap={5}>
        <Text size="xs" c="dimmed" td="line-through">{current}{unit}</Text>
        <ArrowRight size={12} className="text-gray-400" />
        <Text fw={700} size="sm" c="brand">{suggested}{unit}</Text>
        <Badge 
          size="xs" 
          color={deltaColor} 
          variant="light" 
          leftSection={<DeltaIcon size={10} />}
        >
          {isPositive ? '+' : ''}{delta}{unit}
        </Badge>
      </Group>
    );
  };

  const semantic = getSemanticIcon(adaptation.reasoning + ' ' + adaptation.message);

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

    if (modifications.suggestedWeight !== undefined) {
      items.push(
        <Group key="weight" justify="space-between">
          <Text size="sm">Adjust Weight:</Text>
          {renderDelta(currentValues?.weight, modifications.suggestedWeight, 'kg')}
        </Group>
      );
    }

    if (modifications.suggestedReps !== undefined) {
      items.push(
        <Group key="reps" justify="space-between">
          <Text size="sm">Adjust Reps:</Text>
          {renderDelta(currentValues?.reps, modifications.suggestedReps)}
        </Group>
      );
    }

    if (modifications.suggestedSets !== undefined) {
      items.push(
        <Group key="sets" justify="space-between">
          <Text size="sm">Adjust Sets:</Text>
          {renderDelta(currentValues?.sets, modifications.suggestedSets)}
        </Group>
      );
    }

    if (modifications.suggestedRest !== undefined) {
      items.push(
        <Group key="rest" justify="space-between">
          <Text size="sm">Adjust Rest:</Text>
          {renderDelta(currentValues?.rest, modifications.suggestedRest, 's')}
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
          <ThemeIcon color={semantic.color} variant="light" size="md">
            {semantic.icon}
          </ThemeIcon>
          <Stack gap={0}>
            <Text fw={700}>AI Workout Adaptation</Text>
            <Text size="xs" c="dimmed">{semantic.label} optimization</Text>
          </Stack>
        </Group>
      }
      centered
      radius="md"
      padding="xl"
      transitionProps={{ transition: 'slide-up', duration: 400 }}
      styles={{
        header: { marginBottom: 15 },
        title: { fontSize: '1.1rem', width: '100%' }
      }}
    >
      <MotionFeedback visible={opened} type="glow" color={`var(--mantine-color-${semantic.color}-light)`}>
        <Stack gap="md">
          <Paper withBorder p="md" radius="md" bg="var(--mantine-color-gray-0)" className="dark:bg-gray-800">
             <Text size="sm" fw={500} fs="italic">
              "{adaptation.message}"
            </Text>
          </Paper>

          <Paper withBorder p="md" radius="md" bg={`var(--mantine-color-${semantic.color}-light)`} style={{ borderLeftWidth: 4, borderLeftColor: `var(--mantine-color-${semantic.color}-filled)` }}>
            <Stack gap="xs">
              {renderModifications()}
            </Stack>
          </Paper>

          <Stack gap="sm" mt="md">
            <Button 
              color={semantic.color}
              onClick={onAccept} 
              leftSection={<Check size={18} />}
              size="md"
              fullWidth
              variant="filled"
              className="shadow-md"
            >
              Quick Accept
            </Button>
            
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
      </MotionFeedback>
    </Modal>
  );
};

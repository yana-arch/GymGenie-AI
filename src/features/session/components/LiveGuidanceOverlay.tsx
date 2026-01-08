import React from 'react';
import { Paper, Text, Transition, Group, Stack, Badge, ThemeIcon } from '@mantine/core';
import { Info, AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
import { CoachingDecision, CoachingPriority } from '@/features/unified-coaching/types/unifiedCoaching.types';

interface LiveGuidanceOverlayProps {
  guidance: CoachingDecision | null;
}

const getPriorityIcon = (priority: CoachingPriority) => {
  switch (priority) {
    case CoachingPriority.SAFETY:
      return <ShieldAlert size={20} color="white" />;
    case CoachingPriority.INJURY:
      return <AlertTriangle size={20} color="white" />;
    case CoachingPriority.FORM:
      return <Info size={20} color="white" />;
    default:
      return <Zap size={20} color="white" />;
  }
};

const getPriorityColor = (priority: CoachingPriority) => {
  switch (priority) {
    case CoachingPriority.SAFETY:
      return 'red.7';
    case CoachingPriority.INJURY:
      return 'orange.7';
    case CoachingPriority.FORM:
      return 'blue.7';
    default:
      return 'green.7';
  }
};

const LiveGuidanceOverlay: React.FC<LiveGuidanceOverlayProps> = ({ guidance }) => {
  if (!guidance) return null;

  const { response, priority } = guidance;
  const { recommendation } = response;

  return (
    <Transition mounted={!!guidance} transition="fade" duration={400}>
      {(styles: React.CSSProperties) => (
        <Paper
          style={{
            ...styles,
            position: 'fixed',
            top: '10%',
            right: '20px',
            width: '320px',
            zIndex: 1000,
            borderLeft: `6px solid var(--mantine-color-${getPriorityColor(priority).split('.')[0]}-filled)`
          }}
          shadow="md"
          p="md"
          radius="md"
          withBorder
        >
          <Stack gap="xs">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon color={getPriorityColor(priority)} radius="xl">
                  {getPriorityIcon(priority)}
                </ThemeIcon>
                <Text fw={700} size="sm" tt="uppercase">
                  {priority} Guidance
                </Text>
              </Group>
              <Badge color={response.confidence > 0.8 ? 'green' : 'yellow'} size="sm">
                {Math.round(response.confidence * 100)}% Match
              </Badge>
            </Group>

            <Text size="md" fw={500}>
              {recommendation.message || recommendation.action}
            </Text>

            {response.reasoning && (
              <Text size="xs" c="dimmed" fs="italic">
                "{response.reasoning}"
              </Text>
            )}
          </Stack>
        </Paper>
      )}
    </Transition>
  );
};

export default LiveGuidanceOverlay;

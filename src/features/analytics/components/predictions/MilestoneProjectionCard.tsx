import React from 'react';
import { Card, Text, Group, Stack, Badge, ThemeIcon, Progress, SimpleGrid } from '@mantine/core';
import { Target, Calendar, TrendingUp, ShieldAlert, Zap } from 'lucide-react';
import { TargetEstimation } from '../../services/PredictionService';

interface MilestoneProjectionCardProps {
  estimation: TargetEstimation;
  exerciseName: string;
  metric: string;
  currentValue: number;
}

const MilestoneProjectionCard: React.FC<MilestoneProjectionCardProps> = ({
  estimation,
  exerciseName,
  metric,
  currentValue
}) => {
  const progress = Math.min(100, Math.max(0, (currentValue / estimation.targetValue) * 100));

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Stack gap="md">
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon color="blue" variant="light" size="lg">
              <Target size={20} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="lg">{exerciseName} Goal</Text>
              <Text size="sm" c="dimmed">Target: {estimation.targetValue} {metric}</Text>
            </div>
          </Group>
          <Badge size="lg" variant="filled" color="blue">
            {progress.toFixed(0)}%
          </Badge>
        </Group>

        <Progress value={progress} size="xl" radius="xl" striped animated />

        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <Card withBorder p="sm" radius="md">
            <Stack gap={4}>
              <Group gap="xs">
                <Zap size={16} color="var(--mantine-color-yellow-6)" />
                <Text size="xs" fw={700} c="dimmed">OPTIMISTIC</Text>
              </Group>
              <Text fw={700}>{new Date(estimation.projections.optimistic).toLocaleDateString()}</Text>
              <Text size="xs" c="dimmed">High intensity path</Text>
            </Stack>
          </Card>

          <Card withBorder p="sm" radius="md" bg="var(--mantine-color-blue-0)" style={{ borderColor: 'var(--mantine-color-blue-4)' }}>
            <Stack gap={4}>
              <Group gap="xs">
                <Calendar size={16} color="var(--mantine-color-blue-6)" />
                <Text size="xs" fw={700} c="blue">REALISTIC</Text>
              </Group>
              <Text fw={700} size="lg">{new Date(estimation.projections.realistic).toLocaleDateString()}</Text>
              <Text size="xs" c="dimmed">Current trend path</Text>
            </Stack>
          </Card>

          <Card withBorder p="sm" radius="md">
            <Stack gap={4}>
              <Group gap="xs">
                <ShieldAlert size={16} color="var(--mantine-color-orange-6)" />
                <Text size="xs" fw={700} c="dimmed">CONSERVATIVE</Text>
              </Group>
              <Text fw={700}>{new Date(estimation.projections.conservative).toLocaleDateString()}</Text>
              <Text size="xs" c="dimmed">Sustainable path</Text>
            </Stack>
          </Card>
        </SimpleGrid>

        <Group gap="xs">
          <TrendingUp size={16} color="var(--mantine-color-green-6)" />
          <Text size="sm">
            Based on your recent <Text component="span" fw={700}>improvement rate</Text>, you're on track!
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};

export default React.memo(MilestoneProjectionCard);

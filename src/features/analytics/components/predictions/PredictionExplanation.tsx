import React from 'react';
import { Card, Text, Group, Skeleton, Alert, Stack } from '@mantine/core';
import { Sparkles, Info } from 'lucide-react';

interface PredictionExplanationProps {
  explanation: string | null;
  loading: boolean;
  exerciseName: string;
}

const PredictionExplanation: React.FC<PredictionExplanationProps> = ({
  explanation,
  loading,
  exerciseName
}) => {
  if (loading) {
    return (
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group mb="xs">
          <Sparkles size={18} color="var(--mantine-color-grape-6)" />
          <Text fw={700}>AI Insights for {exerciseName}</Text>
        </Group>
        <Skeleton height={15} mt={6} radius="xl" />
        <Skeleton height={15} mt={6} radius="xl" />
        <Skeleton height={15} mt={6} width="70%" radius="xl" />
      </Card>
    );
  }

  if (!explanation) return null;

  return (
    <Alert 
      variant="light" 
      color="grape" 
      title={`AI Insights for ${exerciseName}`} 
      icon={<Sparkles size={18} />}
      radius="md"
    >
      <Text size="sm" style={{ lineHeight: 1.6 }}>
        {explanation}
      </Text>
    </Alert>
  );
};

export default React.memo(PredictionExplanation);

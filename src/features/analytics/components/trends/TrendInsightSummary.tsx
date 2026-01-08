import React from 'react';
import { Card, Text, Title, Group, Badge, Stack } from '@mantine/core';
import { Sparkles, Zap } from 'lucide-react';

interface TrendInsightSummaryProps {
  insights: string[];
  isAiEnhanced?: boolean;
}

const TrendInsightSummary: React.FC<TrendInsightSummaryProps> = ({ insights, isAiEnhanced = false }) => {
  if (insights.length === 0) return null;

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group gap="xs">
          <Zap size={20} color="var(--mantine-color-yellow-6)" />
          <Title order={4}>Trend Insights</Title>
        </Group>
        {isAiEnhanced && (
          <Badge leftSection={<Sparkles size={12} />} variant="gradient" gradient={{ from: 'indigo', to: 'cyan' }}>
            AI Enhanced
          </Badge>
        )}
      </Group>
      
      <Stack gap="sm">
        {insights.map((insight, index) => (
          <Text key={index} size="sm">
            {insight}
          </Text>
        ))}
      </Stack>
    </Card>
  );
};

export default React.memo(TrendInsightSummary);

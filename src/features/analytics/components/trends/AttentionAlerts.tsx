import React from 'react';
import { Alert, Stack, Text, List, ThemeIcon } from '@mantine/core';
import { AlertTriangle, TrendingDown, Target } from 'lucide-react';
import { PlateauInfo } from '../../services/AnalyticsService';

interface AttentionAlertsProps {
  plateaus: PlateauInfo[];
  significantDrops: { category: string; drop: number; message: string }[];
}

const AttentionAlerts: React.FC<AttentionAlertsProps> = ({ plateaus, significantDrops }) => {
  const activePlateaus = plateaus.filter(p => p.isPlateau);

  if (activePlateaus.length === 0 && significantDrops.length === 0) {
    return null;
  }

  return (
    <Stack gap="md">
      {activePlateaus.length > 0 && (
        <Alert 
          variant="light" 
          color="orange" 
          title="Progress Plateaus Detected" 
          icon={<Target size={18} />}
        >
          <Text size="sm" mb="xs">
            The following exercises haven't seen improvement in several sessions:
          </Text>
          <List size="sm" withPadding>
            {activePlateaus.map(p => (
              <List.Item key={p.exerciseId}>
                <Text fw={500} style={{ textTransform: 'capitalize' }}>{p.exerciseId.replace(/-/g, ' ')}</Text>
                <Text size="xs" c="dimmed">Stalled for {p.weeksStalled} sessions at {p.currentValue}kg</Text>
              </List.Item>
            ))}
          </List>
        </Alert>
      )}

      {significantDrops.length > 0 && (
        <Alert 
          variant="light" 
          color="red" 
          title="Performance Drops Detected" 
          icon={<AlertTriangle size={18} />}
        >
          <List size="sm" withPadding icon={
            <ThemeIcon color="red" size={16} radius="xl">
              <TrendingDown size={10} />
            </ThemeIcon>
          }>
            {significantDrops.map((drop, index) => (
              <List.Item key={index}>
                <Text fw={500}>{drop.category}: -{drop.drop.toFixed(1)}%</Text>
                <Text size="xs" c="dimmed">{drop.message}</Text>
              </List.Item>
            ))}
          </List>
        </Alert>
      )}
    </Stack>
  );
};

export default React.memo(AttentionAlerts);

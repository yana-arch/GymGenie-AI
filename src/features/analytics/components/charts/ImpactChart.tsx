import React from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ZAxis
} from 'recharts';
import { Card, Title, useMantineTheme, useMantineColorScheme, Text } from '@mantine/core';

interface ImpactChartProps {
  performanceTrend: { timestamp: number; date: string; performance: number }[];
  events: { 
    timestamp: number; 
    performance: number; 
    recommendationType: string; 
    action: string;
    userResponse: string;
  }[];
}

const ImpactChart: React.FC<ImpactChartProps> = ({ performanceTrend, events }) => {
  const theme = useMantineTheme();

  const eventTypes = ['Safety', 'Form Correction', 'Adaptation', 'Performance'];

  const getEventColor = (type: string) => {
    switch (type) {
      case 'Safety': return 'var(--mantine-color-red-6)';
      case 'Form Correction': return 'var(--mantine-color-orange-6)';
      case 'Adaptation': return 'var(--mantine-color-green-6)';
      case 'Performance': return 'var(--mantine-color-blue-6)';
      default: return 'var(--mantine-color-gray-6)';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      if (data.type === 'performance') {
        return (
          <Card shadow="sm" p="xs" withBorder>
            <Text size="sm" fw={700}>{new Date(data.timestamp).toLocaleDateString()}</Text>
            <Text size="sm">Performance: {data.performance.toFixed(0)}</Text>
          </Card>
        );
      } else {
        return (
          <Card shadow="sm" p="xs" withBorder>
            <Text size="sm" fw={700}>{new Date(data.timestamp).toLocaleDateString()}</Text>
            <Text size="sm" c={getEventColor(data.recommendationType)} fw={600}>
              {data.recommendationType}: {data.action}
            </Text>
            <Text size="xs" c="dimmed">Response: {data.userResponse}</Text>
          </Card>
        );
      }
    }
    return null;
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder h={450}>
      <Title order={4} mb="md">Performance vs. AI Adaptations</Title>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="timestamp" 
            type="number" 
            domain={['auto', 'auto']}
            tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          />
          <YAxis name="Performance" />
          <ZAxis type="number" range={[100, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line 
            data={performanceTrend}
            type="monotone" 
            dataKey="performance" 
            stroke="var(--mantine-color-blue-6)" 
            strokeWidth={2}
            dot={false}
            name="Performance Trend"
          />
          {eventTypes.map(type => (
            <Scatter 
              key={type}
              data={events.filter(e => e.recommendationType === type)}
              name={`AI ${type}`}
              fill={getEventColor(type)}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default React.memo(ImpactChart);

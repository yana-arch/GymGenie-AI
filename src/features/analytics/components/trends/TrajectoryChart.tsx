import React, { useMemo } from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, Title, useMantineTheme, useMantineColorScheme, Group, Text } from '@mantine/core';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Trajectory } from '../../services/AnalyticsService';

interface TrajectoryChartProps {
  data: { date: string; volume: number; intensity: number; movingAvg?: number }[];
  title: string;
  trajectory?: Trajectory;
  changePercentage?: number;
  type?: 'area' | 'line' | 'scatter';
}

const TrajectoryChart: React.FC<TrajectoryChartProps> = ({ 
  data, 
  title, 
  trajectory, 
  changePercentage,
  type = 'area'
}) => {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const TrajectoryIcon = useMemo(() => {
    if (trajectory === 'upward') return <TrendingUp color="var(--mantine-color-green-6)" size={20} />;
    if (trajectory === 'downward') return <TrendingDown color="var(--mantine-color-red-6)" size={20} />;
    return <Minus color="var(--mantine-color-gray-6)" size={20} />;
  }, [trajectory]);

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder style={{ minHeight: 350, height: '100%' }}>
      <Group justify="space-between" mb="md">
        <Title order={4}>{title}</Title>
        {trajectory && (
          <Group gap="xs">
            {TrajectoryIcon}
            <Text 
              size="sm" 
              fw={700} 
              c={trajectory === 'upward' ? 'green' : trajectory === 'downward' ? 'red' : 'dimmed'}
            >
              {changePercentage !== undefined ? `${changePercentage > 0 ? '+' : ''}${changePercentage.toFixed(1)}%` : trajectory.toUpperCase()}
            </Text>
          </Group>
        )}
      </Group>
      
      <ResponsiveContainer width="100%" height="80%">
        <ComposedChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fill: colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6] }}
            tickFormatter={(str) => {
              const date = new Date(str);
              return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis yAxisId="left" unit="kg" tick={{ fontSize: 10, fill: colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6] }} name="Volume" />
          <YAxis yAxisId="right" orientation="right" unit="kg" tick={{ fontSize: 10, fill: colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6] }} name="Intensity" />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : '#fff',
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: '8px'
            }}
          />
          <Legend />
          
          {type === 'area' ? (
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="volume" 
              name="Volume" 
              fill="var(--mantine-color-blue-1)"
              stroke="var(--mantine-color-blue-6)" 
              strokeWidth={1}
              fillOpacity={0.4}
            />
          ) : (
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="volume" 
              name="Volume" 
              stroke="var(--mantine-color-blue-6)" 
              strokeWidth={2}
              dot={type === 'scatter'}
            />
          )}
          
          <Line 
            yAxisId="right"
            type="monotone" 
            dataKey="intensity" 
            name="Intensity (Max Weight)" 
            stroke="var(--mantine-color-orange-6)" 
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }} 
          />

          {data[0]?.movingAvg !== undefined && (
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="movingAvg" 
              name="Trend Line" 
              stroke="var(--mantine-color-indigo-4)" 
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default React.memo(TrajectoryChart);

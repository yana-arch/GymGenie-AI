import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, Title, useMantineColorScheme } from '@mantine/core';

interface ConsistencyChartProps {
  data: { date: string; count: number }[];
}

const ConsistencyChart: React.FC<ConsistencyChartProps> = ({ data }) => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder h={300}>
      <Title order={4} mb="md">Consistency</Title>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            tickFormatter={(str) => {
              const date = new Date(str);
              return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip 
            cursor={{ fill: 'transparent' }}
            contentStyle={{ 
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : '#fff',
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: '8px' 
            }}
          />
          <Bar 
            dataKey="count" 
            name="Workouts" 
            fill="var(--mantine-color-green-6)" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default React.memo(ConsistencyChart);

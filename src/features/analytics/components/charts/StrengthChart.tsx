import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, Title, useMantineTheme, useMantineColorScheme } from '@mantine/core';

interface StrengthChartProps {
  data: { date: string; value: number }[];
  exerciseName: string;
  unit?: string;
}

const StrengthChart: React.FC<StrengthChartProps> = ({ data, exerciseName, unit = 'kg' }) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder h={400}>
      <Title order={4} mb="md">Strength Progress: {exerciseName}</Title>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 12 }}
            tickFormatter={(str) => {
              const date = new Date(str);
              return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis unit={unit} tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : '#fff',
              border: '1px solid var(--mantine-color-default-border)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="value" 
            name="Max Weight" 
            stroke="var(--mantine-color-blue-6)" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default React.memo(StrengthChart);

import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Card, Title, useMantineColorScheme } from '@mantine/core';

interface EnduranceChartProps {
  data: { date: string; value: number }[];
}

const EnduranceChart: React.FC<EnduranceChartProps> = ({ data }) => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder h={300}>
      <Title order={4} mb="md">Endurance (Session Duration)</Title>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorEndurance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--mantine-color-orange-6)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--mantine-color-orange-6)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            tickFormatter={(str) => {
              const date = new Date(str);
              return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis unit="m" tick={{ fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : '#fff',
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: '8px' 
            }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            name="Duration" 
            stroke="var(--mantine-color-orange-6)" 
            fillOpacity={1} 
            fill="url(#colorEndurance)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default React.memo(EnduranceChart);

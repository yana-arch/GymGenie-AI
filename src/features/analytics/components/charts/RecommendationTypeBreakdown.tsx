import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from 'recharts';
import { Card, Title } from '@mantine/core';

interface RecommendationTypeBreakdownProps {
  data: {
    type: string;
    count: number;
    successRate: number;
    performanceGains: number;
  }[];
}

const RecommendationTypeBreakdown: React.FC<RecommendationTypeBreakdownProps> = ({ data }) => {
  const COLORS = {
    'Safety': 'var(--mantine-color-red-6)',
    'Form Correction': 'var(--mantine-color-orange-6)',
    'Adaptation': 'var(--mantine-color-green-6)',
    'Performance': 'var(--mantine-color-blue-6)',
  };

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder h={400}>
      <Title order={4} mb="md">Recommendation Impact by Type</Title>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="type" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" name="Total Recommendations">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.type] || 'var(--mantine-color-gray-6)'} opacity={0.6} />
            ))}
          </Bar>
          <Bar dataKey="performanceGains" name="Performance Gains" fill="var(--mantine-color-yellow-6)">
            {data.map((entry, index) => (
              <Cell key={`cell-gain-${index}`} fill="var(--mantine-color-yellow-6)" />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
};

export default React.memo(RecommendationTypeBreakdown);

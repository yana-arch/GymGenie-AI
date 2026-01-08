import React from 'react';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, Title, useMantineTheme, useMantineColorScheme, Group, Text, Badge } from '@mantine/core';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';
import { PredictionPoint, ConfidenceLevel } from '../../services/PredictionService';

interface ForecastChartProps {
  historicalData: { date: string; value: number }[];
  predictionData: PredictionPoint[];
  title: string;
  confidence: ConfidenceLevel;
  unit?: string;
}

const ForecastChart: React.FC<ForecastChartProps> = ({ 
  historicalData, 
  predictionData, 
  title, 
  confidence,
  unit = 'kg'
}) => {
  const { colorScheme } = useMantineColorScheme();
  const theme = useMantineTheme();

  const combinedData = [
    ...historicalData.map(d => ({ ...d, isForecast: false })),
    ...predictionData.map(d => ({ ...d, isForecast: true }))
  ];

  const confidenceColor = {
    High: 'green',
    Medium: 'yellow',
    Low: 'red'
  }[confidence];

  return (
    <Card shadow="sm" p="lg" radius="md" withBorder style={{ minHeight: 400, height: '100%' }}>
      <Group justify="space-between" mb="md">
        <Title order={4}>{title}</Title>
        <Badge color={confidenceColor} variant="light" leftSection={<Info size={14} />}>
          {confidence} Confidence
        </Badge>
      </Group>
      
      <ResponsiveContainer width="100%" height="80%">
        <ComposedChart data={combinedData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[2]} />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10, fill: colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6] }}
            tickFormatter={(str) => {
              const date = new Date(str);
              return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            }}
          />
          <YAxis unit={unit} tick={{ fontSize: 10, fill: colorScheme === 'dark' ? theme.colors.dark[2] : theme.colors.gray[6] }} />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: colorScheme === 'dark' ? 'var(--mantine-color-dark-7)' : '#fff',
              border: '1px solid var(--mantine-color-default-border)',
              borderRadius: '8px'
            }}
            formatter={(value: number, name: string) => [value.toFixed(1) + unit, name]}
          />
          <Legend />
          
          {/* Historical Line */}
          <Line 
            type="monotone" 
            dataKey="value" 
            name="History" 
            stroke="var(--mantine-color-blue-6)" 
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
          />

          {/* Uncertainty Band (Confidence Interval) */}
          <Area
            type="monotone"
            dataKey={(d) => d.isForecast ? [d.confidenceIntervalLower, d.confidenceIntervalUpper] : null}
            name="Confidence Interval"
            stroke="none"
            fill="var(--mantine-color-blue-2)"
            fillOpacity={0.3}
          />

          {/* Forecast Line */}
          <Line 
            type="monotone" 
            dataKey={(d) => d.isForecast ? d.value : null}
            name="Forecast" 
            stroke="var(--mantine-color-blue-4)" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      
      <Text size="xs" c="dimmed" mt="sm">
        Predictions are based on your historical performance trends. Actual results may vary.
      </Text>
    </Card>
  );
};

export default React.memo(ForecastChart);

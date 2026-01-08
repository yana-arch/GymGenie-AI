import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { 
  Container, 
  Grid, 
  Title, 
  Text, 
  Group, 
  Stack, 
  Paper,
  SimpleGrid,
  ThemeIcon,
  Center,
  Badge
} from '@mantine/core';
import { 
  BrainCircuit, 
  CheckCircle2, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { CorrelationService } from '../services/CorrelationService';
import ImpactChart from './charts/ImpactChart';
import RecommendationTypeBreakdown from './charts/RecommendationTypeBreakdown';

const CorrelationDashboard: React.FC = () => {
  const history = useSelector((state: any) => state.workout.history);
  const adaptationHistory = useSelector((state: any) => state.liveSession.adaptationHistory);
  
  const correlationService = CorrelationService.getInstance();

  const impactSummary = useMemo(() => 
    correlationService.getRecommendationImpactSummary(adaptationHistory, history),
    [adaptationHistory, history]
  );

  const correlationData = useMemo(() => 
    correlationService.getCorrelationData(adaptationHistory, history),
    [adaptationHistory, history]
  );

  if (adaptationHistory.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Stack align="center" gap="md">
            <ThemeIcon size={80} radius={100} variant="light" color="gray">
              <BrainCircuit size={40} />
            </ThemeIcon>
            <Title order={2}>No AI Insights Yet</Title>
            <Text c="dimmed" ta="center" maw={400}>
              Start using AI adaptations during your workouts to see how they impact your performance over time.
            </Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={2} className="flex items-center gap-2">
            <BrainCircuit size={28} className="text-purple-600" />
            AI Impact Correlation
          </Title>
          <Badge size="lg" variant="light" color="purple">
            {impactSummary.totalRecommendations} Recommendations Analyzed
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
          <SummaryCard 
            title="Total Suggestions" 
            value={impactSummary.totalRecommendations} 
            icon={<BrainCircuit size={20} />}
            color="purple"
          />
          <SummaryCard 
            title="Acceptance Rate" 
            value={`${Math.round(impactSummary.acceptedRate * 100)}%`} 
            icon={<CheckCircle2 size={20} />}
            color="green"
          />
          <SummaryCard 
            title="Performance Gains" 
            value={impactSummary.typeBreakdown.reduce((sum, t) => sum + t.performanceGains, 0)} 
            icon={<TrendingUp size={20} />}
            color="blue"
          />
          <SummaryCard 
            title="Safety Impact" 
            value={impactSummary.typeBreakdown.find(t => t.type === 'Safety')?.count || 0} 
            icon={<AlertCircle size={20} />}
            color="red"
          />
        </SimpleGrid>

        <Grid gutter="xl">
          <Grid.Col span={{ base: 12 }}>
            <ImpactChart 
              performanceTrend={correlationData.performanceTrend} 
              events={correlationData.events as any} 
            />
          </Grid.Col>
          
          <Grid.Col span={{ base: 12 }}>
            <RecommendationTypeBreakdown data={impactSummary.typeBreakdown} />
          </Grid.Col>
        </Grid>
      </Stack>
    </Container>
  );
};

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => (
  <Paper withBorder p="md" radius="md" shadow="xs">
    <Group justify="space-between">
      <div>
        <Text size="xs" color="dimmed" fw={700} tt="uppercase">
          {title}
        </Text>
        <Text fw={700} size="xl">
          {value}
        </Text>
      </div>
      <ThemeIcon color={color} variant="light" size={38} radius="md">
        {icon}
      </ThemeIcon>
    </Group>
  </Paper>
);

export default CorrelationDashboard;

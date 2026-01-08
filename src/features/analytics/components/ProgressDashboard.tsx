import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { 
  Container, 
  Grid, 
  Select, 
  Title, 
  Text, 
  Group, 
  Stack, 
  Paper,
  SimpleGrid,
  ThemeIcon,
  Tabs,
  rem,
  Center,
  Button
} from '@mantine/core';
import { 
  TrendingUp, 
  Calendar, 
  Clock, 
  Flame,
  Dumbbell,
  BarChart2,
  BrainCircuit
} from 'lucide-react';
import { AnalyticsService, TimePeriod } from '../services/AnalyticsService';
import StrengthChart from './charts/StrengthChart';
import ConsistencyChart from './charts/ConsistencyChart';
import EnduranceChart from './charts/EnduranceChart';
import CorrelationDashboard from './CorrelationDashboard';
import { selectSessions } from '@/features/session/store/sessionSlice';
import { useApp } from '@/context/AppContext';

const ProgressDashboard: React.FC = () => {
  const history = useSelector((state: any) => state.workout.history);
  const sessions = useSelector(selectSessions);
  const { setActiveView } = useApp();
  const [period, setPeriod] = useState<TimePeriod>('Month');
  const [activeTab, setActiveTab] = useState<string | null>('progress');
  
  const analyticsService = AnalyticsService.getInstance();

  // Extract available exercises from sessions for the selector
  const availableExercises = useMemo(() => {
    const exercises = new Set<string>();
    Object.values(sessions).forEach((session: any) => {
      if (session.exerciseData) {
        Object.keys(session.exerciseData).forEach(id => exercises.add(id));
      }
    });
    return Array.from(exercises).map(id => ({ 
      value: id, 
      label: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') 
    }));
  }, [sessions]);

  const [selectedExercise, setSelectedExercise] = useState<string>(
    availableExercises.length > 0 ? availableExercises[0].value : ''
  );

  // Sync selected exercise if it becomes empty but exercises are available
  useMemo(() => {
    if (!selectedExercise && availableExercises.length > 0) {
      setSelectedExercise(availableExercises[0].value);
    }
  }, [availableExercises]);

  const filteredHistory = useMemo(() => 
    analyticsService.filterHistoryByPeriod(history, period), 
    [history, period]
  );

  const consistencyData = useMemo(() => 
    analyticsService.calculateConsistency(history, period), 
    [history, period]
  );

  const enduranceMetrics = useMemo(() => 
    analyticsService.calculateEndurance(filteredHistory), 
    [filteredHistory]
  );

  const strengthData = useMemo(() => 
    analyticsService.calculateStrengthGains(sessions, selectedExercise, period), 
    [sessions, selectedExercise, period]
  );

  if (history.length === 0) {
    return (
      <Container size="xl" py="xl">
        <Center h={400}>
          <Stack align="center" gap="md">
            <ThemeIcon size={80} radius={100} variant="light" color="gray">
              <BarChart2 size={40} />
            </ThemeIcon>
            <Title order={2}>No Progress Data Yet</Title>
            <Text c="dimmed" ta="center" maw={400}>
              Complete your first workout to see your strength gains, consistency, and endurance tracking here.
            </Text>
            <Button size="md" onClick={() => setActiveView('workout')}>
              Start a Workout
            </Button>
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
            <TrendingUp size={28} className="text-blue-600" />
            Fitness Analytics
          </Title>
          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" color="blue">
            <Tabs.List>
              <Tabs.Tab value="progress" leftSection={<BarChart2 size={16} />}>Progress</Tabs.Tab>
              <Tabs.Tab value="ai-impact" leftSection={<BrainCircuit size={16} />}>AI Impact</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Group>

        {activeTab === 'progress' ? (
          <Stack gap="xl">
            <Group justify="flex-end">
              <Select
                label="Time Period"
                value={period}
                onChange={(val) => setPeriod(val as TimePeriod)}
                data={['Week', 'Month', 'Year', 'All Time']}
                w={150}
              />
            </Group>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg">
              <SummaryCard 
                title="Total Workouts" 
                value={filteredHistory.length} 
                icon={<Calendar size={20} />}
                color="blue"
              />
              <SummaryCard 
                title="Total Time" 
                value={`${enduranceMetrics.totalDuration}m`} 
                icon={<Clock size={20} />}
                color="orange"
              />
              <SummaryCard 
                title="Avg Duration" 
                value={`${Math.round(enduranceMetrics.averageDuration)}m`} 
                icon={<Flame size={20} />}
                color="red"
              />
              <SummaryCard 
                title="Exercises Completed" 
                value={filteredHistory.reduce((sum, h) => sum + (h.exercisesCompleted || 0), 0)} 
                icon={<Dumbbell size={20} />}
                color="green"
              />
            </SimpleGrid>

            <Grid gutter="xl">
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Title order={3}>Strength Gains</Title>
                    <Select
                      placeholder="Select Exercise"
                      value={selectedExercise}
                      onChange={(val) => setSelectedExercise(val || '')}
                      data={availableExercises}
                      w={200}
                    />
                  </Group>
                  <StrengthChart data={strengthData.maxWeightTrend} exerciseName={selectedExercise} />
                </Stack>
              </Grid.Col>
              
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Stack gap="xl">
                  <ConsistencyChart data={consistencyData} />
                  <EnduranceChart data={enduranceMetrics.durationTrend} />
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        ) : (
          <CorrelationDashboard />
        )}
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

export default ProgressDashboard;

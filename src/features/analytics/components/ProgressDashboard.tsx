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
  BrainCircuit,
  Trophy,
  Star,
  LineChart,
  Sparkles
} from 'lucide-react';
import { AnalyticsService, TimePeriod } from '../services/AnalyticsService';
import StrengthChart from './charts/StrengthChart';
import ConsistencyChart from './charts/ConsistencyChart';
import EnduranceChart from './charts/EnduranceChart';
import CorrelationDashboard from './CorrelationDashboard';
import AchievementList from './AchievementList';
import TrendAnalysisTab from './trends/TrendAnalysisTab';
import PredictionTab from './predictions/PredictionTab';
import { selectSessions } from '@/features/session/store/sessionSlice';
import { useApp } from '@/context/AppContext';
import { RootState, useAppSelector } from '@/store';
import { SummaryCard } from '@/components/ui';

const ProgressDashboard: React.FC = () => {
  const history = useAppSelector((state: RootState) => state.workout.history);
  const sessions = useSelector(selectSessions);
  const earnedAchievements = useAppSelector(state => state.achievement.earnedAchievements);
  const { setActiveView } = useApp();
  const [period, setPeriod] = useState<TimePeriod>('Month');
  const [activeTab, setActiveTab] = useState<string | null>('progress');
  
  const analyticsService = AnalyticsService.getInstance();

  const recentAchievements = useMemo(() => {
    return [...earnedAchievements]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 3);
  }, [earnedAchievements]);

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
    <Container size="xl" py="xl" className="text-gray-900 dark:text-gray-100">
      <Stack gap="xl">
        <Group justify="space-between">
          <Title order={2} className="flex items-center gap-2">
            <TrendingUp size={28} className="text-brand-600" />
            Fitness Analytics
          </Title>
          <Tabs value={activeTab} onChange={setActiveTab} variant="pills" color="var(--mantine-primary-color-filled)">
            <Tabs.List>
              <Tabs.Tab value="progress" leftSection={<BarChart2 size={16} />}>Progress</Tabs.Tab>
              <Tabs.Tab value="trends" leftSection={<LineChart size={16} />}>Trends</Tabs.Tab>
              <Tabs.Tab value="predictions" leftSection={<Sparkles size={16} />}>Predictions</Tabs.Tab>
              <Tabs.Tab value="achievements" leftSection={<Trophy size={16} />}>Achievements</Tabs.Tab>
              <Tabs.Tab value="ai-impact" leftSection={<BrainCircuit size={16} />}>AI Impact</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        </Group>

        {activeTab === 'progress' ? (
          <Stack gap="xl">
            {recentAchievements.length > 0 && (
              <Paper withBorder p="md" radius="md" className="bg-white/10 dark:bg-black/10 border-white/10 dark:border-white/5 backdrop-blur-sm">
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Trophy size={18} className="text-brand-500" />
                      <Text fw={700} size="sm">Recent Achievements</Text>
                    </Group>
                    <Button variant="subtle" size="xs" onClick={() => setActiveTab('achievements')} color="brand">
                      View Wall of Fame
                    </Button>
                  </Group>
                  <Group gap="md">
                    {recentAchievements.map((achievement) => (
                      <Group key={achievement.earnedId} gap="xs">
                        <ThemeIcon size="sm" radius="xl" color="brand" variant="light">
                          <Star size={12} />
                        </ThemeIcon>
                        <Text size="xs" fw={600}>{achievement.label}</Text>
                      </Group>
                    ))}
                  </Group>
                </Stack>
              </Paper>
            )}

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
        ) : activeTab === 'trends' ? (
          <TrendAnalysisTab period={period} setPeriod={setPeriod} />
        ) : activeTab === 'predictions' ? (
          <PredictionTab period={period} setPeriod={setPeriod} />
        ) : activeTab === 'achievements' ? (
          <AchievementList />
        ) : (
          <CorrelationDashboard />
        )}
      </Stack>
    </Container>
  );
};

export default ProgressDashboard;

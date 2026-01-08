import React, { useMemo, useState } from 'react';
import { Stack, Grid, Group, Title, SegmentedControl, Text, Select } from '@mantine/core';
import { useAppSelector } from '@/store';
import { AnalyticsService, TimePeriod } from '../../services/AnalyticsService';
import TrajectoryChart from './TrajectoryChart';
import AttentionAlerts from './AttentionAlerts';
import TrendInsightSummary from './TrendInsightSummary';

interface TrendAnalysisTabProps {
  period: TimePeriod;
  setPeriod: (period: TimePeriod) => void;
}

const TrendAnalysisTab: React.FC<TrendAnalysisTabProps> = ({ period, setPeriod }) => {
  const [selectedMuscle, setSelectedMuscle] = useState<string>('All');
  const [chartType, setChartType] = useState<'area' | 'line' | 'scatter'>('area');
  const [maWindow, setMaWindow] = useState<'7' | '30'>('7');
  
  const sessions = useAppSelector(state => state.session.sessions || {});
  
  const analyticsService = AnalyticsService.getInstance();

  // Optimize iterations: Generate exerciseDatabase and trendData in fewer passes
  const { exerciseDatabase, muscleGroups } = useMemo(() => {
    const db: Record<string, { bodyPart: string[] }> = {};
    const groups = new Set<string>(['All']);
    
    Object.values(sessions).forEach(s => {
      Object.keys(s.exerciseData || {}).forEach(id => {
        if (!db[id]) {
          const lid = id.toLowerCase();
          let bodyParts: string[] = [];
          if (lid.includes('bench') || lid.includes('chest') || lid.includes('pushup')) bodyParts = ['Chest'];
          else if (lid.includes('squat') || lid.includes('leg') || lid.includes('lung') || lid.includes('deadlift')) bodyParts = ['Legs'];
          else if (lid.includes('back') || lid.includes('row') || lid.includes('pullup') || lid.includes('lat')) bodyParts = ['Back'];
          else if (lid.includes('shoulder') || lid.includes('press')) bodyParts = ['Shoulders'];
          else if (lid.includes('curl') || lid.includes('tricep') || lid.includes('bicep')) bodyParts = ['Arms'];
          else bodyParts = ['Other'];
          
          db[id] = { bodyPart: bodyParts };
          bodyParts.forEach(bp => groups.add(bp));
        }
      });
    });
    
    return { 
      exerciseDatabase: db, 
      muscleGroups: Array.from(groups).sort() 
    };
  }, [sessions]);

  const trendData = useMemo(() => {
    const now = Date.now();
    let cutoffMs = 0;
    switch (period) {
      case 'Week': cutoffMs = 7 * 24 * 60 * 60 * 1000; break;
      case 'Month': cutoffMs = 30 * 24 * 60 * 60 * 1000; break;
      case 'Year': cutoffMs = 365 * 24 * 60 * 60 * 1000; break;
      case 'All Time': cutoffMs = now; break;
    }

    const filtered = Object.values(sessions)
      .filter(s => {
        const date = (s.completedTime || s.startTime);
        return date && (now - date) <= cutoffMs;
      })
      .sort((a, b) => (a.completedTime || a.startTime || 0) - (b.completedTime || b.startTime || 0));

    return filtered.map(s => {
      let volume = 0;
      let maxIntensity = 0;
      
      Object.entries(s.exerciseData || {}).forEach(([id, data]) => {
        const exercise = exerciseDatabase[id];
        if (selectedMuscle !== 'All' && (!exercise || !exercise.bodyPart.includes(selectedMuscle))) {
          return;
        }

        const sessionVolume = data.sets.reduce((sum, set) => sum + (set.weight || 0) * (set.reps || 0), 0);
        const sessionMax = data.sets.length > 0 ? Math.max(...data.sets.map(set => set.weight || 0)) : 0;
        
        volume += sessionVolume;
        if (sessionMax > maxIntensity) maxIntensity = sessionMax;
      });

      return {
        date: new Date(s.completedTime || s.startTime || 0).toISOString().split('T')[0],
        volume,
        intensity: maxIntensity
      };
    });
  }, [sessions, period, selectedMuscle, exerciseDatabase]);

  const movingAvg = useMemo(() => {
    return analyticsService.calculateMovingAverage(trendData.map(d => ({ value: d.volume })), parseInt(maWindow));
  }, [trendData, maWindow, analyticsService]);

  const chartData = useMemo(() => {
    return trendData.map((d, i) => ({
      ...d,
      movingAvg: movingAvg[i]
    }));
  }, [trendData, movingAvg]);

  const trajectory = useMemo(() => {
    return analyticsService.calculateTrendTrajectory(trendData.map(d => ({ date: d.date, value: d.volume })));
  }, [trendData, analyticsService]);

  const plateaus = useMemo(() => {
    const exerciseIds = Array.from(new Set(Object.values(sessions).flatMap(s => Object.keys(s.exerciseData || {}))));
    return exerciseIds
      .map(id => analyticsService.detectPlateaus(sessions, id))
      .filter(p => p.isPlateau);
  }, [sessions, analyticsService]);

  const significantDrops = useMemo(() => {
    return analyticsService.detectSignificantDrops(trendData.map(d => ({ value: d.intensity, date: d.date })));
  }, [trendData, analyticsService]);

  const insights = useMemo(() => {
    const list: string[] = [];
    if (trendData.length < 2) {
      list.push("Complete more workouts to see trend analysis and insights.");
      return list;
    }

    if (trajectory.trajectory === 'upward') {
      list.push(`Your overall training volume is trending upward by ${trajectory.changePercentage.toFixed(1)}% this ${period.toLowerCase()}. Great work!`);
    } else if (trajectory.trajectory === 'downward') {
      list.push(`Training volume has decreased by ${Math.abs(trajectory.changePercentage).toFixed(1)}% recently. Consider if you need a deload or if lifestyle factors are interfering.`);
    } else {
      list.push("Your training volume is stable. Consistency is key to long-term progress!");
    }

    if (plateaus.length > 0) {
      list.push(`You have hit plateaus on ${plateaus.length} exercises (including ${plateaus[0].exerciseId.replace(/-/g, ' ')}). Try changing your rep ranges or exercise variations to break through.`);
    } else {
      list.push("No significant plateaus detected. You're maintaining good progress across your exercises.");
    }

    if (significantDrops.length > 0) {
      list.push(`Alert: We detected ${significantDrops.length} significant drop(s) in your training intensity. Ensure you are getting enough recovery.`);
    }

    return list;
  }, [trajectory, plateaus, significantDrops, period, trendData.length]);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={3}>Trend Analysis</Title>
          <Text size="sm" c="dimmed">Track your progress trajectories and identify plateaus</Text>
        </Stack>
        <Group align="flex-end">
          <Select 
            label="Muscle Group"
            data={muscleGroups}
            value={selectedMuscle}
            onChange={(val) => setSelectedMuscle(val || 'All')}
            w={150}
          />
          <Select
            label="Smoothing"
            data={[
              { label: '7-day MA', value: '7' },
              { label: '30-day MA', value: '30' }
            ]}
            value={maWindow}
            onChange={(val) => setMaWindow(val as '7' | '30')}
            w={120}
          />
          <SegmentedControl 
            value={chartType}
            onChange={(val) => setChartType(val as any)}
            data={[
              { label: 'Area', value: 'area' },
              { label: 'Line', value: 'line' },
              { label: 'Scatter', value: 'scatter' }
            ]}
          />
          <SegmentedControl 
            value={period} 
            onChange={(value) => setPeriod(value as TimePeriod)}
            data={['Week', 'Month', 'Year', 'All Time']} 
          />
        </Group>
      </Group>

      <AttentionAlerts plateaus={plateaus} significantDrops={significantDrops} />

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <TrajectoryChart 
            data={chartData} 
            title="Training Volume & Intensity" 
            trajectory={trajectory.trajectory}
            changePercentage={trajectory.changePercentage}
            type={chartType}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TrendInsightSummary insights={insights} />
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default TrendAnalysisTab;

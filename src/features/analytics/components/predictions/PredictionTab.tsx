import React, { useMemo, useState, useEffect } from 'react';
import { Stack, Grid, Group, Title, Text, Button, Select, NumberInput, Card, SimpleGrid, ActionIcon, Modal, SegmentedControl, Paper, Badge } from '@mantine/core';
import { Plus, Trash2, Target, BrainCircuit, Trophy } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { AnalyticsService, TimePeriod } from '../../services/AnalyticsService';
import { PredictionService } from '../../services/PredictionService';
import { 
  addTarget, 
  removeTarget, 
  setPrediction, 
  setTargetEstimation,
  fetchPredictionExplanation 
} from '../../store/analyticsSlice';
import ForecastChart from './ForecastChart';
import MilestoneProjectionCard from './MilestoneProjectionCard';
import PredictionExplanation from './PredictionExplanation';
import { v4 as uuidv4 } from 'uuid';

interface PredictionTabProps {
  period: TimePeriod;
  setPeriod: (period: TimePeriod) => void;
}

const PredictionTab: React.FC<PredictionTabProps> = ({ period, setPeriod }) => {
  const dispatch = useAppDispatch();
  const sessions = useAppSelector(state => state.session.sessions || {});
  const { targets, predictions, targetEstimations, explanations, loading } = useAppSelector(state => state.analytics);
  
  const [opened, setOpened] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [targetValue, setTargetValue] = useState<number>(0);
  const [selectedMetric, setSelectedMetric] = useState<'weight' | 'volume' | 'reps'>('weight');
  const [modelType, setModelType] = useState<'linear' | 'exponential'>('linear');

  const analyticsService = AnalyticsService.getInstance();
  const predictionService = PredictionService.getInstance();

  // Get all unique exercises from history
  const exerciseOptions = useMemo(() => {
    const exercises = new Set<string>();
    Object.values(sessions).forEach(s => {
      Object.keys(s.exerciseData || {}).forEach(id => exercises.add(id));
    });
    return Array.from(exercises).map(id => ({
      value: id,
      label: id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [sessions]);

  // Calculate predictions for each target
  useEffect(() => {
    targets.forEach(target => {
      const strengthGains = analyticsService.calculateStrengthGains(sessions, target.exerciseId, 'All Time');
      const plateauInfo = analyticsService.detectPlateaus(sessions, target.exerciseId);
      
      let rawData: { date: string; value: number }[] = [];
      if (target.metric === 'weight') rawData = strengthGains.maxWeightTrend;
      else if (target.metric === 'volume') rawData = strengthGains.volumeTrend;
      else if (target.metric === 'reps') rawData = (strengthGains as any).repsTrend || [];

      const data = rawData.map(d => ({ date: d.date, value: d.value }));
      
      if (data.length >= 2) {
        const prediction = predictionService.predictFuturePerformance(data, 30, modelType, plateauInfo.isPlateau);
        const estimation = predictionService.estimateDateForTarget(data, target.targetValue, plateauInfo.isPlateau);
        
        dispatch(setPrediction({ exerciseId: target.exerciseId, prediction }));
        dispatch(setTargetEstimation({ targetId: target.id, estimation }));

        // Fetch AI explanation if not already present
        if (!explanations[target.exerciseName]) {
          dispatch(fetchPredictionExplanation({ 
            exerciseName: target.exerciseName, 
            prediction, 
            target: estimation,
            isPlateau: plateauInfo.isPlateau
          }));
        }
      }
    });
  }, [targets, sessions, modelType, dispatch, explanations, analyticsService, predictionService]);

  const handleAddTarget = () => {
    if (!selectedExercise || targetValue <= 0) return;

    const exerciseLabel = exerciseOptions.find(opt => opt.value === selectedExercise)?.label || selectedExercise;

    dispatch(addTarget({
      id: uuidv4(),
      exerciseId: selectedExercise,
      exerciseName: exerciseLabel,
      targetValue,
      metric: selectedMetric
    }));

    setOpened(false);
    setSelectedExercise(null);
    setTargetValue(0);
    setSelectedMetric('weight');
  };

  const upcomingMilestones = useMemo(() => {
    return Object.entries(targetEstimations)
      .map(([id, estimation]) => {
        const target = targets.find(t => t.id === id);
        return { ...estimation, exerciseName: target?.exerciseName || 'Unknown' };
      })
      .filter(m => m.estimatedDate !== 'Never' && m.estimatedDate !== '')
      .sort((a, b) => new Date(a.estimatedDate).getTime() - new Date(b.estimatedDate).getTime())
      .slice(0, 3);
  }, [targetEstimations, targets]);

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={3}>Progress Predictions</Title>
          <Text size="sm" c="dimmed">AI-powered forecasting based on your historical performance</Text>
        </Stack>
        <Group>
          <SegmentedControl 
            value={modelType}
            onChange={(val) => setModelType(val as 'linear' | 'exponential')}
            data={[
              { label: 'Linear', value: 'linear' },
              { label: 'Exponential', value: 'exponential' }
            ]}
          />
          <Button leftSection={<Plus size={18} />} onClick={() => setOpened(true)}>
            Set New Goal
          </Button>
        </Group>
      </Group>

      {upcomingMilestones.length > 0 && (
        <Paper withBorder p="md" radius="md" bg="blue.0">
          <Stack gap="xs">
            <Group gap="xs">
              <Trophy size={18} className="text-blue-600" />
              <Text fw={700}>Upcoming Predicted Milestones</Text>
            </Group>
            <Group gap="lg">
              {upcomingMilestones.map((m, i) => (
                <Group key={i} gap="xs">
                  <Badge color="blue" variant="filled">{new Date(m.estimatedDate).toLocaleDateString()}</Badge>
                  <Text size="sm" fw={600}>{m.exerciseName}: {m.targetValue}</Text>
                </Group>
              ))}
            </Group>
          </Stack>
        </Paper>
      )}

      {targets.length === 0 ? (
        <Card withBorder p="xl" radius="md" style={{ textAlign: 'center' }}>
          <Stack align="center" gap="sm">
            <Target size={48} color="var(--mantine-color-blue-2)" />
            <Text fw={700} size="lg">No Goals Set Yet</Text>
            <Text c="dimmed" maw={400}>
              Set a target for an exercise (e.g., "100kg Bench Press") to see AI predictions on when you'll reach it.
            </Text>
            <Button variant="light" mt="md" onClick={() => setOpened(true)}>Set Your First Goal</Button>
          </Stack>
        </Card>
      ) : (
        <Stack gap="xl">
          {targets.map(target => {
            const prediction = predictions[target.exerciseId];
            const estimation = targetEstimations[target.id];
            const strengthGains = analyticsService.calculateStrengthGains(sessions, target.exerciseId, 'All Time');
            
            let rawData: { date: string; value: number }[] = [];
            if (target.metric === 'weight') rawData = strengthGains.maxWeightTrend;
            else if (target.metric === 'volume') rawData = strengthGains.volumeTrend;
            else if (target.metric === 'reps') rawData = (strengthGains as any).repsTrend || [];

            const historicalData = rawData.map(d => ({ date: d.date, value: d.value }));
            const unit = target.metric === 'weight' ? 'kg' : target.metric === 'volume' ? 'kg*reps' : 'reps';

            return (
              <Card key={target.id} withBorder p="lg" radius="md">
                <Stack gap="lg">
                  <Group justify="space-between">
                    <Group>
                      <Target size={24} color="var(--mantine-color-blue-6)" />
                      <Title order={4}>{target.exerciseName} Journey ({target.metric})</Title>
                    </Group>
                    <ActionIcon variant="subtle" color="red" onClick={() => dispatch(removeTarget(target.id))}>
                      <Trash2 size={18} />
                    </ActionIcon>
                  </Group>

                  <Grid gutter="lg">
                    <Grid.Col span={{ base: 12, lg: 8 }}>
                      {prediction && (
                        <ForecastChart 
                          historicalData={historicalData}
                          predictionData={prediction.points}
                          title={`Forecast: ${target.exerciseName}`}
                          confidence={prediction.confidence}
                          unit={unit}
                        />
                      )}
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, lg: 4 }}>
                      <Stack gap="md">
                        {estimation && (
                          <MilestoneProjectionCard 
                            estimation={estimation}
                            exerciseName={target.exerciseName}
                            metric={unit}
                            currentValue={historicalData[historicalData.length - 1]?.value || 0}
                          />
                        )}
                        <PredictionExplanation 
                          explanation={explanations[target.exerciseName]} 
                          loading={loading}
                          exerciseName={target.exerciseName}
                        />
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      )}

      <Modal opened={opened} onClose={() => setOpened(false)} title="Set Progress Goal" centered>
        <Stack gap="md">
          <Select 
            label="Exercise"
            placeholder="Select an exercise"
            data={exerciseOptions}
            value={selectedExercise}
            onChange={setSelectedExercise}
            searchable
          />
          <Select
            label="Metric"
            data={[
              { label: 'Max Weight (Strength)', value: 'weight' },
              { label: 'Total Volume', value: 'volume' },
              { label: 'Max Reps (Endurance)', value: 'reps' }
            ]}
            value={selectedMetric}
            onChange={(val) => setSelectedMetric(val as any)}
          />
          <NumberInput 
            label={`Target ${selectedMetric === 'weight' ? 'Weight (kg)' : selectedMetric === 'volume' ? 'Volume' : 'Reps'}`}
            placeholder="e.g. 100"
            value={targetValue}
            onChange={(val) => setTargetValue(Number(val))}
            min={0}
          />
          <Button fullWidth onClick={handleAddTarget} mt="md">
            Create Prediction Goal
          </Button>
        </Stack>
      </Modal>

      <Group gap="xs" c="dimmed">
        <BrainCircuit size={16} />
        <Text size="xs">
          AI models analyze your historical data points to project future performance. The more data you provide, the more accurate the predictions become.
        </Text>
      </Group>
    </Stack>
  );
};

export default PredictionTab;

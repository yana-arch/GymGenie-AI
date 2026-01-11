import React, { useMemo } from 'react';
import { Switch, Stack, Text, Group, Title, Card, Tooltip, Alert, Button, Divider } from '@mantine/core';
import { Brain, Sparkles, LineChart, Info, ShieldAlert, Activity, Wand2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleFeature, setFeature } from '@/features/ui/store/featureFlagSlice';

const AISettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const flags = useAppSelector((state) => state.featureFlags);

  const isAnyAIEnabled = useMemo(() => {
    return flags.enableCoaching || flags.enablePersonalization || flags.enableAnalytics || flags.enableFormCorrection || flags.enableInjuryAwareness;
  }, [flags]);

  const handleToggle = (feature: keyof typeof flags) => {
    dispatch(toggleFeature(feature));
  };

  const handleEnableAll = () => {
    dispatch(setFeature({ feature: 'enableCoaching', enabled: true }));
    dispatch(setFeature({ feature: 'enablePersonalization', enabled: true }));
    dispatch(setFeature({ feature: 'enableAnalytics', enabled: true }));
    dispatch(setFeature({ feature: 'enableFormCorrection', enabled: true }));
    dispatch(setFeature({ feature: 'enableInjuryAwareness', enabled: true }));
  };

  return (
    <Card withBorder padding="lg" radius="md" className="bg-white dark:bg-gray-800">
      <Stack gap="md">
        <Group justify="space-between">
          <Title order={3} className="text-gray-900 dark:text-gray-100">AI Features</Title>
          <Tooltip label="Enable AI to get personalized workout adaptations and insights.">
            <Info size={16} className="text-gray-400" />
          </Tooltip>
        </Group>

        {!isAnyAIEnabled && (
          <Alert icon={<Wand2 size={16} />} title="Experience GymGenie AI" color="brand" variant="light" radius="md">
            <Stack gap="xs">
              <Text size="sm">
                Unlock the full power of your workout with real-time coaching, form correction, and personalized insights.
              </Text>
              <Button size="xs" variant="filled" color="brand" onClick={handleEnableAll} className="w-fit">
                Enable All AI Features
              </Button>
            </Stack>
          </Alert>
        )}

        <Text size="sm" color="dimmed" mb="md">
          Control which AI capabilities are enabled. We recommend starting with one feature at a time to build trust.
        </Text>

        <Stack gap="xl">
          {/* AI Coaching */}
          <Group justify="space-between" wrap="nowrap">
            <Group wrap="nowrap">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                <Brain size={20} />
              </div>
              <Stack gap={0}>
                <Text fw={600} size="sm">AI Coaching</Text>
                <Text size="xs" color="dimmed">Real-time adaptations and guidance</Text>
              </Stack>
            </Group>
            <Switch
              checked={flags.enableCoaching}
              onChange={() => handleToggle('enableCoaching')}
              size="md"
            />
          </Group>

          {/* Personalization */}
          <Group justify="space-between" wrap="nowrap">
            <Group wrap="nowrap">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg text-purple-600 dark:text-purple-300">
                <Sparkles size={20} />
              </div>
              <Stack gap={0}>
                <Text fw={600} size="sm">Personalization</Text>
                <Text size="xs" color="dimmed">Preference learning and historical patterns</Text>
              </Stack>
            </Group>
            <Switch
              checked={flags.enablePersonalization}
              onChange={() => handleToggle('enablePersonalization')}
              size="md"
            />
          </Group>

          {/* Analytics */}
          <Group justify="space-between" wrap="nowrap">
            <Group wrap="nowrap">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg text-green-600 dark:text-green-300">
                <LineChart size={20} />
              </div>
              <Stack gap={0}>
                <Text fw={600} size="sm">Analytics</Text>
                <Text size="xs" color="dimmed">Progress predictions and trend analysis</Text>
              </Stack>
            </Group>
            <Switch
              checked={flags.enableAnalytics}
              onChange={() => handleToggle('enableAnalytics')}
              size="md"
            />
          </Group>

          <Divider label="Advanced AI Controls" labelPosition="center" />

          {/* Form Correction */}
          <Group justify="space-between" wrap="nowrap">
            <Group wrap="nowrap">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg text-orange-600 dark:text-orange-300">
                <Activity size={20} />
              </div>
              <Stack gap={0}>
                <Text fw={600} size="sm">AI Form Guard</Text>
                <Text size="xs" color="dimmed">Computer vision for real-time form checks</Text>
              </Stack>
            </Group>
            <Switch
              checked={flags.enableFormCorrection}
              onChange={() => handleToggle('enableFormCorrection')}
              size="md"
            />
          </Group>

          {/* Injury Awareness */}
          <Group justify="space-between" wrap="nowrap">
            <Group wrap="nowrap">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg text-red-600 dark:text-red-300">
                <ShieldAlert size={20} />
              </div>
              <Stack gap={0}>
                <Text fw={600} size="sm">Injury Awareness</Text>
                <Text size="xs" color="dimmed">Safe workout modifications based on injuries</Text>
              </Stack>
            </Group>
            <Switch
              checked={flags.enableInjuryAwareness}
              onChange={() => handleToggle('enableInjuryAwareness')}
              size="md"
            />
          </Group>
        </Stack>
      </Stack>
    </Card>
  );
};

export default React.memo(AISettings);

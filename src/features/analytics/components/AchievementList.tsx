import React from 'react';
import { Stack, Title, SimpleGrid, Paper, Group, Text, ThemeIcon, Badge, Avatar } from '@mantine/core';
import { Trophy, Star, Zap, Activity, Calendar } from 'lucide-react';
import { Achievement } from '../types/achievement.types';
import { useAppSelector } from '@/store';

interface AchievementListProps {
  achievements?: Achievement[];
}

const AchievementList: React.FC<AchievementListProps> = ({ achievements: providedAchievements }) => {
  const storedAchievements = useAppSelector(state => state.achievement.earnedAchievements);
  const achievements = providedAchievements || storedAchievements;

  if (achievements.length === 0) {
    return (
      <Paper withBorder p="xl" radius="md" bg="gray.0">
        <Stack align="center" gap="xs">
          <Trophy size={48} className="text-gray-400" />
          <Title order={3} ta="center">No Achievements Yet</Title>
          <Text c="dimmed" ta="center">
            Keep training to unlock milestones for consistency, volume, streaks, and personal bests!
          </Text>
        </Stack>
      </Paper>
    );
  }

  // Group by type for better organization
  const grouped = achievements.reduce((acc, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const getIcon = (type: string) => {
    switch (type) {
      case 'CONSISTENCY': return <Activity size={20} />;
      case 'VOLUME': return <Zap size={20} />;
      case 'STREAK': return <Star size={20} />;
      case 'PERSONAL_BEST': return <Trophy size={20} />;
      default: return <Trophy size={20} />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'CONSISTENCY': return 'blue';
      case 'VOLUME': return 'grape';
      case 'STREAK': return 'orange';
      case 'PERSONAL_BEST': return 'yellow';
      default: return 'brand';
    }
  };

  return (
    <Stack gap="xl">
      {Object.entries(grouped).map(([type, items]) => (
        <Stack key={type} gap="md">
          <Group gap="xs">
            <ThemeIcon variant="light" color={getColor(type)} radius="md">
              {getIcon(type)}
            </ThemeIcon>
            <Title order={3}>{type.replace('_', ' ')}</Title>
            <Badge variant="outline" color={getColor(type)}>{items.length}</Badge>
          </Group>
          
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {items.sort((a, b) => b.timestamp - a.timestamp).map((achievement) => (
              <Paper 
                key={achievement.earnedId} 
                withBorder 
                p="md" 
                radius="md" 
                className="hover:shadow-md transition-shadow"
              >
                <Group wrap="nowrap" align="flex-start">
                  <Avatar 
                    radius="md" 
                    size="lg" 
                    color={getColor(type)} 
                    variant="light"
                  >
                    {getIcon(type)}
                  </Avatar>
                  <Stack gap={2} style={{ flex: 1 }}>
                    <Text fw={700} size="md">{achievement.label}</Text>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {achievement.description}
                    </Text>
                    <Group gap={4} mt={4}>
                      <Calendar size={12} className="text-gray-400" />
                      <Text size="xs" c="dimmed">
                        {new Date(achievement.timestamp).toLocaleDateString()}
                      </Text>
                    </Group>
                  </Stack>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        </Stack>
      ))}
    </Stack>
  );
};

export default AchievementList;

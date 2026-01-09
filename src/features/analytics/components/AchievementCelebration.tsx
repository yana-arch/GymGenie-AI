import React, { useEffect, useState } from 'react';
import { Modal, Text, Title, Stack, Box, Button, Paper } from '@mantine/core';
import { Trophy, Star, Zap, Activity } from 'lucide-react';
import { Achievement } from '../types/achievement.types';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearRecentAchievements } from '../store/achievementSlice';

const AchievementCelebration: React.FC = () => {
  const dispatch = useAppDispatch();
  const recentAchievementIds = useAppSelector(state => state.achievement.recentAchievementIds);
  const earnedAchievements = useAppSelector(state => state.achievement.earnedAchievements);
  
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (recentAchievementIds.length > 0 && !opened) {
      const nextId = recentAchievementIds[0];
      const achievement = earnedAchievements.find(a => a.earnedId === nextId);
      if (achievement) {
        setCurrentAchievement(achievement);
        setOpened(true);
      }
    }
  }, [recentAchievementIds, earnedAchievements, opened]);

  const handleClose = () => {
    setOpened(false);
    // Use a small timeout to allow the exit animation to finish before clearing state
    setTimeout(() => {
      dispatch(clearRecentAchievements());
      setCurrentAchievement(null);
    }, 300);
  };

  if (!currentAchievement) return null;

  const getThemeColor = () => {
    switch (currentAchievement.type) {
      case 'CONSISTENCY': return 'blue';
      case 'VOLUME': return 'grape';
      case 'STREAK': return 'orange';
      case 'PERSONAL_BEST': return 'yellow';
      default: return 'brand';
    }
  };

  const getIcon = () => {
    const size = 64;
    switch (currentAchievement.type) {
      case 'CONSISTENCY': return <Activity size={size} />;
      case 'VOLUME': return <Zap size={size} />;
      case 'STREAK': return <Star size={size} />;
      case 'PERSONAL_BEST': return <Trophy size={size} />;
      default: return <Trophy size={size} />;
    }
  };

  const themeColor = getThemeColor();

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      withCloseButton={false}
      centered
      size="md"
      radius="lg"
      transitionProps={{ transition: 'slide-up', duration: 400, timingFunction: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
      styles={{
        content: {
          overflow: 'visible'
        }
      }}
    >
      <Box className="relative">
        {/* Animated Background Effect */}
        <Box 
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-${themeColor}-500 flex items-center justify-center shadow-xl animate-bounce`}
          style={{ zIndex: 1, backgroundColor: `var(--mantine-color-${themeColor}-6)` }}
        >
          <Box className="text-white">
            {getIcon()}
          </Box>
        </Box>

        <Stack align="center" mt="xl" pt="xl" gap="md">
          <Title order={2} className={`text-${themeColor}-600 uppercase tracking-widest`} style={{ color: `var(--mantine-color-${themeColor}-7)` }}>
            Achievement Unlocked!
          </Title>
          
          <Title order={1} ta="center" size="h1" fw={900}>
            {currentAchievement.label}
          </Title>
          
          <Text size="lg" c="dimmed" ta="center" fw={500}>
            {currentAchievement.description}
          </Text>

          <Paper withBorder p="md" radius="md" bg={`${themeColor}.0`} style={{ borderColor: `var(--mantine-color-${themeColor}-2)` }}>
             <Text size="md" fs="italic" ta="center" c={`${themeColor}.9`} fw={600}>
                "{currentAchievement.encouragement}"
             </Text>
          </Paper>

          <Button 
            color={themeColor} 
            size="lg" 
            radius="md" 
            fullWidth 
            onClick={handleClose}
            mt="md"
            className="hover:scale-105 transition-transform"
          >
            Keep Crushing It!
          </Button>
        </Stack>

        {/* Floating Emojis Animation */}
        <Box className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
           <Text className="animate-ping absolute top-0 left-0">✨</Text>
           <Text className="animate-ping absolute top-10 right-0" style={{ animationDelay: '0.5s' }}>🎉</Text>
           <Text className="animate-ping absolute -bottom-10 left-10" style={{ animationDelay: '1s' }}>🎊</Text>
           <Text className="animate-ping absolute -bottom-5 right-10" style={{ animationDelay: '1.5s' }}>🌟</Text>
        </Box>
      </Box>
    </Modal>
  );
};

export default AchievementCelebration;

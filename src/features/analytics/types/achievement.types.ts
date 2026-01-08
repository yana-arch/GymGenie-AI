export type AchievementType = 'CONSISTENCY' | 'VOLUME' | 'STREAK' | 'PERSONAL_BEST';

export interface AchievementDefinition {
  id: string;
  type: AchievementType;
  threshold: number | string;
  label: string;
  description: string;
}

export interface Achievement {
  id: string; // References AchievementDefinition.id
  type: AchievementType;
  value: number | string;
  label: string;
  description: string;
  timestamp: number;
  earnedId: string; // Unique ID for this instance
  encouragement: string;
}

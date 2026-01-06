// Injury validation types for the injury-aware adaptation system
export interface Injury {
  id: string;
  type: 'knee' | 'shoulder' | 'back' | 'ankle' | 'wrist' | 'hip' | 'elbow' | 'neck';
  location: 'left' | 'right' | 'center' | 'upper' | 'lower';
  severity: 'mild' | 'moderate' | 'severe';
  date: string; // ISO date string
  status: 'recovering' | 'recovered' | 'chronic';
  restrictions: string[]; // Exercise types or movements to avoid
}

export interface InjuryHistory {
  injuries: Injury[];
}

export interface InjuryConstraints {
  constraints: string[];
  safetyLevel: 'normal' | 'conservative' | 'restricted';
  blockedMovements: string[];
  recommendedAlternatives: string[];
}

export interface AIRecommendation {
  id: string;
  exercise: string;
  variation: string;
  intensity: 'low' | 'moderate' | 'high';
  restTime?: number;
  equipment?: string[];
  targetMuscles?: string[];
}

export interface FilteredRecommendations {
  filtered: AIRecommendation[];
  blocked: Array<{
    recommendation: AIRecommendation;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  constraints: InjuryConstraints;
  processingTime: number;
}

export interface DiscomfortEvent {
  id: string;
  timestamp: number;
  injuryId?: string;
  severity: 1 | 2 | 3 | 4 | 5; // 1 = mild, 5 = severe
  location: string;
  description: string;
  exercise?: string;
  triggers?: string[];
}

export interface DiscomfortResponse {
  adaptationRequired: boolean;
  recommendedActions: string[];
  modifications: {
    reduceIntensity?: boolean;
    alternativeExercise?: string;
    restTime?: number;
    modifications?: string[];
  };
}
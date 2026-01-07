/**
 * Historical Patterns Types
 * TypeScript interfaces and Zod schemas for historical pattern recognition
 */

import { z } from 'zod';

// Workout history entry interface
export interface WorkoutHistoryEntry {
  id: string;
  userId: string;
  workoutId: string;
  completedAt: Date;
  duration: number; // minutes
  exercises: ExerciseSession[];
  performance: WorkoutPerformance;
  aiRecommendations: AIRecommendations[];
  userFeedback?: UserFeedback;
}

export interface ExerciseSession {
  exerciseId: string;
  exerciseName: string;
  exerciseType: 'strength' | 'cardio' | 'flexibility' | 'balance';
  sets: SetData[];
  performance: ExercisePerformance;
  adaptations: AdaptationRecord[];
}

export interface SetData {
  reps?: number;
  weight?: number;
  duration?: number; // for cardio
  distance?: number; // for cardio
  restTime?: number;
  difficulty: number; // 1-10 scale
  formQuality?: number; // 1-10 scale (if form correction enabled)
}

export interface WorkoutPerformance {
  overallScore: number; // 1-10
  completionRate: number; // percentage
  difficulty: number; // 1-10 average
  intensity: number; // 0-1 normalized
  effort: number; // 1-10 RPE
  enjoyment?: number; // 1-10 if provided
}

export interface ExercisePerformance {
  effectiveness: number; // 1-10
  technique: number; // 1-10 
  powerOutput?: number;
  heartRateZones?: HeartRateZoneData;
  perceivedExertion: number; // 1-10
}

export interface HeartRateZoneData {
  zone1: number; // minutes
  zone2: number; // minutes
  zone3: number; // minutes
  zone4: number; // minutes
  zone5: number; // minutes
}

export interface AIRecommendations {
  type: 'intensity' | 'exercise' | 'form' | 'timing' | 'safety';
  recommendation: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  applied: boolean;
  effectiveness?: number; // measured after application
}

export interface UserFeedback {
  overallRating: number; // 1-5
  difficultyRating: number; // 1-5
  enjoymentRating: number; // 1-5
  comments?: string;
  wouldRecommend?: boolean;
}

export interface AdaptationRecord {
  timestamp: Date;
  type: 'intensity' | 'exercise' | 'form' | 'timing' | 'safety';
  original: any;
  adapted: any;
  reason: string;
  effectiveness?: number;
}

// Pattern recognition interfaces
export interface HistoricalPattern {
  id: string;
  userId: string;
  patternType: 'adaptation-trend' | 'performance-correlation' | 'exercise-preference' | 'intensity-progression';
  confidence: number;
  strength: number;
  firstDetected: Date;
  lastConfirmed: Date;
  confirmations: number;
  contradictions: number;
  timeSpan: number; // weeks of data analyzed
  data: PatternData;
}

export interface PatternData {
  adaptationTrends?: AdaptationTrendData;
  performanceCorrelations?: PerformanceCorrelationData;
  exercisePreferences?: ExercisePreferenceData;
  intensityProgression?: IntensityProgressionData;
}

export interface AdaptationTrendData {
  direction: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  rate: number; // rate of change per week
  consistency: number; // how consistent the trend is
  seasonalVariations?: SeasonalVariation[];
  plateaus?: PlateauPeriod[];
}

export interface SeasonalVariation {
  period: string; // e.g., "Monday mornings", "Summer months"
  effect: number; // effect size
  confidence: number;
}

export interface PlateauPeriod {
  startDate: Date;
  endDate: Date;
  characteristics: string[];
  breakFactors?: string[];
}

export interface PerformanceCorrelationData {
  correlations: CorrelationEntry[];
  strongestCorrelation: CorrelationEntry;
  insights: string[];
}

export interface CorrelationEntry {
  factor: string; // e.g., "AI intensity adaptations", "Exercise selection changes"
  correlation: number; // -1 to 1
  significance: number; // p-value equivalent
  sampleSize: number;
  description: string;
}

export interface ExercisePreferenceData {
  preferredExercises: ExercisePreference[];
  avoidedExercises: ExercisePreference[];
  seasonalPreferences?: SeasonalExercisePreference[];
  progressionPreferences?: ProgressionPreference[];
}

export interface ExercisePreference {
  exerciseId: string;
  exerciseName: string;
  preference: 'preferred' | 'avoided' | 'neutral';
  confidence: number;
  reasoning: string;
  context?: string; // e.g., "morning workouts", "high energy days"
}

export interface SeasonalExercisePreference {
  seasonOrCondition: string;
  exercises: ExercisePreference[];
}

export interface ProgressionPreference {
  progressionType: 'weight' | 'reps' | 'duration' | 'difficulty';
  preference: 'gradual' | 'rapid' | 'variable';
  optimalRate: number; // % change per week
}

export interface IntensityProgressionData {
  currentLevel: number;
  targetLevel: number;
  progressionRate: number;
  optimalZone: { min: number; max: number };
  zoneComfort: number; // how comfortable user is in current zone
  adaptationResponses: IntensityAdaptationResponse[];
}

export interface IntensityAdaptationResponse {
  date: Date;
  originalIntensity: number;
  adaptedIntensity: number;
  userResponse: 'positive' | 'neutral' | 'negative';
  performanceImpact: number;
}

// Pattern analysis result
export interface PatternAnalysis {
  userId: string;
  analysisPeriod: { start: Date; end: Date };
  totalWorkouts: number;
  detectedPatterns: HistoricalPattern[];
  updatedPatterns: HistoricalPattern[];
  invalidatedPatterns: string[];
  insights: PatternInsight[];
  recommendations: PatternRecommendation[];
  confidenceUpdates: ConfidenceUpdate[];
}

export interface PatternInsight {
  type: 'adaptation-effectiveness' | 'preference-consistency' | 'progress-plateau' | 'performance-trend' | 'data-insufficiency' | 'time-span-insufficiency' | 'analysis-error';
  insight: string;
  supportingData: any;
  confidence: number;
  actionable: boolean;
}

export interface PatternRecommendation {
  type: 'training-adjustment' | 'preference-honor' | 'plateau-break' | 'trend-acceleration';
  recommendation: string;
  rationale: string;
  expectedImpact: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export interface ConfidenceUpdate {
  patternId: string;
  patternType: string;
  oldConfidence: number;
  newConfidence: number;
  reason: string;
}

// Service interfaces
export interface IHistoricalPatternsService {
  analyzePatterns(userId: string, workoutHistory: WorkoutHistoryEntry[]): Promise<PatternAnalysis>;
  getPatterns(userId: string): Promise<HistoricalPattern[]>;
  updatePattern(userId: string, patternId: string, updates: Partial<HistoricalPattern>): Promise<void>;
  deletePattern(userId: string, patternId: string): Promise<void>;
  exportPatterns(userId: string): Promise<string>;
  importPatterns(userId: string, encryptedData: string): Promise<void>;
}

export interface IHistoricalDataAggregationService {
  aggregateByTimePeriod(
    workoutHistory: WorkoutHistoryEntry[],
    period: 'week' | 'month' | 'quarter'
  ): Promise<AggregatedData[]>;
  calculatePerformanceTrends(workoutHistory: WorkoutHistoryEntry[]): Promise<PerformanceTrend[]>;
  extractAdaptationHistory(workoutHistory: WorkoutHistoryEntry[]): Promise<AdaptationHistory>;
}

export interface AggregatedData {
  period: string;
  startDate: Date;
  endDate: Date;
  workoutCount: number;
  totalDuration: number;
  averagePerformance: number;
  adaptationFrequency: number;
  performanceImprovement: number;
}

export interface PerformanceTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  rate: number; // change per week
  confidence: number;
}

export interface AdaptationHistory {
  totalAdaptations: number;
  adaptationTypes: Record<string, number>;
  adaptationEffectiveness: Record<string, number>;
  timeline: AdaptationTimelineEntry[];
}

export interface AdaptationTimelineEntry {
  date: Date;
  adaptations: number;
  averageEffectiveness: number;
  types: string[];
}

// Configuration
export interface HistoricalPatternConfig {
  minWorkoutsForAnalysis: number;
  confidenceThreshold: number;
  minTimeSpanWeeks: number;
  maxContradictions: number;
  learningRate: number;
  analysisWindow: number; // weeks to look back
  patternValidationThreshold: number;
  privacyLevel: 'standard' | 'enhanced' | 'maximum';
}

// Zod Schemas
export const WorkoutHistoryEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  workoutId: z.string(),
  completedAt: z.date(),
  duration: z.number().min(0),
  exercises: z.array(z.any()), // Will be refined later
  performance: z.object({
    overallScore: z.number().min(1).max(10),
    completionRate: z.number().min(0).max(1),
    difficulty: z.number().min(1).max(10),
    intensity: z.number().min(0).max(1),
    effort: z.number().min(1).max(10),
    enjoyment: z.number().min(1).max(10).optional(),
  }),
  aiRecommendations: z.array(z.any()), // Will be refined later
  userFeedback: z.object({
    overallRating: z.number().min(1).max(5),
    difficultyRating: z.number().min(1).max(5),
    enjoymentRating: z.number().min(1).max(5),
    comments: z.string().optional(),
    wouldRecommend: z.boolean().optional(),
  }).optional(),
});

export const HistoricalPatternSchema = z.object({
  id: z.string(),
  userId: z.string(),
  patternType: z.enum(['adaptation-trend', 'performance-correlation', 'exercise-preference', 'intensity-progression']),
  confidence: z.number().min(0).max(1),
  strength: z.number().min(0).max(1),
  firstDetected: z.date(),
  lastConfirmed: z.date(),
  confirmations: z.number().min(0),
  contradictions: z.number().min(0),
  timeSpan: z.number().min(1),
  data: z.any(), // Pattern-specific data
});

export const PatternAnalysisSchema = z.object({
  userId: z.string(),
  analysisPeriod: z.object({
    start: z.date(),
    end: z.date(),
  }),
  totalWorkouts: z.number().min(0),
  detectedPatterns: z.array(HistoricalPatternSchema),
  updatedPatterns: z.array(HistoricalPatternSchema),
  invalidatedPatterns: z.array(z.string()),
  insights: z.array(z.any()),
  recommendations: z.array(z.any()),
  confidenceUpdates: z.array(z.any()),
});

// Error types
export class HistoricalPatternError extends Error {
  constructor(
    message: string,
    public code: string,
    public cause?: Error | unknown
  ) {
    super(message);
    this.name = 'HistoricalPatternError';
  }
}
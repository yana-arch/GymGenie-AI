import { faker } from '@faker-js/faker';
import { BaseFactory } from './BaseFactory';
import { 
  FeedbackData, 
  FeedbackType,
  FeedbackContext,
  FeedbackProcessingResult,
  FeedbackPattern,
  FeedbackImpact,
  EnhancedPatternData,
  FeedbackValidationResult,
  FeedbackConflictResolution,
  SafetyOverrideEvent,
  FeedbackSettings,
  FeedbackPersonalizationState
} from '@/features/feedback-driven-personalization/types/feedbackPersonalization.types';

/**
 * Factory for creating FeedbackData instances
 */
export class FeedbackFactory extends BaseFactory<FeedbackData> {
  protected getDefaults(): FeedbackData {
    const timestamps = this.generateTimestamps();
    
    return {
      id: this.generateId('feedback'),
      workoutId: this.generateId('workout'),
      exerciseId: this.generateId('exercise'),
      type: this.randomEnum(FeedbackType),
      rating: this.generateRatingForType(),
      timestamp: new Date(timestamps.createdAt).toISOString(),
      context: this.generateFeedbackContext(),
      comments: faker.helpers.maybe(() => this.generateCommentsForType()),
      tags: faker.helpers.maybe(() => this.generateTagsForType()),
      priority: faker.helpers.arrayElement(['high', 'medium', 'low'])
    };
  }

  /**
   * Generate appropriate rating based on feedback type
   */
  private generateRatingForType(): number {
    return faker.number.int({ min: 1, max: 5 });
  }

  /**
   * Generate realistic feedback context
   */
  private generateFeedbackContext(): FeedbackContext {
    const currentWeight = faker.helpers.maybe(() => faker.number.int({ min: 5, max: 200 }));
    const currentReps = faker.helpers.maybe(() => faker.number.int({ min: 1, max: 20 }));
    const currentSets = faker.helpers.maybe(() => faker.number.int({ min: 1, max: 5 }));
    
    return {
      currentWeight,
      currentReps,
      currentSets,
      userFatigue: faker.helpers.maybe(() => faker.number.float({ min: 0, max: 1, fractionDigits: 2 })),
      timeOfDay: faker.helpers.arrayElement(['morning', 'afternoon', 'evening']),
      previousPerformance: faker.helpers.maybe(() => ({
        sets: currentSets ? faker.number.int({ min: 1, max: currentSets }) : faker.number.int({ min: 1, max: 5 }),
        reps: currentReps ? faker.number.int({ min: 1, max: currentReps }) : faker.number.int({ min: 1, max: 20 }),
        weight: currentWeight ? faker.number.int({ min: Math.max(5, currentWeight - 20), max: currentWeight + 10 }) : faker.number.int({ min: 5, max: 200 })
      })),
      heartRateZones: faker.helpers.maybe(() => ({
        current: faker.number.int({ min: 60, max: 180 }),
        max: faker.number.int({ min: 180, max: 220 }),
        zones: [
          { name: 'Rest', min: 50, max: 100 },
          { name: 'Fat Burn', min: 100, max: 140 },
          { name: 'Cardio', min: 140, max: 170 },
          { name: 'Peak', min: 170, max: 200 }
        ]
      })),
      environmental: faker.helpers.maybe(() => ({
        temperature: faker.number.int({ min: 15, max: 35 }),
        humidity: faker.number.int({ min: 20, max: 80 }),
        gymLocation: faker.helpers.arrayElement(['home', 'commercial_gym', 'outdoor', 'hotel_gym'])
      }))
    };
  }

  /**
   * Generate comments based on feedback type
   */
  private generateCommentsForType(): string {
    const typeComments = {
      [FeedbackType.DIFFICULTY_RATING]: [
        'This felt too easy, need more weight',
        'Perfect difficulty level for me',
        'This was challenging but manageable',
        'Too difficult, need to scale down',
        'Good progressive overload here'
      ],
      [FeedbackType.ENERGY_LEVEL]: [
        'Feeling energetic today',
        'Low energy, probably due to poor sleep',
        'Average energy levels',
        'Surprisingly energetic despite early morning',
        'Fatigue is setting in'
      ],
      [FeedbackType.COMFORT_LEVEL]: [
        'Comfortable throughout the exercise',
        'Some discomfort in the joints',
        'Perfect range of motion',
        'Felt some strain in my back',
        'Very comfortable movement pattern'
      ],
      [FeedbackType.PAIN_FEEDBACK]: [
        'Sharp pain in my shoulder',
        'Mild discomfort in the knee',
        'No pain at all',
        'Slight elbow discomfort',
        'Lower back tightness'
      ],
      [FeedbackType.TECHNIQUE_FEEDBACK]: [
        'Form felt solid and controlled',
        'Need to work on my breathing',
        'Good technique overall',
        'Lost balance on the last rep',
        'Excellent form control'
      ],
      [FeedbackType.MOTIVATION_LEVEL]: [
        'Feeling motivated and focused',
        'Low motivation today',
        'Pushed through despite low energy',
        'Great mental focus',
        'Struggled with motivation'
      ]
    };

    return faker.helpers.arrayElement(typeComments[faker.helpers.arrayElement(Object.values(FeedbackType)) as FeedbackType]);
  }

  /**
   * Generate relevant tags based on feedback type
   */
  private generateTagsForType(): string[] {
    const allTags = [
      'technique', 'form', 'breathing', 'tempo', 'range_of_motion',
      'energy', 'fatigue', 'recovery', 'sleep_quality', 'nutrition',
      'pain', 'discomfort', 'injury_risk', 'joint_health', 'mobility',
      'progress', 'strength', 'endurance', 'volume', 'intensity',
      'environment', 'temperature', 'equipment', 'gym_conditions',
      'psychological', 'motivation', 'focus', 'confidence', 'mood'
    ];

    return faker.helpers.arrayElements(allTags, { min: 1, max: 4 });
  }

  /**
   * Create workout feedback (overall session rating)
   */
  createWorkoutFeedback(overrides: Partial<FeedbackData> = {}): FeedbackData {
    return this.create({
      type: FeedbackType.DIFFICULTY_RATING,
      comments: this.generateCommentsForType(),
      priority: 'medium',
      context: {
        timeOfDay: faker.helpers.arrayElement(['morning', 'afternoon', 'evening']),
        environmental: {
          temperature: faker.number.int({ min: 18, max: 28 }),
          gymLocation: faker.helpers.arrayElement(['home', 'commercial_gym'])
        }
      },
      ...overrides
    });
  }

  /**
   * Create exercise feedback (specific to individual exercise)
   */
  createExerciseFeedback(overrides: Partial<FeedbackData> = {}): FeedbackData {
    return this.create({
      type: this.randomEnum(FeedbackType),
      context: {
        currentWeight: faker.number.int({ min: 10, max: 150 }),
        currentReps: faker.number.int({ min: 5, max: 15 }),
        currentSets: faker.number.int({ min: 2, max: 4 }),
        userFatigue: faker.number.float({ min: 0.1, max: 0.9, fractionDigits: 2 }),
        previousPerformance: {
          sets: faker.number.int({ min: 2, max: 4 }),
          reps: faker.number.int({ min: 5, max: 15 }),
          weight: faker.number.int({ min: 10, max: 150 })
        }
      },
      ...overrides
    });
  }

  /**
   * Create session feedback (overall experience)
   */
  createSessionFeedback(overrides: Partial<FeedbackData> = {}): FeedbackData {
    return this.create({
      type: FeedbackType.ENERGY_LEVEL,
      rating: faker.number.int({ min: 2, max: 5 }),
      comments: faker.helpers.arrayElement([
        'Great session overall',
        'Challenging but rewarding',
        'Need to adjust intensity next time',
        'Perfect workout duration',
        'Felt stronger than expected'
      ]),
      priority: 'low',
      context: {
        userFatigue: faker.number.float({ min: 0.1, max: 0.8, fractionDigits: 2 }),
        timeOfDay: faker.helpers.arrayElement(['morning', 'afternoon', 'evening'])
      },
      ...overrides
    });
  }

  /**
   * Create performance feedback (specific performance metrics)
   */
  createPerformanceFeedback(overrides: Partial<FeedbackData> = {}): FeedbackData {
    return this.create({
      type: FeedbackType.TECHNIQUE_FEEDBACK,
      rating: faker.number.int({ min: 3, max: 5 }),
      context: {
        currentWeight: faker.number.int({ min: 20, max: 200 }),
        currentReps: faker.number.int({ min: 1, max: 20 }),
        currentSets: faker.number.int({ min: 1, max: 5 }),
        previousPerformance: {
          weight: faker.number.int({ min: 20, max: 200 }),
          reps: faker.number.int({ min: 1, max: 20 }),
          sets: faker.number.int({ min: 1, max: 5 })
        }
      },
      comments: faker.helpers.arrayElement([
        'Form improved from last session',
        'Better control on the eccentric phase',
        'Good rep tempo consistency',
        'Need to focus on breathing',
        'Excellent technique throughout'
      ]),
      tags: ['technique', 'form', 'progress'],
      ...overrides
    });
  }

  /**
   * Create pain feedback (for safety testing)
   */
  createPainFeedback(overrides: Partial<FeedbackData> = {}): FeedbackData {
    return this.create({
      type: FeedbackType.PAIN_FEEDBACK,
      rating: faker.number.int({ min: 1, max: 3 }), // Pain feedback typically lower ratings
      priority: 'high',
      comments: faker.helpers.arrayElement([
        'Sharp pain in shoulder during press',
        'Knee discomfort during squats',
        'Lower back strain detected',
        'Elbow tenderness during curls',
        'Neck tension during overhead work'
      ]),
      tags: ['pain', 'safety', 'injury_risk'],
      context: {
        currentWeight: faker.number.int({ min: 5, max: 100 }), // Lower weights for pain scenarios
        currentReps: faker.number.int({ min: 1, max: 10 })
      },
      ...overrides
    });
  }

  /**
   * Create invalid feedback for negative testing
   */
  createInvalidFeedback(overrides: Partial<FeedbackData> = {}): FeedbackData {
    const invalidScenarios = [
      { id: '', workoutId: '', exerciseId: '', type: FeedbackType.DIFFICULTY_RATING, rating: 0 },
      { id: 'valid-id', workoutId: '', exerciseId: '', type: FeedbackType.DIFFICULTY_RATING, rating: 6 },
      { id: 'valid-id', workoutId: 'valid-workout', exerciseId: '', type: FeedbackType.DIFFICULTY_RATING, rating: 3 },
      { id: 'valid-id', workoutId: 'valid-workout', exerciseId: 'valid-exercise', type: null as any, rating: 3 },
      { id: 'valid-id', workoutId: 'valid-workout', exerciseId: 'valid-exercise', type: FeedbackType.DIFFICULTY_RATING, rating: null as any }
    ];

    const baseInvalid = faker.helpers.arrayElement(invalidScenarios);
    
    return this.create({
      ...baseInvalid,
      timestamp: 'invalid-date-format',
      ...overrides
    }) as FeedbackData;
  }

  /**
   * Create edge case feedback (boundary values)
   */
  createEdgeCaseFeedback(overrides: Partial<FeedbackData> = {}): FeedbackData {
    return this.create({
      rating: faker.helpers.arrayElement([1, 5]), // Minimum and maximum ratings
      priority: faker.helpers.arrayElement(['high', 'low']), // Priority extremes
      context: {
        currentWeight: faker.helpers.arrayElement([5, 500]), // Weight extremes
        currentReps: faker.helpers.arrayElement([1, 50]), // Rep extremes
        userFatigue: faker.helpers.arrayElement([0, 1]), // Fatigue boundaries
        previousPerformance: {
          sets: faker.helpers.arrayElement([1, 10]),
          reps: faker.helpers.arrayElement([1, 50]),
          weight: faker.helpers.arrayElement([5, 500])
        }
      },
      comments: faker.helpers.arrayElement([
        '', // Empty comments
        'a'.repeat(1000), // Very long comments
        '🏋️‍♂️💪🔥', // Emoji-only comments
        'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?' // Special characters
      ]),
      tags: faker.helpers.arrayElement([
        [], // Empty tags
        ['single-tag'], // Single tag
        Array.from({ length: 20 }, (_, i) => `tag-${i}`) // Many tags
      ]),
      ...overrides
    });
  }

  /**
   * Create a batch of mixed feedback types for comprehensive testing
   */
  createMixedFeedbackBatch(count: number = 10): FeedbackData[] {
    const feedbackTypes = [
      () => this.createWorkoutFeedback(),
      () => this.createExerciseFeedback(),
      () => this.createSessionFeedback(),
      () => this.createPerformanceFeedback(),
      () => this.createPainFeedback()
    ];

    return Array.from({ length: count }, () => {
      const factory = faker.helpers.arrayElement(feedbackTypes);
      return factory();
    });
  }

  /**
   * Create feedback with specific priority
   */
  createWithPriority(priority: 'high' | 'medium' | 'low', overrides: Partial<FeedbackData> = {}): FeedbackData {
    return this.create({
      priority,
      rating: priority === 'high' ? faker.number.int({ min: 1, max: 3 }) : 
               priority === 'medium' ? faker.number.int({ min: 2, max: 4 }) :
               faker.number.int({ min: 3, max: 5 }),
      ...overrides
    });
  }

  /**
   * Create historical feedback sequence (progressive timeline)
   */
  createHistoricalSequence(days: number = 30, feedbackPerDay: number = 2): FeedbackData[] {
    const feedbacks: FeedbackData[] = [];
    const baseDate = faker.date.past({ years: 0.1 }).getTime();
    
    for (let day = 0; day < days; day++) {
      for (let feedback = 0; feedback < feedbackPerDay; feedback++) {
        const timestamp = new Date(baseDate + (day * 24 * 60 * 60 * 1000) + (feedback * 60 * 60 * 1000));
        
        feedbacks.push(this.create({
          timestamp: timestamp.toISOString(),
          rating: Math.max(1, Math.min(5, 3 + Math.floor(day / 10) - Math.random() * 2)),
          context: {
            currentWeight: 50 + Math.floor(day / 3) * 2.5, // Progressive weight increase
            currentReps: 10 + Math.floor(day / 5), // Progressive rep increase
            previousPerformance: {
              weight: Math.max(20, 50 + Math.floor((day - 1) / 3) * 2.5),
              reps: Math.max(5, 10 + Math.floor((day - 1) / 5)),
              sets: 3
            }
          }
        }));
      }
    }
    
    return feedbacks.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }
}

// Additional factory classes for other feedback-related types

/**
 * Factory for creating FeedbackProcessingResult instances
 */
export class FeedbackProcessingResultFactory extends BaseFactory<FeedbackProcessingResult> {
  protected getDefaults(): FeedbackProcessingResult {
    const processingTime = faker.number.int({ min: 100, max: 2000 });
    
    return {
      success: faker.datatype.boolean(0.8), // 80% success rate
      feedbackId: this.generateId('feedback'),
      confidenceScore: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 }),
      processingTimestamp: new Date().toISOString(),
      error: faker.helpers.maybe(() => faker.helpers.arrayElement([
        'Invalid feedback data',
        'Service unavailable',
        'Processing timeout',
        'Validation failed'
      ])),
      metadata: {
        processingTime,
        contextualFactors: faker.helpers.arrayElements([
          'user_fatigue', 'time_of_day', 'previous_performance', 
          'environmental_conditions', 'exercise_difficulty', 'equipment_available'
        ], { min: 1, max: 3 }),
        appliedWeights: faker.helpers.arrayElements([
          'recency_weight', 'frequency_weight', 'intensity_weight', 
          'consistency_weight', 'progression_weight'
        ], { min: 1, max: 3 }).reduce((acc, key) => {
          acc[key] = faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 });
          return acc;
        }, {} as Record<string, number>),
        performanceCompliant: faker.datatype.boolean(0.9)
      }
    };
  }

  /**
   * Create successful processing result
   */
  createSuccessful(overrides: Partial<FeedbackProcessingResult> = {}): FeedbackProcessingResult {
    const result: FeedbackProcessingResult = {
      success: true,
      feedbackId: this.generateId('feedback'),
      confidenceScore: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 }),
      processingTimestamp: new Date().toISOString(),
      metadata: {
        processingTime: faker.number.int({ min: 100, max: 1000 }),
        contextualFactors: faker.helpers.arrayElements([
          'user_fatigue', 'time_of_day', 'previous_performance', 
          'environmental_conditions', 'exercise_difficulty', 'equipment_available'
        ], { min: 1, max: 3 }),
        appliedWeights: faker.helpers.arrayElements([
          'recency_weight', 'frequency_weight', 'intensity_weight', 
          'consistency_weight', 'progression_weight'
        ], { min: 1, max: 3 }).reduce((acc, key) => {
          acc[key] = faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 });
          return acc;
        }, {} as Record<string, number>),
        performanceCompliant: faker.datatype.boolean(0.9)
      }
    };
    
    return { ...result, ...overrides };
  }

  /**
   * Create failed processing result
   */
  createFailed(overrides: Partial<FeedbackProcessingResult> = {}): FeedbackProcessingResult {
    const result: FeedbackProcessingResult = {
      success: false,
      feedbackId: this.generateId('feedback'),
      confidenceScore: faker.number.float({ min: 0, max: 0.3, fractionDigits: 2 }),
      processingTimestamp: new Date().toISOString(),
      error: faker.helpers.arrayElement([
        'Invalid feedback data',
        'Service unavailable',
        'Processing timeout',
        'Validation failed'
      ]),
      metadata: {
        processingTime: faker.number.int({ min: 100, max: 2000 }),
        contextualFactors: faker.helpers.arrayElements([
          'user_fatigue', 'time_of_day', 'previous_performance', 
          'environmental_conditions', 'exercise_difficulty', 'equipment_available'
        ], { min: 1, max: 3 }),
        appliedWeights: faker.helpers.arrayElements([
          'recency_weight', 'frequency_weight', 'intensity_weight', 
          'consistency_weight', 'progression_weight'
        ], { min: 1, max: 3 }).reduce((acc, key) => {
          acc[key] = faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 });
          return acc;
        }, {} as Record<string, number>),
        performanceCompliant: faker.datatype.boolean(0.9)
      }
    };
    
    return { ...result, ...overrides };
  }
}

/**
 * Factory for creating FeedbackPattern instances
 */
export class FeedbackPatternFactory extends BaseFactory<FeedbackPattern> {
  protected getDefaults(): FeedbackPattern {
    return {
      id: this.generateId('pattern'),
      exerciseId: this.generateId('exercise'),
      feedbackType: this.randomEnum(FeedbackType),
      pattern: this.generateEnhancedPatternData(),
      dataPoints: faker.number.int({ min: 5, max: 100 }),
      lastUpdated: new Date().toISOString()
    };
  }

  private generateEnhancedPatternData(): EnhancedPatternData {
    const averageRating = faker.number.float({ min: 1, max: 5, fractionDigits: 1 });
    const margin = faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 1 });
    
    return {
      trend: faker.helpers.arrayElement(['increasing', 'decreasing', 'stable', 'fluctuating']),
      averageRating,
      confidenceInterval: [
        Math.max(1, averageRating - margin),
        Math.min(5, averageRating + margin)
      ],
      correlationFactors: Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () => ({
        factor: faker.helpers.arrayElement([
          'user_fatigue', 'time_of_day', 'previous_performance', 
          'environmental_conditions', 'exercise_difficulty'
        ]),
        correlation: faker.number.float({ min: -1, max: 1, fractionDigits: 2 }),
        significance: faker.number.float({ min: 0, max: 1, fractionDigits: 2 })
      })),
      volatilityIndex: faker.number.float({ min: 0, max: 2, fractionDigits: 2 }),
      seasonalityPatterns: Array.from({ length: faker.number.int({ min: 0, max: 2 }) }, () => ({
        period: faker.helpers.arrayElement(['weekly', 'monthly', 'daily']),
        pattern: faker.helpers.arrayElement(['progressive_increase', 'plateau', 'decrease', 'fluctuation'])
      })),
      momentumIndicator: faker.number.float({ min: -1, max: 1, fractionDigits: 2 }),
      algorithmConfidence: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 })
    };
  }

  /**
   * Create pattern showing improvement trend
   */
  createImprovingPattern(overrides: Partial<FeedbackPattern> = {}): FeedbackPattern {
    return this.create({
      pattern: {
        trend: 'increasing',
        averageRating: faker.number.float({ min: 3.5, max: 5, fractionDigits: 1 }),
        confidenceInterval: [3.0, 5.0],
        correlationFactors: [{
          factor: 'progressive_overload',
          correlation: faker.number.float({ min: 0.5, max: 0.9, fractionDigits: 2 }),
          significance: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 })
        }],
        volatilityIndex: faker.number.float({ min: 0, max: 0.5, fractionDigits: 2 }),
        seasonalityPatterns: [],
        momentumIndicator: faker.number.float({ min: 0.3, max: 0.8, fractionDigits: 2 }),
        algorithmConfidence: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 })
      },
      ...overrides
    });
  }

  /**
   * Create pattern showing decline trend
   */
  createDecliningPattern(overrides: Partial<FeedbackPattern> = {}): FeedbackPattern {
    return this.create({
      pattern: {
        trend: 'decreasing',
        averageRating: faker.number.float({ min: 1, max: 2.5, fractionDigits: 1 }),
        confidenceInterval: [1.0, 3.0],
        correlationFactors: [{
          factor: 'fatigue_accumulation',
          correlation: faker.number.float({ min: -0.9, max: -0.5, fractionDigits: 2 }),
          significance: faker.number.float({ min: 0.7, max: 1.0, fractionDigits: 2 })
        }],
        volatilityIndex: faker.number.float({ min: 0.5, max: 1.5, fractionDigits: 2 }),
        seasonalityPatterns: [{
          period: 'weekly',
          pattern: 'decrease'
        }],
        momentumIndicator: faker.number.float({ min: -0.8, max: -0.3, fractionDigits: 2 }),
        algorithmConfidence: faker.number.float({ min: 0.5, max: 0.8, fractionDigits: 2 })
      },
      ...overrides
    });
  }
}

/**
 * Factory for creating FeedbackImpact instances
 */
export class FeedbackImpactFactory extends BaseFactory<FeedbackImpact> {
  protected getDefaults(): FeedbackImpact {
    const originalWeight = faker.number.int({ min: 10, max: 200 });
    const originalReps = faker.number.int({ min: 1, max: 20 });
    
    return {
      recommendationId: this.generateId('recommendation'),
      originalWeight,
      originalReps,
      adjustedWeight: this.calculateAdjustedWeight(originalWeight),
      adjustedReps: this.calculateAdjustedReps(originalReps),
      confidence: faker.number.float({ min: 0.1, max: 1.0, fractionDigits: 2 }),
      reasoning: this.generateReasoning(),
      feedbackSources: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => this.generateId('feedback'))
    };
  }

  private calculateAdjustedWeight(originalWeight: number): number {
    const adjustment = faker.number.float({ min: -0.2, max: 0.2, fractionDigits: 1 });
    return Math.max(5, Math.round(originalWeight * (1 + adjustment)));
  }

  private calculateAdjustedReps(originalReps: number): number {
    const adjustment = faker.number.int({ min: -3, max: 3 });
    return Math.max(1, originalReps + adjustment);
  }

  private generateReasoning(): string[] {
    const reasoningOptions = [
      'User reported exercise felt too easy',
      'Progressive overload detected in performance',
      'Fatigue indicators suggest reducing volume',
      'Technique feedback indicates need for lighter weight',
      'Energy levels support increased intensity',
      'Pain feedback requires load reduction',
      'Historical patterns show improvement potential',
      'Environmental conditions favor adjustment'
    ];

    return faker.helpers.arrayElements(reasoningOptions, { min: 1, max: 3 });
  }

  /**
   * Create impact with weight increase
   */
  createWeightIncrease(overrides: Partial<FeedbackImpact> = {}): FeedbackImpact {
    const originalWeight = overrides.originalWeight ?? faker.number.int({ min: 20, max: 150 });
    const adjustedWeight = overrides.adjustedWeight ?? Math.round(originalWeight * 1.1); // 10% increase
    
    return this.create({
      originalWeight,
      adjustedWeight,
      adjustedReps: faker.number.int({ min: 1, max: 20 }),
      confidence: faker.number.float({ min: 0.7, max: 0.9, fractionDigits: 2 }),
      reasoning: ['User reported exercise felt too easy', 'Progressive overload required'],
      ...overrides
    });
  }

  /**
   * Create impact with weight decrease
   */
  createWeightDecrease(overrides: Partial<FeedbackImpact> = {}): FeedbackImpact {
    const originalWeight = overrides.originalWeight ?? faker.number.int({ min: 20, max: 150 });
    const adjustedWeight = overrides.adjustedWeight ?? Math.round(originalWeight * 0.9); // 10% decrease
    
    return this.create({
      originalWeight,
      adjustedWeight,
      adjustedReps: faker.number.int({ min: 1, max: 20 }),
      confidence: faker.number.float({ min: 0.6, max: 0.85, fractionDigits: 2 }),
      reasoning: ['User reported difficulty', 'Form quality degraded at current weight'],
      ...overrides
    });
  }
}

/**
 * Factory for creating validation results
 */
export class FeedbackValidationResultFactory extends BaseFactory<FeedbackValidationResult> {
  protected getDefaults(): FeedbackValidationResult {
    return {
      isValid: faker.datatype.boolean(0.8),
      errors: faker.datatype.boolean(0.2) ? this.generateErrors() : [],
      warnings: faker.datatype.boolean(0.3) ? this.generateWarnings() : [],
      recommendations: faker.datatype.boolean(0.5) ? this.generateRecommendations() : []
    };
  }

  private generateErrors(): string[] {
    return faker.helpers.arrayElements([
      'Missing required field: exerciseId',
      'Invalid rating value: must be 1-5',
      'Invalid feedback type',
      'Timestamp format invalid',
      'Workout ID not found'
    ], { min: 1, max: 2 });
  }

  private generateWarnings(): string[] {
    return faker.helpers.arrayElements([
      'Rating seems inconsistent with performance',
      'Comments suggest pain but no pain flag set',
      'Feedback appears to be duplicate',
      'Unusually low energy reported',
      'Technique concerns detected'
    ], { min: 1, max: 3 });
  }

  private generateRecommendations(): string[] {
    return faker.helpers.arrayElements([
      'Consider reducing weight',
      'Focus on form improvement',
      'Increase rest periods',
      'Check equipment setup',
      'Consider alternative exercise',
      'Monitor fatigue levels'
    ], { min: 1, max: 2 });
  }

  /**
   * Create valid result
   */
  createValid(overrides: Partial<FeedbackValidationResult> = {}): FeedbackValidationResult {
    return this.create({
      isValid: true,
      errors: [],
      ...overrides
    });
  }

  /**
   * Create invalid result
   */
  createInvalid(overrides: Partial<FeedbackValidationResult> = {}): FeedbackValidationResult {
    return this.create({
      isValid: false,
      errors: this.generateErrors(),
      ...overrides
    });
  }
}

// Export singleton instances for easy usage
export const feedbackFactory = new FeedbackFactory();
export const feedbackProcessingResultFactory = new FeedbackProcessingResultFactory();
export const feedbackPatternFactory = new FeedbackPatternFactory();
export const feedbackImpactFactory = new FeedbackImpactFactory();
export const feedbackValidationResultFactory = new FeedbackValidationResultFactory();
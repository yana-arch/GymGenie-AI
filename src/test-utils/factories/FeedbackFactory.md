# FeedbackFactory Documentation

## Overview

The `FeedbackFactory` is a comprehensive test data generation system designed to eliminate hardcoded feedback data in your GymGenie-AI tests. It provides realistic, type-safe feedback data generation with full faker.js integration for diverse testing scenarios.

## Factory Classes

### 1. FeedbackFactory

Main factory for creating `FeedbackData` instances with all required properties.

```typescript
import { feedbackFactory, FeedbackType } from '@/test-utils';

// Create basic feedback
const feedback = feedbackFactory.create();

// Create with overrides
const customFeedback = feedbackFactory.create({
  type: FeedbackType.DIFFICULTY_RATING,
  rating: 5,
  comments: 'Perfect difficulty!'
});

// Create multiple instances
const feedbackBatch = feedbackFactory.createMany(10);
```

#### Specialized Creation Methods

**Workout Feedback**
```typescript
const workoutFeedback = feedbackFactory.createWorkoutFeedback({
  priority: 'high',
  comments: 'Great session overall!'
});
```

**Exercise Feedback**
```typescript
const exerciseFeedback = feedbackFactory.createExerciseFeedback({
  type: FeedbackType.TECHNIQUE_FEEDBACK,
  context: {
    currentWeight: 100,
    currentReps: 10,
    userFatigue: 0.3
  }
});
```

**Session Feedback**
```typescript
const sessionFeedback = feedbackFactory.createSessionFeedback({
  type: FeedbackType.ENERGY_LEVEL,
  rating: 4
});
```

**Performance Feedback**
```typescript
const perfFeedback = feedbackFactory.createPerformanceFeedback({
  type: FeedbackType.TECHNIQUE_FEEDBACK,
  tags: ['technique', 'form', 'progress']
});
```

**Pain Feedback (Safety Testing)**
```typescript
const painFeedback = feedbackFactory.createPainFeedback({
  rating: 4,
  comments: 'Sharp pain in shoulder during press',
  priority: 'high'
});
```

**Invalid Feedback (Negative Testing)**
```typescript
const invalidFeedback = feedbackFactory.createInvalidFeedback();
// Creates feedback with at least one invalid property
```

**Edge Case Feedback**
```typescript
const edgeFeedback = feedbackFactory.createEdgeCaseFeedback({
  rating: 1, // Minimum rating
  priority: 'high',
  context: {
    currentWeight: 500, // Extreme weight
    currentReps: 50 // Extreme reps
  }
});
```

**Mixed Feedback Batch**
```typescript
const mixedBatch = feedbackFactory.createMixedFeedbackBatch(10);
// Creates 10 diverse feedback items of different types
```

**Priority-based Creation**
```typescript
const highPriorityFeedback = feedbackFactory.createWithPriority('high');
const mediumPriorityFeedback = feedbackFactory.createWithPriority('medium');
const lowPriorityFeedback = feedbackFactory.createWithPriority('low');
```

**Historical Sequences**
```typescript
const history = feedbackFactory.createHistoricalSequence(30, 2);
// 30 days of feedback, 2 items per day, with progressive patterns
```

### 2. FeedbackProcessingResultFactory

Creates `FeedbackProcessingResult` instances for testing processing workflows.

```typescript
import { feedbackProcessingResultFactory } from '@/test-utils';

// Successful processing
const successResult = feedbackProcessingResultFactory.createSuccessful({
  confidenceScore: 0.95
});

// Failed processing
const failedResult = feedbackProcessingResultFactory.createFailed({
  error: 'Service unavailable'
});

// Custom processing result
const customResult = feedbackProcessingResultFactory.create({
  success: true,
  confidenceScore: 0.8,
  metadata: {
    processingTime: 500,
    contextualFactors: ['user_fatigue', 'time_of_day']
  }
});
```

### 3. FeedbackPatternFactory

Creates `FeedbackPattern` instances for pattern recognition testing.

```typescript
import { feedbackPatternFactory } from '@/test-utils';

// Basic pattern
const pattern = feedbackPatternFactory.create();

// Improving pattern
const improvingPattern = feedbackPatternFactory.createImprovingPattern({
  dataPoints: 50
});

// Declining pattern
const decliningPattern = feedbackPatternFactory.createDecliningPattern({
  exerciseId: 'bench-press'
});
```

### 4. FeedbackImpactFactory

Creates `FeedbackImpact` instances for testing recommendation adjustments.

```typescript
import { feedbackImpactFactory } from '@/test-utils';

// Basic impact
const impact = feedbackImpactFactory.create();

// Weight increase
const weightIncrease = feedbackImpactFactory.createWeightIncrease({
  originalWeight: 100,
  adjustedWeight: 110,
  confidence: 0.8
});

// Weight decrease
const weightDecrease = feedbackImpactFactory.createWeightDecrease({
  originalWeight: 100,
  adjustedWeight: 90,
  reasoning: ['Form degraded', 'Reduce for safety']
});
```

### 5. FeedbackValidationResultFactory

Creates `FeedbackValidationResult` instances for testing validation logic.

```typescript
import { feedbackValidationResultFactory } from '@/test-utils';

// Valid result
const validResult = feedbackValidationResultFactory.createValid({
  recommendations: ['Continue current progression']
});

// Invalid result
const invalidResult = feedbackValidationResultFactory.createInvalid({
  errors: ['Missing exercise ID', 'Invalid rating'],
  recommendations: ['Check data format']
});

// Custom validation result
const customResult = feedbackValidationResultFactory.create({
  isValid: false,
  errors: ['Invalid timestamp format'],
  warnings: ['Unusually low energy reported'],
  recommendations: ['Verify timestamp format']
});
```

## Integration Examples

### Redux Store Testing

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { feedbackFactory } from '@/test-utils';
import { submitFeedback } from '../store/feedbackPersonalizationSlice';

describe('Redux Feedback Submission', () => {
  it('should handle feedback submission', async () => {
    const store = configureStore({
      reducer: { feedbackPersonalization: feedbackReducer }
    });

    const feedback = feedbackFactory.createExerciseFeedback({
      type: FeedbackType.DIFFICULTY_RATING,
      rating: 2, // Too easy
      comments: 'This felt too easy, need more challenge'
    });

    await store.dispatch(submitFeedback(feedback) as any);
    
    const state = store.getState().feedbackPersonalization;
    expect(state.feedbackHistory).toContainEqual(
      expect.objectContaining({
        type: FeedbackType.DIFFICULTY_RATING,
        rating: 2
      })
    );
  });
});
```

### Service Integration Testing

```typescript
import { feedbackFactory, feedbackProcessingResultFactory } from '@/test-utils';
import { FeedbackIntegrationEngine } from '../services/FeedbackIntegrationEngine';

describe('Feedback Integration Engine', () => {
  it('should process feedback workflow', async () => {
    const engine = new FeedbackIntegrationEngine(mockServices);
    const feedback = feedbackFactory.createExerciseFeedback({
      type: FeedbackType.DIFFICULTY_RATING,
      rating: 2, // Too easy
      context: {
        currentWeight: 50,
        currentReps: 10
      }
    });

    const result = await engine.processFeedbackWorkflow(feedback);
    
    expect(result.success).toBe(true);
    expect(result.impact?.adjustedWeight).toBeGreaterThan(50);
  });
});
```

### Load Testing

```typescript
import { feedbackFactory } from '@/test-utils';

describe('Performance Testing', () => {
  it('should handle high-volume feedback processing', async () => {
    const startTime = Date.now();
    
    const feedbackBatch = feedbackFactory.createMixedFeedbackBatch(100);
    const results = await Promise.all(
      feedbackBatch.map(feedback => service.processFeedback(feedback))
    );

    const processingTime = Date.now() - startTime;
    expect(processingTime).toBeLessThan(5000); // Under 5 seconds
    
    const successRate = results.filter(r => r.success).length / results.length;
    expect(successRate).toBeGreaterThan(0.95); // 95%+ success
  });
});
```

### Safety Testing

```typescript
import { feedbackFactory } from '@/test-utils';

describe('Safety Scenarios', () => {
  it('should handle pain feedback appropriately', async () => {
    const painFeedback = feedbackFactory.createPainFeedback({
      rating: 5, // Critical pain
      comments: 'Sharp knee pain during squats',
      priority: 'high'
    });

    const result = await service.processFeedback(painFeedback);
    
    expect(result.success).toBe(true);
    expect(result.impact?.adjustedWeight).toBeLessThanOrEqual(painFeedback.context?.currentWeight || 0);
    // Verify safety override was triggered
  });
});
```

### Historical Pattern Testing

```typescript
import { feedbackFactory } from '@/test-utils';

describe('Pattern Recognition', () => {
  it('should detect progression patterns', async () => {
    const history = feedbackFactory.createHistoricalSequence(14, 3); // 2 weeks, 3 per day
    
    // Process historical feedback
    for (const feedback of history) {
      await service.processFeedback(feedback);
    }

    const patterns = await service.getPatterns();
    expect(patterns.length).toBeGreaterThan(0);
    
    // Should detect increasing trend
    const difficultyPattern = patterns.find(p => p.feedbackType === FeedbackType.DIFFICULTY_RATING);
    expect(difficultyPattern?.pattern.trend).toBe('increasing');
  });
});
```

## Best Practices

### 1. Use Specific Factory Methods

Instead of generic `create()` with many overrides, use specialized methods:

```typescript
// Good
const painFeedback = feedbackFactory.createPainFeedback({
  rating: 4,
  comments: 'Shoulder discomfort'
});

// Avoid
const painFeedback = feedbackFactory.create({
  type: FeedbackType.PAIN_FEEDBACK,
  rating: 4,
  priority: 'high',
  tags: ['pain', 'safety', 'injury_risk'],
  comments: 'Shoulder discomfort'
});
```

### 2. Leverage Override Pattern

Combine factory methods with targeted overrides for specific test scenarios:

```typescript
const extremeScenario = feedbackFactory.createEdgeCaseFeedback({
  rating: 1,
  context: {
    currentWeight: 500,
    currentReps: 50,
    userFatigue: 1.0
  }
});
```

### 3. Use Batch Generation for Load Testing

```typescript
const largeBatch = feedbackFactory.createMixedFeedbackBatch(1000);
```

### 4. Maintain Test Readability

```typescript
// Good - descriptive names
const easyWorkoutFeedback = feedbackFactory.createWorkoutFeedback({
  rating: 5,
  comments: 'Perfect workout difficulty!'
});

const painfulExerciseFeedback = feedbackFactory.createPainFeedback({
  rating: 4,
  comments: 'Knee pain during squats'
});
```

### 5. Factory Consistency

Use the same factory instances across your test suite for consistency:

```typescript
import { 
  feedbackFactory, 
  feedbackProcessingResultFactory 
} from '@/test-utils';

// Reuse in multiple test files
```

## Migration Guide

### Before (Hardcoded Data)
```typescript
const feedbackData = {
  id: 'test-feedback',
  workoutId: 'workout-123',
  exerciseId: 'exercise-456',
  type: FeedbackType.DIFFICULTY_RATING,
  rating: 3,
  timestamp: new Date().toISOString(),
  context: {
    currentWeight: 50,
    currentReps: 10
  }
};
```

### After (Factory-based)
```typescript
const feedbackData = feedbackFactory.createExerciseFeedback({
  type: FeedbackType.DIFFICULTY_RATING,
  rating: 3,
  context: {
    currentWeight: 50,
    currentReps: 10
  }
});
```

### Benefits of Migration

1. **Consistency**: All tests use similar data structure
2. **Realism**: Faker.js generates realistic data
3. **Maintainability**: Changes to data schema only need factory updates
4. **Coverage**: Edge cases and invalid scenarios are built-in
5. **Readability**: Tests focus on behavior, not data construction

## Type Safety

All factories are fully typed with TypeScript:

```typescript
// Full type safety and autocomplete
const feedback: FeedbackData = feedbackFactory.create({
  type: FeedbackType.DIFFICULTY_RATING, // Only valid types
  rating: 3, // Number type checked
  timestamp: new Date().toISOString(), // String format expected
});

// Override pattern maintains type safety
const customFeedback = feedbackFactory.create({
  // All these properties are type-checked
  type: FeedbackType.PAIN_FEEDBACK,
  priority: 'high' as const,
  context: {
    currentWeight: 100,
    userFatigue: 0.5
  }
});
```

## Error Handling

Factories handle edge cases gracefully:

```typescript
// Invalid feedback for negative testing
const invalidFeedback = feedbackFactory.createInvalidFeedback();
// Guaranteed to have at least one invalid property

// Edge cases for boundary testing
const edgeFeedback = feedbackFactory.createEdgeCaseFeedback();
// Tests boundary values and extreme scenarios
```

This comprehensive FeedbackFactory system provides everything needed to eliminate hardcoded test data while improving test quality, maintainability, and coverage across all feedback-driven personalization scenarios in GymGenie-AI.
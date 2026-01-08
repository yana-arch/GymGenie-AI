// Base factory
export { BaseFactory } from './factories/BaseFactory';

// Factories
export { UserProfileFactory, userProfileFactory } from './factories/UserProfileFactory';
export { ExerciseFactory, exerciseFactory } from './factories/ExerciseFactory';
export { WorkoutSessionFactory, workoutSessionFactory } from './factories/WorkoutSessionFactory';
export { 
  FeedbackFactory, 
  feedbackFactory,
  FeedbackProcessingResultFactory,
  feedbackProcessingResultFactory,
  FeedbackPatternFactory,
  feedbackPatternFactory,
  FeedbackImpactFactory,
  feedbackImpactFactory,
  FeedbackValidationResultFactory,
  feedbackValidationResultFactory
} from './factories/FeedbackFactory';

// Fixtures
export type { BaseTestFixture } from './fixtures/BaseTestFixture';
export {
  createBaseTestFixture,
  createBeginnerTestFixture,
  createAdvancedTestFixture,
  createRehabTestFixture,
  createActiveSessionFixture,
  createCompletedSessionFixture,
  createPerformanceFixture,
  createTimeSeriesFixture
} from './fixtures/BaseTestFixture';

// BDD Framework
export {
  given,
  when,
  then,
  and,
  BDDScenario,
  scenario
} from './bdd/BDDFramework';

// Test ID System
export {
  TestCategory,
  TestType,
  TestPriority,
  TestIdGenerator,
  createStorageTest,
  createSessionTest,
  createWorkoutTest,
  createFeedbackTest,
  createHistoricalTest,
  createSafetyTest,
  createFormTest,
  createUnifiedTest,
  createPreferenceTest,
  createInjuryTest,
  createCriticalTest,
  createHighPriorityTest,
  createMediumPriorityTest,
  createLowPriorityTest,
  createComprehensiveTest,
  type TestMetadata
} from './ids/TestIdGenerator';

// Performance Tracking
export {
  performanceTracker,
  PERFORMANCE_THRESHOLDS
} from './performance/PerformanceTracker';

// Performance Test Integration
export {
  createPerformanceTest,
  createSmokeTest,
  createP0Test,
  createP1Test,
  createP2Test,
  createP3Test,
  assertPerformanceWithinThreshold,
  setupPerformanceTracking
} from './performance/TestPerformanceIntegration';

// Helpers
export {
  createMockStore,
  AllTheProviders,
  renderWithProviders,
  waitFor,
  mockConsole,
  mockIntersectionObserver,
  mockResizeObserver,
  setupComponentMocks,
  createMockLocalStorage,
  mockLocalStorage,
  resetAllMocks,
  createMockFn
} from './helpers/TestingHelpers';
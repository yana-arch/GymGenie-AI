/**
 * Test ID Generation System for GymGenie-AI
 * Provides standardized test identification for traceability
 */

export enum TestCategory {
  STORAGE = 'STORAGE',
  SESSION = 'SESSION', 
  WORKOUT = 'WORKOUT',
  USER = 'USER',
  PERFORMANCE = 'PERFORMANCE',
  FEEDBACK = 'FEEDBACK',
  SAFETY = 'SAFETY',
  INJURY = 'INJURY',
  FORM = 'FORM',
  UNIFIED = 'UNIFIED',
  PREFERENCE = 'PREFERENCE',
  HISTORICAL = 'HISTORICAL'
}

export enum TestType {
  UNIT = 'UNIT',
  INTEGRATION = 'INTEGRATION', 
  E2E = 'E2E',
  PERFORMANCE = 'PERF'
}

export enum TestPriority {
  SMOKE = 'SMOKE', // Critical path, must run on every commit
  P0 = 'P0', // Critical functionality, blocking issues
  P1 = 'P1', // High priority, important features
  P2 = 'P2', // Medium priority, nice-to-have features
  P3 = 'P3'  // Low priority, edge cases and nice-to-haves
}

export interface TestMetadata {
  id: string;
  category: TestCategory;
  type: TestType;
  priority: TestPriority;
  description: string;
  storyId?: string;
  requirementId?: string;
}

export class TestIdGenerator {
  /**
   * Generate standardized test ID with format: [TC-CATEGORY-TYPE-NNN] Description
   */
  static generate(
    category: TestCategory,
    type: TestType,
    number: number,
    description: string,
    priority: TestPriority = TestPriority.P1
  ): string {
    const paddedNumber = String(number).padStart(3, '0');
    return `[TC-${category}-${type}-${paddedNumber}] ${description}`;
  }

  /**
   * Generate test ID with priority marker
   */
  static generateWithPriority(
    category: TestCategory,
    type: TestType,
    number: number,
    description: string,
    priority: TestPriority = TestPriority.P1
  ): string {
    const baseId = this.generate(category, type, number, description, priority);
    const tag = priority === TestPriority.SMOKE ? 'smoke' : priority.toLowerCase();
    return `@${tag} ${baseId}`;
  }

  /**
   * Create test metadata object
   */
  static createMetadata(
    category: TestCategory,
    type: TestType,
    number: number,
    description: string,
    priority: TestPriority = TestPriority.P1,
    storyId?: string,
    requirementId?: string
  ): TestMetadata {
    const id = this.generate(category, type, number, description, priority);
    return {
      id,
      category,
      type,
      priority,
      description,
      storyId,
      requirementId
    };
  }

  /**
   * Extract test information from test ID string
   */
  static parseTestId(testId: string): {
    category: string;
    type: string;
    number: string;
    description: string;
  } | null {
    const match = testId.match(/^\[TC-(\w+)-(\w+)-(\d+)\]\s*(.+)$/);
    if (!match) return null;

    return {
      category: match[1],
      type: match[2], 
      number: match[3],
      description: match[4]
    };
  }

  /**
   * Get next test number for a category/type combination
   */
  static getNextNumber(category: TestCategory, type: TestType, existing: string[] = []): number {
    const pattern = new RegExp(`\\[TC-${category}-${type}-(\\d+)\\]`);
    const numbers = existing
      .map(id => {
        const match = id.match(pattern);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0)
      .sort((a, b) => b - a);

    return numbers.length > 0 ? numbers[0] + 1 : 1;
  }
}

// Quick test ID generators for common patterns
export const createStorageTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.STORAGE, type, number, description);

export const createSessionTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.SESSION, type, number, description);

export const createWorkoutTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.WORKOUT, type, number, description);

export const createFeedbackTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.FEEDBACK, type, number, description);

// Priority-based generators
export const createSmokeTest = (category: TestCategory, type: TestType, number: number, description: string) =>
  TestIdGenerator.generateWithPriority(category, type, number, description, TestPriority.SMOKE);

export const createCriticalTest = (category: TestCategory, type: TestType, number: number, description: string) =>
  TestIdGenerator.generateWithPriority(category, type, number, description, TestPriority.P0);

export const createHighPriorityTest = (category: TestCategory, type: TestType, number: number, description: string) =>
  TestIdGenerator.generateWithPriority(category, type, number, description, TestPriority.P1);

export const createMediumPriorityTest = (category: TestCategory, type: TestType, number: number, description: string) =>
  TestIdGenerator.generateWithPriority(category, type, number, description, TestPriority.P2);

export const createLowPriorityTest = (category: TestCategory, type: TestType, number: number, description: string) =>
  TestIdGenerator.generateWithPriority(category, type, number, description, TestPriority.P3);

// Feature-specific test ID generators for GymGenie-AI
export const createHistoricalTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.HISTORICAL, type, number, description);

export const createSafetyTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.SAFETY, type, number, description);

export const createFormTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.FORM, type, number, description);

export const createUnifiedTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.UNIFIED, type, number, description);

export const createPreferenceTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.PREFERENCE, type, number, description);

export const createInjuryTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.INJURY, type, number, description);

export const createComprehensiveTest = (number: number, description: string, type: TestType = TestType.UNIT) =>
  TestIdGenerator.generate(TestCategory.UNIFIED, type, number, description);
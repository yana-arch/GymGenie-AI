/**
 * Simple test to verify BDD structure works
 */

import { expect, describe, it } from 'vitest';
import { createPreferenceTest } from './src/test-utils/index';

describe('BDD Test Verification', () => {
  it('should generate test IDs correctly', () => {
    const testId = createPreferenceTest(1, 'test description');
    console.log('Generated test ID:', testId);
    expect(testId).toContain('[TC-PREFERENCE-UNIT-001]');
    expect(testId).toContain('test description');
  });
});
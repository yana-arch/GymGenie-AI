/**
 * BDD Testing Framework for GymGenie-AI
 * Provides Given-When-Then structure for behavioral testing
 */

import { describe, test } from 'vitest';

export const given = (description: string, fn: () => void) => {
  describe(`GIVEN ${description}`, fn);
};

export const when = (description: string, fn: () => void) => {
  describe(`WHEN ${description}`, fn);
};

export const then = (description: string, fn: () => void) => {
  test(`THEN ${description}`, fn);
};

export const and = (description: string, fn: () => void) => {
  test(`AND ${description}`, fn);
};

// BDD Test Scenario Builder for complex scenarios
export class BDDScenario {
  private description: string;
  private steps: Array<{ type: 'given' | 'when' | 'then' | 'and'; description: string; fn: () => void }> = [];

  constructor(description: string) {
    this.description = description;
  }

  given(description: string, fn: () => void): this {
    this.steps.push({ type: 'given', description, fn });
    return this;
  }

  when(description: string, fn: () => void): this {
    this.steps.push({ type: 'when', description, fn });
    return this;
  }

  then(description: string, fn: () => void): this {
    this.steps.push({ type: 'then', description, fn });
    return this;
  }

  and(description: string, fn: () => void): this {
    this.steps.push({ type: 'and', description, fn });
    return this;
  }

  execute(): void {
    describe(this.description, () => {
      this.steps.forEach(step => {
        switch (step.type) {
          case 'given':
            describe(`GIVEN ${step.description}`, step.fn);
            break;
          case 'when':
            describe(`WHEN ${step.description}`, step.fn);
            break;
          case 'then':
            test(`THEN ${step.description}`, step.fn);
            break;
          case 'and':
            test(`AND ${step.description}`, step.fn);
            break;
        }
      });
    });
  }
}

// Helper to create BDD scenarios quickly
export const scenario = (description: string) => new BDDScenario(description);
import { faker } from '@faker-js/faker';

/**
 * Base factory interface
 */
export interface IFactory<T> {
  create(overrides?: Partial<T>): T;
  createMany(count: number, overrides?: Partial<T>): T[];
}

/**
 * Base factory class with common functionality
 */
export abstract class BaseFactory<T> implements IFactory<T> {
  protected abstract getDefaults(): T;

  create(overrides: Partial<T> = {}): T {
    const defaults = this.getDefaults();
    return this.merge(defaults, overrides);
  }

  createMany(count: number, overrides: Partial<T> = {}): T[] {
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * Deep merge objects with type safety
   */
  protected merge(base: T, overrides: Partial<T>): T {
    if (typeof base !== 'object' || base === null) {
      return base;
    }

    const result = { ...base } as any;
    
    for (const key in overrides) {
      if (overrides[key] !== undefined) {
        const overrideValue = overrides[key];
        const baseValue = result[key];

        if (
          typeof overrideValue === 'object' &&
          overrideValue !== null &&
          !Array.isArray(overrideValue) &&
          typeof baseValue === 'object' &&
          baseValue !== null &&
          !Array.isArray(baseValue)
        ) {
          // Deep merge for nested objects
          result[key] = this.merge(baseValue, overrideValue as any);
        } else {
          // Direct replacement for primitives and arrays
          result[key] = overrideValue as any;
        }
      }
    }

    return result;
  }

  /**
   * Generate a random ID with optional prefix
   */
  protected generateId(prefix?: string): string {
    const randomId = faker.string.uuid();
    return prefix ? `${prefix}_${randomId}` : randomId;
  }

  /**
   * Generate timestamps with realistic relationship
   */
  protected generateTimestamps(): { createdAt: number; updatedAt: number } {
    const createdAt = faker.date.past({ years: 1 }).getTime();
    const updatedAt = faker.date.between({ 
      from: new Date(createdAt), 
      to: new Date() 
    }).getTime();
    
    return { createdAt, updatedAt };
  }

  /**
   * Generate a random enum value
   */
  protected randomEnum<T extends string | number>(enumObj: Record<string, T>): T {
    const values = Object.values(enumObj);
    return faker.helpers.arrayElement(values);
  }

  /**
   * Generate a random array of enum values
   */
  protected randomEnumArray<T extends string | number>(
    enumObj: Record<string, T>,
    min: number = 1,
    max: number = 3
  ): T[] {
    const values = Object.values(enumObj);
    const count = faker.number.int({ min, max });
    return faker.helpers.arrayElements(values, count);
  }
}
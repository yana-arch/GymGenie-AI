/**
 * Simple dependency injection container for service management
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();
  private singletons: Set<string> = new Set();

  private constructor() {}

  /**
   * Get the singleton instance of the service container
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Register a service with the container
   * @param key - Service identifier
   * @param factory - Factory function to create the service
   * @param singleton - Whether the service should be a singleton (default: true)
   */
  register<T>(key: string, factory: () => T, singleton: boolean = true): void {
    this.factories.set(key, factory);
    if (singleton) {
      this.singletons.add(key);
    }
  }

  /**
   * Register a service instance directly
   * @param key - Service identifier
   * @param instance - Service instance
   */
  registerInstance<T>(key: string, instance: T): void {
    this.services.set(key, instance);
    this.singletons.add(key);
  }

  /**
   * Resolve a service from the container
   * @param key - Service identifier
   * @returns The service instance
   * @throws Error if service is not registered
   */
  resolve<T>(key: string): T {
    // Return existing instance if it's a singleton and already created
    if (this.singletons.has(key) && this.services.has(key)) {
      return this.services.get(key) as T;
    }

    // Create new instance using factory
    const factory = this.factories.get(key);
    if (!factory) {
      throw new Error(`Service '${key}' is not registered`);
    }

    const instance = factory();

    // Store instance if it's a singleton
    if (this.singletons.has(key)) {
      this.services.set(key, instance);
    }

    return instance as T;
  }

  /**
   * Check if a service is registered
   * @param key - Service identifier
   * @returns True if registered, false otherwise
   */
  isRegistered(key: string): boolean {
    return this.factories.has(key) || this.services.has(key);
  }

  /**
   * Unregister a service
   * @param key - Service identifier
   */
  unregister(key: string): void {
    this.factories.delete(key);
    this.services.delete(key);
    this.singletons.delete(key);
  }

  /**
   * Clear all registered services
   */
  clear(): void {
    this.factories.clear();
    this.services.clear();
    this.singletons.clear();
  }

  /**
   * Get all registered service keys
   * @returns Array of service keys
   */
  getRegisteredKeys(): string[] {
    const factoryKeys = Array.from(this.factories.keys());
    const instanceKeys = Array.from(this.services.keys());
    return [...new Set([...factoryKeys, ...instanceKeys])];
  }
}

// Service keys constants for type safety
export const SERVICE_KEYS = {
  SESSION_SERVICE: 'SessionService',
  WORKOUT_SERVICE: 'WorkoutService',
  STORAGE_SERVICE: 'StorageService',
  ERROR_SERVICE: 'ErrorService',
  NOTIFICATION_SERVICE: 'NotificationService',
} as const;

export type ServiceKey = typeof SERVICE_KEYS[keyof typeof SERVICE_KEYS];
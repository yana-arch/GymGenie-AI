// Service interfaces
export type { ISessionService } from "./interfaces/ISessionService";
export type { IWorkoutService } from "./interfaces/IWorkoutService";
export type {
  IStorageService,
  BackupData,
  StorageInfo,
} from "./interfaces/IStorageService";

// Dependency injection
export { ServiceContainer, SERVICE_KEYS } from "./container/ServiceContainer";
export type { ServiceKey } from "./container/ServiceContainer";
export {
  registerServices,
  getService,
  getSessionService,
  getWorkoutService,
  getStorageService,
} from "./container/serviceRegistration";

// Re-export existing services for backward compatibility
export { StorageService } from "./storage/StorageService";
export { SessionStateManager } from "@/features/session/services/sessionStateManager";
export { SessionErrorHandler } from "@/features/session/services/sessionErrorHandler";

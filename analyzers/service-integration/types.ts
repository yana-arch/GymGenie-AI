import { AnalysisReport } from '../types';

/**
 * Service information
 */
export interface ServiceInfo {
  name: string;
  file: string;
  interface: string | null;
  implementation: string | null;
  usageCount: number;
  isRegistered: boolean;
  consumers: string[];
}

/**
 * Integration status
 */
export interface IntegrationStatus {
  isUsed: boolean;
  isRegistered: boolean;
  hasInterface: boolean;
  hasImplementation: boolean;
  issues: string[];
}

/**
 * Integration issue
 */
export interface IntegrationIssue {
  service: string;
  type: 'missing-interface' | 'missing-implementation' | 'not-registered' | 'unused' | 'interface-mismatch';
  severity: 'error' | 'warning';
  message: string;
  file?: string;
}

/**
 * Integration suggestion
 */
export interface IntegrationSuggestion {
  service: string;
  type: 'integrate' | 'remove' | 'merge' | 'split';
  reason: string;
  steps: string[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * Service analysis report
 */
export interface ServiceAnalysisReport extends AnalysisReport {
  services: ServiceInfo[];
  unusedServices: ServiceInfo[];
  partiallyIntegrated: ServiceInfo[];
  integrationIssues: IntegrationIssue[];
  suggestions: IntegrationSuggestion[];
  totalServices: number;
  registeredServices: number;
  unusedCount: number;
}

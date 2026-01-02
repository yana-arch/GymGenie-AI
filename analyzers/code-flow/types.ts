import { AnalysisReport } from '../types';

/**
 * State access information
 */
export interface StateAccess {
  selector: string;
  slice: string;
  isProperlyTyped: boolean;
  location: string;
  line: number;
}

/**
 * Service call information
 */
export interface ServiceCall {
  service: string;
  method: string;
  isProperlyAbstracted: boolean;
  location: string;
  line: number;
}

/**
 * Storage access information
 */
export interface StorageAccess {
  key: string;
  operation: 'read' | 'write' | 'delete';
  location: string;
  line: number;
  isDirect: boolean;
}

/**
 * Flow violation types
 */
export type FlowViolationType =
  | 'direct-state-mutation'
  | 'missing-service-layer'
  | 'direct-storage-access'
  | 'improper-redux-usage'
  | 'missing-type-safety';

/**
 * Flow violation information
 */
export interface FlowViolation {
  type: FlowViolationType;
  location: string;
  line: number;
  severity: 'error' | 'warning';
  suggestion: string;
  component?: string;
}

/**
 * Data flow trace
 */
export interface DataFlowTrace {
  component: string;
  file: string;
  stateAccess: StateAccess[];
  serviceCall: ServiceCall[];
  directStorageAccess: StorageAccess[];
  violations: FlowViolation[];
}

/**
 * Pattern violation
 */
export interface PatternViolation {
  pattern: 'redux' | 'service-layer' | 'component-structure';
  location: string;
  line: number;
  description: string;
  suggestion: string;
  severity: 'error' | 'warning';
}

/**
 * Service layer violation
 */
export interface ServiceLayerViolation {
  component: string;
  file: string;
  line: number;
  violation: string;
  suggestion: string;
  severity: 'error' | 'warning';
}

/**
 * Code flow validation report
 */
export interface CodeFlowReport extends AnalysisReport {
  traces: DataFlowTrace[];
  patternViolations: PatternViolation[];
  serviceLayerViolations: ServiceLayerViolation[];
  totalComponents: number;
  componentsWithViolations: number;
  totalViolations: number;
  criticalViolations: number;
}

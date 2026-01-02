import { AnalysisReport } from '../types';

/**
 * Module node in dependency graph
 */
export interface ModuleNode {
  path: string;
  name: string;
  dependencies: string[];
  dependents: string[];
  isEntry: boolean;
  size?: number;
}

/**
 * Dependency edge
 */
export interface DependencyEdge {
  from: string;
  to: string;
  type: 'import' | 'require' | 'dynamic';
  isCircular: boolean;
}

/**
 * Circular dependency
 */
export interface CircularDependency {
  cycle: string[];
  severity: 'critical' | 'warning';
  suggestion: string;
}

/**
 * Module pair for coupling analysis
 */
export interface ModulePair {
  module1: string;
  module2: string;
  couplingScore: number;
  sharedDependencies: string[];
  reason: string;
}

/**
 * Decoupling suggestion
 */
export interface DecouplingSuggestion {
  modules: string[];
  strategy: 'dependency-injection' | 'event-bus' | 'interface-abstraction' | 'extract-common';
  steps: string[];
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: string;
}

/**
 * Coupling report
 */
export interface CouplingReport {
  tightlyCoupled: ModulePair[];
  suggestions: DecouplingSuggestion[];
  averageCoupling: number;
  maxCoupling: number;
}

/**
 * Dependency graph
 */
export interface DependencyGraph {
  nodes: Map<string, ModuleNode>;
  edges: DependencyEdge[];
  entryPoints: string[];
  totalModules: number;
  totalDependencies: number;
}

/**
 * Dependency graph analysis report
 */
export interface DependencyGraphReport extends AnalysisReport {
  graph: DependencyGraph;
  circularDependencies: CircularDependency[];
  couplingReport: CouplingReport;
  visualization?: string;
  metrics: {
    totalModules: number;
    totalDependencies: number;
    circularCount: number;
    tightlyCoupledCount: number;
    averageDependencies: number;
    maxDependencies: number;
  };
}

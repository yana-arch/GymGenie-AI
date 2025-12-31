import { Breakpoint } from '../hooks/useBreakpoint';

// Layout configuration interfaces
export interface GridConfig {
  columns: number | string;
  rows?: number | string;
  gap: string;
  template?: string;
  areas?: string[];
}

export interface FlexboxConfig {
  direction: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap: 'nowrap' | 'wrap' | 'wrap-reverse';
  justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  gap?: string;
}

export interface SpacingConfig {
  padding: string;
  margin: string;
  gap?: string;
}

export interface VisibilityConfig {
  display: 'block' | 'flex' | 'grid' | 'inline' | 'inline-block' | 'none';
  hidden?: boolean;
}

export interface LayoutConfig {
  grid?: GridConfig;
  flexbox?: FlexboxConfig;
  spacing: SpacingConfig;
  visibility: VisibilityConfig;
  className?: string;
  customStyles?: Record<string, string>;
}

export interface ComponentLayoutConfig {
  component: string;
  layouts: {
    [key in Breakpoint]: LayoutConfig;
  };
  priority?: number; // For layout application order
  dependencies?: string[]; // Other components this depends on
}

// Layout Manager class for managing responsive layouts
export class LayoutManager {
  private registeredComponents: Map<string, ComponentLayoutConfig> = new Map();
  private appliedLayouts: Map<string, Breakpoint> = new Map();
  private observers: Map<string, ResizeObserver> = new Map();

  /**
   * Register a component with its responsive layout configuration
   */
  registerComponent(name: string, config: ComponentLayoutConfig): void {
    this.registeredComponents.set(name, config);
  }

  /**
   * Get layout configuration for a component at a specific breakpoint
   */
  getLayoutConfig(component: string, breakpoint?: Breakpoint): LayoutConfig | null {
    const config = this.registeredComponents.get(component);
    if (!config) return null;

    // If no breakpoint specified, try to detect from current viewport
    const targetBreakpoint = breakpoint || this.getCurrentBreakpoint();
    return config.layouts[targetBreakpoint] || null;
  }

  /**
   * Apply layout to a component at a specific breakpoint
   */
  applyLayout(breakpoint: Breakpoint, component: string, element?: HTMLElement): void {
    const config = this.getLayoutConfig(component, breakpoint);
    if (!config) {
      console.warn(`No layout configuration found for component: ${component}`);
      return;
    }

    // Find element if not provided
    const targetElement = element || document.querySelector(`[data-component="${component}"]`) as HTMLElement;
    if (!targetElement) {
      console.warn(`Element not found for component: ${component}`);
      return;
    }

    // Apply layout styles
    this.applyLayoutStyles(targetElement, config);
    
    // Track applied layout
    this.appliedLayouts.set(component, breakpoint);

    // Emit layout change event
    this.emitLayoutChange(component, breakpoint, config);
  }

  /**
   * Update layout for all registered components
   */
  updateLayout(force: boolean = false): void {
    const currentBreakpoint = this.getCurrentBreakpoint();
    
    // Sort components by priority
    const sortedComponents = Array.from(this.registeredComponents.entries())
      .sort(([, a], [, b]) => (a.priority || 0) - (b.priority || 0));

    for (const [componentName, config] of sortedComponents) {
      const lastAppliedBreakpoint = this.appliedLayouts.get(componentName);
      
      // Only update if breakpoint changed or force update
      if (force || lastAppliedBreakpoint !== currentBreakpoint) {
        this.applyLayout(currentBreakpoint, componentName);
      }
    }
  }

  /**
   * Apply CSS styles based on layout configuration
   */
  private applyLayoutStyles(element: HTMLElement, config: LayoutConfig): void {
    const styles: Record<string, string> = {};

    // Apply visibility styles
    styles.display = config.visibility.display;
    if (config.visibility.hidden) {
      styles.visibility = 'hidden';
    }

    // Apply spacing styles
    styles.padding = config.spacing.padding;
    styles.margin = config.spacing.margin;
    if (config.spacing.gap) {
      styles.gap = config.spacing.gap;
    }

    // Apply grid styles
    if (config.grid) {
      styles.display = 'grid';
      styles.gridTemplateColumns = typeof config.grid.columns === 'number' 
        ? `repeat(${config.grid.columns}, 1fr)` 
        : config.grid.columns;
      
      if (config.grid.rows) {
        styles.gridTemplateRows = typeof config.grid.rows === 'number'
          ? `repeat(${config.grid.rows}, 1fr)`
          : config.grid.rows;
      }
      
      styles.gap = config.grid.gap;
      
      if (config.grid.template) {
        styles.gridTemplate = config.grid.template;
      }
      
      if (config.grid.areas) {
        styles.gridTemplateAreas = config.grid.areas.map(area => `"${area}"`).join(' ');
      }
    }

    // Apply flexbox styles
    if (config.flexbox) {
      styles.display = 'flex';
      styles.flexDirection = config.flexbox.direction;
      styles.flexWrap = config.flexbox.wrap;
      styles.justifyContent = config.flexbox.justify;
      styles.alignItems = config.flexbox.align;
      
      if (config.flexbox.gap) {
        styles.gap = config.flexbox.gap;
      }
    }

    // Apply custom styles
    if (config.customStyles) {
      Object.assign(styles, config.customStyles);
    }

    // Apply all styles to element
    Object.assign(element.style, styles);

    // Apply CSS class if specified
    if (config.className) {
      element.className = `${element.className} ${config.className}`.trim();
    }
  }

  /**
   * Get current breakpoint (fallback implementation)
   */
  private getCurrentBreakpoint(): Breakpoint {
    if (typeof window === 'undefined') return 'mobile';
    
    const width = window.innerWidth;
    if (width >= 1440) return 'large-desktop';
    if (width >= 1024) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
  }

  /**
   * Emit layout change event
   */
  private emitLayoutChange(component: string, breakpoint: Breakpoint, config: LayoutConfig): void {
    const event = new CustomEvent('layoutChange', {
      detail: { component, breakpoint, config }
    });
    window.dispatchEvent(event);
  }

  /**
   * Set up container queries for a component
   */
  setupContainerQueries(element: HTMLElement, component: string): void {
    if (!('ResizeObserver' in window)) {
      console.warn('ResizeObserver not supported, falling back to window resize');
      return;
    }

    // Clean up existing observer
    const existingObserver = this.observers.get(component);
    if (existingObserver) {
      existingObserver.disconnect();
    }

    // Create new observer
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const breakpoint = this.getBreakpointFromWidth(width);
        this.applyLayout(breakpoint, component, element);
      }
    });

    observer.observe(element);
    this.observers.set(component, observer);
  }

  /**
   * Get breakpoint based on container width
   */
  private getBreakpointFromWidth(width: number): Breakpoint {
    if (width >= 1440) return 'large-desktop';
    if (width >= 1024) return 'desktop';
    if (width >= 768) return 'tablet';
    return 'mobile';
  }

  /**
   * Clean up observers and event listeners
   */
  cleanup(): void {
    // Disconnect all resize observers
    for (const observer of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
    
    // Clear applied layouts
    this.appliedLayouts.clear();
  }

  /**
   * Get all registered components
   */
  getRegisteredComponents(): string[] {
    return Array.from(this.registeredComponents.keys());
  }

  /**
   * Remove a registered component
   */
  unregisterComponent(component: string): void {
    this.registeredComponents.delete(component);
    this.appliedLayouts.delete(component);
    
    const observer = this.observers.get(component);
    if (observer) {
      observer.disconnect();
      this.observers.delete(component);
    }
  }
}

// Singleton instance for global layout management
export const layoutManager = new LayoutManager();

// Utility functions for common layout patterns
export const LayoutPatterns = {
  // Mobile-first vertical stack
  mobileStack: (gap: string = '1rem'): ComponentLayoutConfig['layouts'] => ({
    mobile: {
      flexbox: { direction: 'column', wrap: 'nowrap', justify: 'flex-start', align: 'stretch', gap },
      spacing: { padding: '1rem', margin: '0' },
      visibility: { display: 'flex' }
    },
    tablet: {
      flexbox: { direction: 'column', wrap: 'nowrap', justify: 'flex-start', align: 'stretch', gap },
      spacing: { padding: '1.5rem', margin: '0' },
      visibility: { display: 'flex' }
    },
    desktop: {
      flexbox: { direction: 'column', wrap: 'nowrap', justify: 'flex-start', align: 'stretch', gap },
      spacing: { padding: '2rem', margin: '0' },
      visibility: { display: 'flex' }
    },
    'large-desktop': {
      flexbox: { direction: 'column', wrap: 'nowrap', justify: 'flex-start', align: 'stretch', gap },
      spacing: { padding: '2.5rem', margin: '0' },
      visibility: { display: 'flex' }
    }
  }),

  // Responsive grid layout
  responsiveGrid: (mobileColumns: number = 1, tabletColumns: number = 2, desktopColumns: number = 3): ComponentLayoutConfig['layouts'] => ({
    mobile: {
      grid: { columns: mobileColumns, gap: '1rem' },
      spacing: { padding: '1rem', margin: '0' },
      visibility: { display: 'grid' }
    },
    tablet: {
      grid: { columns: tabletColumns, gap: '1.5rem' },
      spacing: { padding: '1.5rem', margin: '0' },
      visibility: { display: 'grid' }
    },
    desktop: {
      grid: { columns: desktopColumns, gap: '2rem' },
      spacing: { padding: '2rem', margin: '0' },
      visibility: { display: 'grid' }
    },
    'large-desktop': {
      grid: { columns: desktopColumns + 1, gap: '2.5rem' },
      spacing: { padding: '2.5rem', margin: '0' },
      visibility: { display: 'grid' }
    }
  }),

  // Sidebar layout for desktop
  sidebarLayout: (): ComponentLayoutConfig['layouts'] => ({
    mobile: {
      flexbox: { direction: 'column', wrap: 'nowrap', justify: 'flex-start', align: 'stretch' },
      spacing: { padding: '1rem', margin: '0' },
      visibility: { display: 'flex' }
    },
    tablet: {
      flexbox: { direction: 'column', wrap: 'nowrap', justify: 'flex-start', align: 'stretch' },
      spacing: { padding: '1.5rem', margin: '0' },
      visibility: { display: 'flex' }
    },
    desktop: {
      grid: { columns: '250px 1fr', gap: '2rem' },
      spacing: { padding: '2rem', margin: '0' },
      visibility: { display: 'grid' }
    },
    'large-desktop': {
      grid: { columns: '300px 1fr', gap: '2.5rem' },
      spacing: { padding: '2.5rem', margin: '0' },
      visibility: { display: 'grid' }
    }
  })
};
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useBreakpoint, isTouchDevice, BREAKPOINT_CONFIG } from '@/hooks/useBreakpoint';
import { LayoutManager, LayoutPatterns } from '@/utils/layoutManager';

// Mock window object for testing
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  dispatchEvent: vi.fn(),
  ResizeObserver: vi.fn(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
  })),
};

// Mock navigator for touch detection
const mockNavigator = {
  maxTouchPoints: 0,
  msMaxTouchPoints: 0,
};

describe('Breakpoint Manager', () => {
  beforeEach(() => {
    // @ts-ignore
    global.window = mockWindow;
    // @ts-ignore
    global.navigator = mockNavigator;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Note: `getCurrentBreakpoint` is now an internal implementation detail of `useBreakpoint`.
  // We will test the behavior via the LayoutManager's internal method, which mirrors the logic.
  describe('LayoutManager breakpoint detection', () => {
    let layoutManager: LayoutManager;
    beforeEach(() => {
      layoutManager = new LayoutManager();
    });
    
    it('should return sm for widths below 768px', () => {
      mockWindow.innerWidth = 320;
      // @ts-ignore - testing private method
      expect(layoutManager.getCurrentBreakpoint()).toBe('sm');
      mockWindow.innerWidth = 767;
      // @ts-ignore
      expect(layoutManager.getCurrentBreakpoint()).toBe('sm');
    });

    it('should return md for widths between 768px and 1023px', () => {
      mockWindow.innerWidth = 768;
      // @ts-ignore
      expect(layoutManager.getCurrentBreakpoint()).toBe('md');
      mockWindow.innerWidth = 1023;
      // @ts-ignore
      expect(layoutManager.getCurrentBreakpoint()).toBe('md');
    });

    it('should return lg for widths between 1024px and 1279px', () => {
        mockWindow.innerWidth = 1024;
        // @ts-ignore
        expect(layoutManager.getCurrentBreakpoint()).toBe('lg');
        mockWindow.innerWidth = 1279;
        // @ts-ignore
        expect(layoutManager.getCurrentBreakpoint()).toBe('lg');
    });

    it('should return xl for widths 1280px and above', () => {
        mockWindow.innerWidth = 1280;
        // @ts-ignore
        expect(layoutManager.getCurrentBreakpoint()).toBe('xl');
        mockWindow.innerWidth = 2560;
        // @ts-ignore
        expect(layoutManager.getCurrentBreakpoint()).toBe('xl');
    });
  });

  describe('isTouchDevice', () => {
    it('should return false for non-touch devices', () => {
      expect(isTouchDevice()).toBe(false);
    });

    it('should return true when ontouchstart is available', () => {
      // @ts-ignore
      global.window.ontouchstart = {};
      expect(isTouchDevice()).toBe(true);
      // @ts-ignore
      delete global.window.ontouchstart;
    });

    it('should return true when maxTouchPoints > 0', () => {
      mockNavigator.maxTouchPoints = 1;
      expect(isTouchDevice()).toBe(true);
      mockNavigator.maxTouchPoints = 0;
    });
  });

  describe('BREAKPOINT_CONFIG', () => {
    it('should have correct breakpoint values', () => {
      expect(BREAKPOINT_CONFIG.sm).toEqual(640);
      expect(BREAKPOINT_CONFIG.md).toEqual(768);
      expect(BREAKPOINT_CONFIG.lg).toEqual(1024);
      expect(BREAKPOINT_CONFIG.xl).toEqual(1280);
    });
  });
});

describe('Layout Manager', () => {
  let layoutManager: LayoutManager;
  let mockElement: HTMLElement;

  beforeEach(() => {
    layoutManager = new LayoutManager();
    
    // Create mock DOM element
    mockElement = {
      style: {},
      className: '',
      querySelector: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as any;

    // Mock document.querySelector
    global.document = {
      querySelector: vi.fn(() => mockElement),
    } as any;

    // @ts-ignore
    global.window = mockWindow;
  });

  afterEach(() => {
    layoutManager.cleanup();
    vi.clearAllMocks();
  });

  describe('Component Registration', () => {
    it('should register a component with layout configuration', () => {
      const config = {
        component: 'test-component',
        layouts: {
          sm: {
            spacing: { padding: '1rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          md: {
            spacing: { padding: '1.5rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          lg: {
            spacing: { padding: '2rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          xl: {
            spacing: { padding: '2.5rem', margin: '0' },
            visibility: { display: 'block' as const }
          }
        }
      };

      layoutManager.registerComponent('test-component', config);
      
      const registeredComponents = layoutManager.getRegisteredComponents();
      expect(registeredComponents).toContain('test-component');
    });

    it('should unregister a component', () => {
      const config = {
        component: 'test-component',
        layouts: {
          sm: {
            spacing: { padding: '1rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          md: {
            spacing: { padding: '1.5rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          lg: {
            spacing: { padding: '2rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          xl: {
            spacing: { padding: '2.5rem', margin: '0' },
            visibility: { display: 'block' as const }
          }
        }
      };

      layoutManager.registerComponent('test-component', config);
      layoutManager.unregisterComponent('test-component');
      
      const registeredComponents = layoutManager.getRegisteredComponents();
      expect(registeredComponents).not.toContain('test-component');
    });
  });

  describe('Layout Configuration', () => {
    beforeEach(() => {
      const config = {
        component: 'test-component',
        layouts: {
          sm: {
            flexbox: { direction: 'column' as const, wrap: 'nowrap' as const, justify: 'flex-start' as const, align: 'stretch' as const },
            spacing: { padding: '1rem', margin: '0' },
            visibility: { display: 'flex' as const }
          },
          md: {
            grid: { columns: 2, gap: '1.5rem' },
            spacing: { padding: '1.5rem', margin: '0' },
            visibility: { display: 'grid' as const }
          },
          lg: {
            grid: { columns: 3, gap: '2rem' },
            spacing: { padding: '2rem', margin: '0' },
            visibility: { display: 'grid' as const }
          },
          xl: {
            grid: { columns: 4, gap: '2.5rem' },
            spacing: { padding: '2.5rem', margin: '0' },
            visibility: { display: 'grid' as const }
          }
        }
      };

      layoutManager.registerComponent('test-component', config);
    });

    it('should get layout configuration for mobile breakpoint', () => {
      const config = layoutManager.getLayoutConfig('test-component', 'sm');
      expect(config).toBeTruthy();
      expect(config?.flexbox?.direction).toBe('column');
      expect(config?.spacing.padding).toBe('1rem');
    });

    it('should get layout configuration for tablet breakpoint', () => {
      const config = layoutManager.getLayoutConfig('test-component', 'md');
      expect(config).toBeTruthy();
      expect(config?.grid?.columns).toBe(2);
      expect(config?.spacing.padding).toBe('1.5rem');
    });

    it('should return null for unregistered component', () => {
      const config = layoutManager.getLayoutConfig('nonexistent-component', 'sm');
      expect(config).toBeNull();
    });
  });

  describe('Layout Application', () => {
    beforeEach(() => {
      const config = {
        component: 'test-component',
        layouts: {
          sm: {
            flexbox: { direction: 'column' as const, wrap: 'nowrap' as const, justify: 'flex-start' as const, align: 'stretch' as const },
            spacing: { padding: '1rem', margin: '0' },
            visibility: { display: 'flex' as const },
            className: 'mobile-layout'
          },
          md: {
            grid: { columns: 2, gap: '1.5rem' },
            spacing: { padding: '1.5rem', margin: '0' },
            visibility: { display: 'grid' as const },
            className: 'tablet-layout'
          },
          lg: {
            grid: { columns: 3, gap: '2rem' },
            spacing: { padding: '2rem', margin: '0' },
            visibility: { display: 'grid' as const },
            className: 'desktop-layout'
          },
          xl: {
            grid: { columns: 4, gap: '2.5rem' },
            spacing: { padding: '2.5rem', margin: '0' },
            visibility: { display: 'grid' as const },
            className: 'large-desktop-layout'
          }
        }
      };

      layoutManager.registerComponent('test-component', config);
    });

    it('should apply mobile layout styles', () => {
      layoutManager.applyLayout('sm', 'test-component', mockElement);
      
      expect(mockElement.style.display).toBe('flex');
      expect(mockElement.style.flexDirection).toBe('column');
      expect(mockElement.style.padding).toBe('1rem');
      expect(mockElement.className).toContain('mobile-layout');
    });

    it('should apply tablet grid layout styles', () => {
      layoutManager.applyLayout('md', 'test-component', mockElement);
      
      expect(mockElement.style.display).toBe('grid');
      expect(mockElement.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
      expect(mockElement.style.gap).toBe('1.5rem');
      expect(mockElement.style.padding).toBe('1.5rem');
      expect(mockElement.className).toContain('tablet-layout');
    });

    it('should emit layout change event', () => {
      layoutManager.applyLayout('lg', 'test-component', mockElement);
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'layoutChange',
          detail: expect.objectContaining({
            component: 'test-component',
            breakpoint: 'lg'
          })
        })
      );
    });
  });
});

describe('Layout Patterns', () => {
  it('should generate mobile stack pattern', () => {
    const pattern = LayoutPatterns.mobileStack('1.5rem');
    
    expect(pattern.sm.flexbox?.direction).toBe('column');
    expect(pattern.sm.flexbox?.gap).toBe('1.5rem');
    expect(pattern.sm.spacing.padding).toBe('1rem');
  });

  it('should generate responsive grid pattern', () => {
    const pattern = LayoutPatterns.responsiveGrid(1, 2, 3);
    
    expect(pattern.sm.grid?.columns).toBe(1);
    expect(pattern.md.grid?.columns).toBe(2);
    expect(pattern.lg.grid?.columns).toBe(3);
    expect(pattern.xl.grid?.columns).toBe(4);
  });

  it('should generate sidebar layout pattern', () => {
    const pattern = LayoutPatterns.sidebarLayout();
    
    expect(pattern.sm.flexbox?.direction).toBe('column');
    expect(pattern.md.flexbox?.direction).toBe('column');
    expect(pattern.lg.grid?.columns).toBe('250px 1fr');
    expect(pattern.xl.grid?.columns).toBe('300px 1fr');
  });
});
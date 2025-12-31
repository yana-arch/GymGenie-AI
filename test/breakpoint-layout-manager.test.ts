import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getCurrentBreakpoint, isTouchDevice, BREAKPOINT_CONFIG } from '../hooks/useBreakpoint';
import { LayoutManager, LayoutPatterns } from '../utils/layoutManager';

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

  describe('getCurrentBreakpoint', () => {
    it('should return mobile for widths below 768px', () => {
      expect(getCurrentBreakpoint(320)).toBe('mobile');
      expect(getCurrentBreakpoint(767)).toBe('mobile');
    });

    it('should return tablet for widths between 768px and 1023px', () => {
      expect(getCurrentBreakpoint(768)).toBe('tablet');
      expect(getCurrentBreakpoint(1023)).toBe('tablet');
    });

    it('should return desktop for widths between 1024px and 1439px', () => {
      expect(getCurrentBreakpoint(1024)).toBe('desktop');
      expect(getCurrentBreakpoint(1439)).toBe('desktop');
    });

    it('should return large-desktop for widths 1440px and above', () => {
      expect(getCurrentBreakpoint(1440)).toBe('large-desktop');
      expect(getCurrentBreakpoint(2560)).toBe('large-desktop');
    });

    it('should use window.innerWidth when no width provided', () => {
      mockWindow.innerWidth = 800;
      expect(getCurrentBreakpoint()).toBe('tablet');
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
    it('should have correct breakpoint ranges', () => {
      expect(BREAKPOINT_CONFIG.mobile).toEqual({ minWidth: 320, maxWidth: 767 });
      expect(BREAKPOINT_CONFIG.tablet).toEqual({ minWidth: 768, maxWidth: 1023 });
      expect(BREAKPOINT_CONFIG.desktop).toEqual({ minWidth: 1024, maxWidth: 1439 });
      expect(BREAKPOINT_CONFIG['large-desktop']).toEqual({ minWidth: 1440, maxWidth: Infinity });
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
          mobile: {
            spacing: { padding: '1rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          tablet: {
            spacing: { padding: '1.5rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          desktop: {
            spacing: { padding: '2rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          'large-desktop': {
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
          mobile: {
            spacing: { padding: '1rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          tablet: {
            spacing: { padding: '1.5rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          desktop: {
            spacing: { padding: '2rem', margin: '0' },
            visibility: { display: 'block' as const }
          },
          'large-desktop': {
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
          mobile: {
            flexbox: { direction: 'column' as const, wrap: 'nowrap' as const, justify: 'flex-start' as const, align: 'stretch' as const },
            spacing: { padding: '1rem', margin: '0' },
            visibility: { display: 'flex' as const }
          },
          tablet: {
            grid: { columns: 2, gap: '1.5rem' },
            spacing: { padding: '1.5rem', margin: '0' },
            visibility: { display: 'grid' as const }
          },
          desktop: {
            grid: { columns: 3, gap: '2rem' },
            spacing: { padding: '2rem', margin: '0' },
            visibility: { display: 'grid' as const }
          },
          'large-desktop': {
            grid: { columns: 4, gap: '2.5rem' },
            spacing: { padding: '2.5rem', margin: '0' },
            visibility: { display: 'grid' as const }
          }
        }
      };

      layoutManager.registerComponent('test-component', config);
    });

    it('should get layout configuration for mobile breakpoint', () => {
      const config = layoutManager.getLayoutConfig('test-component', 'mobile');
      expect(config).toBeTruthy();
      expect(config?.flexbox?.direction).toBe('column');
      expect(config?.spacing.padding).toBe('1rem');
    });

    it('should get layout configuration for tablet breakpoint', () => {
      const config = layoutManager.getLayoutConfig('test-component', 'tablet');
      expect(config).toBeTruthy();
      expect(config?.grid?.columns).toBe(2);
      expect(config?.spacing.padding).toBe('1.5rem');
    });

    it('should return null for unregistered component', () => {
      const config = layoutManager.getLayoutConfig('nonexistent-component', 'mobile');
      expect(config).toBeNull();
    });
  });

  describe('Layout Application', () => {
    beforeEach(() => {
      const config = {
        component: 'test-component',
        layouts: {
          mobile: {
            flexbox: { direction: 'column' as const, wrap: 'nowrap' as const, justify: 'flex-start' as const, align: 'stretch' as const },
            spacing: { padding: '1rem', margin: '0' },
            visibility: { display: 'flex' as const },
            className: 'mobile-layout'
          },
          tablet: {
            grid: { columns: 2, gap: '1.5rem' },
            spacing: { padding: '1.5rem', margin: '0' },
            visibility: { display: 'grid' as const },
            className: 'tablet-layout'
          },
          desktop: {
            grid: { columns: 3, gap: '2rem' },
            spacing: { padding: '2rem', margin: '0' },
            visibility: { display: 'grid' as const },
            className: 'desktop-layout'
          },
          'large-desktop': {
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
      layoutManager.applyLayout('mobile', 'test-component', mockElement);
      
      expect(mockElement.style.display).toBe('flex');
      expect(mockElement.style.flexDirection).toBe('column');
      expect(mockElement.style.padding).toBe('1rem');
      expect(mockElement.className).toContain('mobile-layout');
    });

    it('should apply tablet grid layout styles', () => {
      layoutManager.applyLayout('tablet', 'test-component', mockElement);
      
      expect(mockElement.style.display).toBe('grid');
      expect(mockElement.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
      expect(mockElement.style.gap).toBe('1.5rem');
      expect(mockElement.style.padding).toBe('1.5rem');
      expect(mockElement.className).toContain('tablet-layout');
    });

    it('should emit layout change event', () => {
      layoutManager.applyLayout('desktop', 'test-component', mockElement);
      
      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'layoutChange',
          detail: expect.objectContaining({
            component: 'test-component',
            breakpoint: 'desktop'
          })
        })
      );
    });
  });
});

describe('Layout Patterns', () => {
  it('should generate mobile stack pattern', () => {
    const pattern = LayoutPatterns.mobileStack('1.5rem');
    
    expect(pattern.mobile.flexbox?.direction).toBe('column');
    expect(pattern.mobile.flexbox?.gap).toBe('1.5rem');
    expect(pattern.mobile.spacing.padding).toBe('1rem');
  });

  it('should generate responsive grid pattern', () => {
    const pattern = LayoutPatterns.responsiveGrid(1, 2, 3);
    
    expect(pattern.mobile.grid?.columns).toBe(1);
    expect(pattern.tablet.grid?.columns).toBe(2);
    expect(pattern.desktop.grid?.columns).toBe(3);
    expect(pattern['large-desktop'].grid?.columns).toBe(4);
  });

  it('should generate sidebar layout pattern', () => {
    const pattern = LayoutPatterns.sidebarLayout();
    
    expect(pattern.mobile.flexbox?.direction).toBe('column');
    expect(pattern.tablet.flexbox?.direction).toBe('column');
    expect(pattern.desktop.grid?.columns).toBe('250px 1fr');
    expect(pattern['large-desktop'].grid?.columns).toBe('300px 1fr');
  });
});
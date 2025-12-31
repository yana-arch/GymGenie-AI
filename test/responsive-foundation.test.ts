import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Responsive Foundation Configuration', () => {
  it('should have correct Tailwind CSS breakpoint configuration', () => {
    const tailwindConfigPath = path.resolve('tailwind.config.js');
    const configContent = fs.readFileSync(tailwindConfigPath, 'utf-8');
    
    // Check that custom breakpoints are defined
    expect(configContent).toContain("'mobile': '320px'");
    expect(configContent).toContain("'tablet': '768px'");
    expect(configContent).toContain("'desktop': '1024px'");
    expect(configContent).toContain("'large-desktop': '1440px'");
    
    // Check that responsive spacing is configured
    expect(configContent).toContain('responsive-xs');
    expect(configContent).toContain('responsive-sm');
    expect(configContent).toContain('responsive-md');
    
    // Check that touch target sizes are configured
    expect(configContent).toContain('touch-target');
    expect(configContent).toContain('44px');
  });

  it('should have CSS custom properties for responsive values', () => {
    const cssPath = path.resolve('index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Check breakpoint variables
    expect(cssContent).toContain('--breakpoint-mobile: 320px');
    expect(cssContent).toContain('--breakpoint-tablet: 768px');
    expect(cssContent).toContain('--breakpoint-desktop: 1024px');
    expect(cssContent).toContain('--breakpoint-large-desktop: 1440px');
    
    // Check responsive spacing variables
    expect(cssContent).toContain('--spacing-responsive-xs');
    expect(cssContent).toContain('--spacing-responsive-sm');
    expect(cssContent).toContain('--spacing-responsive-md');
    
    // Check touch target variables
    expect(cssContent).toContain('--touch-target-min: 44px');
    expect(cssContent).toContain('--touch-target-comfortable: 48px');
    
    // Check responsive font size variables
    expect(cssContent).toContain('--font-size-responsive-base');
    expect(cssContent).toContain('--font-size-responsive-lg');
  });

  it('should have proper viewport meta tag in HTML', () => {
    const htmlPath = path.resolve('index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    
    // Check viewport meta tag
    expect(htmlContent).toContain('name="viewport"');
    expect(htmlContent).toContain('width=device-width');
    expect(htmlContent).toContain('initial-scale=1.0');
    expect(htmlContent).toContain('shrink-to-fit=no');
    expect(htmlContent).toContain('viewport-fit=cover');
    
    // Check PWA meta tags
    expect(htmlContent).toContain('name="mobile-web-app-capable"');
    expect(htmlContent).toContain('name="apple-mobile-web-app-capable"');
    expect(htmlContent).toContain('content="yes"');
  });

  it('should have responsive utility classes defined in CSS', () => {
    const cssPath = path.resolve('index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Check container utility
    expect(cssContent).toContain('.container-responsive');
    expect(cssContent).toContain('width: 100%');
    expect(cssContent).toContain('margin-left: auto');
    expect(cssContent).toContain('margin-right: auto');
    
    // Check grid utility
    expect(cssContent).toContain('.grid-responsive');
    expect(cssContent).toContain('display: grid');
    
    // Check touch target utilities
    expect(cssContent).toContain('.touch-target');
    expect(cssContent).toContain('min-height: var(--touch-target-min)');
    expect(cssContent).toContain('min-width: var(--touch-target-min)');
  });

  it('should have media queries for different breakpoints', () => {
    const cssPath = path.resolve('index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Check tablet media query
    expect(cssContent).toContain('@media (min-width: 768px)');
    
    // Check desktop media query
    expect(cssContent).toContain('@media (min-width: 1024px)');
    
    // Check large desktop media query
    expect(cssContent).toContain('@media (min-width: 1440px)');
    
    // Check reduced motion media query
    expect(cssContent).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('should have base responsive styles for html and body', () => {
    const cssPath = path.resolve('index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Check html styles
    expect(cssContent).toContain('overflow-x: hidden');
    expect(cssContent).toContain('scroll-behavior: smooth');
    expect(cssContent).toContain('-webkit-text-size-adjust: 100%');
    
    // Check body styles
    expect(cssContent).toContain('min-height: 100vh');
    expect(cssContent).toContain('min-height: 100dvh');
  });

  it('should have accessibility and performance optimizations', () => {
    const cssPath = path.resolve('index.css');
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    
    // Check focus styles
    expect(cssContent).toContain('.focus-visible');
    expect(cssContent).toContain('outline: 2px solid');
    
    // Check responsive image utility
    expect(cssContent).toContain('.img-responsive');
    expect(cssContent).toContain('max-width: 100%');
    expect(cssContent).toContain('height: auto');
    
    // Check reduced motion support
    expect(cssContent).toContain('animation-duration: 0.01ms !important');
    expect(cssContent).toContain('transition-duration: 0.01ms !important');
  });
});
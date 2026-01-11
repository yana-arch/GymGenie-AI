import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';

const SimpleComponent = () => <div data-testid="simple">Hello</div>;

describe('SimpleComponent', () => {
  it('should render @p0', () => {
    render(<SimpleComponent />);
    expect(screen.getByTestId('simple')).toBeDefined();
  });
});

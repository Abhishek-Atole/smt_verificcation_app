import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

function TestConsumer() {
  const { resolvedTheme } = useTheme();
  return <div data-testid="theme">{resolvedTheme}</div>;
}

describe('ThemeContext', () => {
  it('renders resolved theme', () => {
    // jsdom doesn't implement matchMedia by default; mock it for the test
    // to allow ThemeProvider to determine a resolved theme.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).matchMedia = (_query: string) => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
    render(<ThemeProvider><TestConsumer /></ThemeProvider>);
    expect(screen.getByTestId('theme').textContent).toMatch(/dark|light/);
  });
});

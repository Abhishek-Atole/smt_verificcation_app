import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, it, expect } from 'vitest';
import { ToastProvider, useToast } from '../contexts/ToastContext';

function TestConsumer() {
  const { showToast } = useToast();
  useEffect(() => { showToast('hello', 'info'); }, []);
  return <div data-testid="toast">ok</div>;
}

describe('ToastContext', () => {
  it('renders provider and can show toast', () => {
    render(<ToastProvider><TestConsumer /></ToastProvider>);
    expect(screen.getByTestId('toast').textContent).toBe('ok');
  });
});

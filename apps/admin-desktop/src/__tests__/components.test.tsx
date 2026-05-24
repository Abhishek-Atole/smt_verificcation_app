import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button, Modal, Input } from '../components';

describe('UI components', () => {
  it('Button renders children', () => {
    render(<Button>Click</Button>);
    expect(screen.getByText('Click')).toBeTruthy();
  });

  it('Input renders label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  it('Modal renders when open', () => {
    const { container } = render(<Modal open={true} onClose={() => {}} title="Test">Body</Modal>);
    expect(container.querySelector('.modal-shell')).toBeTruthy();
  });
});

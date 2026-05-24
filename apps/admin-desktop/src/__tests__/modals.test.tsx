import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ConfirmModal from '../components/modals/ConfirmModal';
import FormModal from '../components/modals/FormModal';

describe('Modals', () => {
  it('ConfirmModal renders and triggers callbacks', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(<ConfirmModal open={true} title="Are you sure" message="Do it?" onConfirm={onConfirm} onCancel={onCancel} />);
    expect(screen.getByText('Are you sure')).toBeTruthy();
    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('FormModal submits and closes', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();
    render(<FormModal open={true} title="Form" onSubmit={onSubmit} onClose={onClose}><div>Inner</div></FormModal>);
    expect(screen.getByText('Form')).toBeTruthy();
    fireEvent.click(screen.getByText('Submit'));
    expect(onSubmit).toHaveBeenCalled();
  });
});

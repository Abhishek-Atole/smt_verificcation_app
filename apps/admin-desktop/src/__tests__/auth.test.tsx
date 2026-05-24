import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function TestConsumer() {
  const { user, quickLogin, logout } = useAuth();
  return (
    <div>
      <div data-testid="user">{user ? user.email : 'null'}</div>
      <button onClick={() => quickLogin('admin')}>login</button>
      <button onClick={() => logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  it('provides default null user', () => {
    render(<AuthProvider><TestConsumer /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('null');
  });
});

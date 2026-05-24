import React from 'react';

export function AppShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="app-shell">
      <div className="app-shell-main">
        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}

export default AppShell;

import type { ReactNode } from 'react';

export function EmptyState({ icon, heading, description, action }: { icon: ReactNode; heading: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3>{heading}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

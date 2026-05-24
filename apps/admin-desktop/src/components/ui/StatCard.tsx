import type { ReactNode } from 'react';
import clsx from 'clsx';

export function StatCard({ label, value, delta, deltaType = 'up', icon, onClick }: { label: string; value: string; delta: string; deltaType?: 'up' | 'down'; icon?: ReactNode; onClick?: () => void }) {
  return (
    <button className={clsx('stat-card', onClick && 'is-clickable')} onClick={onClick} type="button">
      <div className="stat-card-icon">{icon}</div>
      <div className="stat-card-copy">
        <span className="stat-label">{label}</span>
        <strong className="stat-value">{value}</strong>
        <span className={clsx('stat-delta', deltaType === 'up' ? 'is-up' : 'is-down')}>{delta}</span>
      </div>
    </button>
  );
}

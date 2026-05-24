import clsx from 'clsx';
import type { ReactNode } from 'react';

type BadgeVariant = 'active' | 'completed' | 'failed' | 'pending' | 'info' | 'admin' | 'supervisor' | 'qa' | 'operator' | 'primary' | 'secondary' | 'tertiary';

export function Badge({ variant, children, dot = false }: { variant: BadgeVariant; children: ReactNode; dot?: boolean }) {
  return (
    <span className={clsx('badge', `badge-${variant}`)}>
      {dot ? <span className={clsx('badge-dot', variant === 'active' && 'pulse-dot')} /> : null}
      {children}
    </span>
  );
}

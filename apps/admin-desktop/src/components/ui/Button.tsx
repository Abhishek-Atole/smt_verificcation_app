import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export function Button({ variant = 'primary', size = 'md', loading = false, leftIcon, rightIcon, className, disabled, children, ...props }: ButtonProps) {
  return (
    <button className={clsx('ui-button', `ui-button-${variant}`, `ui-button-${size}`, loading && 'is-loading', className)} disabled={disabled || loading} {...props}>
      {loading ? <span className="spinner" aria-hidden="true" /> : leftIcon}
      <span>{children}</span>
      {rightIcon}
    </button>
  );
}

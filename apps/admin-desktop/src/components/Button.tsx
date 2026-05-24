import React from 'react';
import clsx from 'clsx';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  const base = 'ui-button';
  const variantClass = {
    primary: 'ui-button-primary',
    secondary: 'ui-button-secondary',
    ghost: 'ui-button-ghost',
    danger: 'ui-button-danger',
  }[variant];

  return (
    <button className={clsx(base, variantClass, className)} {...rest}>
      {children}
    </button>
  );
}

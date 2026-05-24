import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Input({ label, className, ...rest }: InputProps) {
  return (
    <label className={clsx('field', className)}>
      {label && <span className="field-label">{label}</span>}
      <div className="input-shell">
        <input className="ui-input" {...rest} />
      </div>
    </label>
  );
}

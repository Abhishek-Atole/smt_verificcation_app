import { forwardRef, useId, useState, type HTMLInputTypeAttribute, type InputHTMLAttributes, type ReactNode } from 'react';
import clsx from 'clsx';
import { Eye, EyeOff, Search, X } from 'lucide-react';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'prefix'> {
  label?: string;
  helperText?: string;
  error?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  type?: HTMLInputTypeAttribute | 'search';
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helperText, error, prefix, suffix, type = 'text', onClear, className, id, value, onChange, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword && showPassword ? 'text' : type === 'search' ? 'text' : type;
  const prefixNode = type === 'search' ? <Search size={16} /> : prefix;

  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span className="field-label">{label}</span> : null}
      <span className={clsx('input-shell', error && 'has-error')}>
        {prefixNode ? <span className="input-prefix">{prefixNode}</span> : null}
        <input ref={ref} id={inputId} className={clsx('ui-input', className)} type={actualType} value={value} onChange={onChange} {...props} />
        <span className="input-actions">
          {type === 'search' && value ? (
            <button type="button" className="input-icon-button" onClick={onClear} aria-label="Clear input">
              <X size={14} />
            </button>
          ) : null}
          {isPassword ? (
            <button type="button" className="input-icon-button" onClick={() => setShowPassword((current) => !current)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          ) : null}
          {suffix}
        </span>
      </span>
      {(error || helperText) ? <span className={clsx('field-hint', error && 'is-error')}>{error ?? helperText}</span> : null}
    </label>
  );
});

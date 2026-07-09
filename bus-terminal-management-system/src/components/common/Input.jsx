import { forwardRef } from 'react';

const Input = forwardRef(
  ({ label, error, hint, leftIcon, rightIcon, className = '', containerClassName = '', id, ...rest }, ref) => {
    const inputId = id || rest.name;
    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={inputId} className="field-label">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`input ${leftIcon ? 'pl-9' : ''} ${rightIcon ? 'pr-9' : ''} ${error ? 'input-error' : ''} ${className}`}
            {...rest}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted">{rightIcon}</span>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

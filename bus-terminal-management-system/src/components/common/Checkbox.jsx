import { forwardRef } from 'react';

const Checkbox = forwardRef(({ label, error, className = '', id, ...rest }, ref) => {
  const checkboxId = id || rest.name;
  return (
    <div>
      <label htmlFor={checkboxId} className={`flex items-center gap-2 text-sm text-ink-variant ${className}`}>
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-2 focus:ring-primary-100"
          {...rest}
        />
        {label}
      </label>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export default Checkbox;

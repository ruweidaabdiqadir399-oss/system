import { forwardRef } from 'react';
import { FiChevronDown } from 'react-icons/fi';

const Select = forwardRef(
  ({ label, error, hint, options, placeholder, className = '', containerClassName = '', id, children, ...rest }, ref) => {
    const selectId = id || rest.name;
    return (
      <div className={containerClassName}>
        {label && (
          <label htmlFor={selectId} className="field-label">
            {label}
          </label>
        )}
        <div className="relative">
          <select ref={ref} id={selectId} className={`select ${error ? 'input-error' : ''} ${className}`} {...rest}>
            {placeholder && <option value="">{placeholder}</option>}
            {options
              ? options.map((opt) => {
                  const value = typeof opt === 'string' ? opt : opt.value;
                  const label2 = typeof opt === 'string' ? opt : opt.label;
                  return (
                    <option key={value} value={value}>
                      {label2}
                    </option>
                  );
                })
              : children}
          </select>
          <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        </div>
        {error && <p className="error-text">{error}</p>}
        {!error && hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;

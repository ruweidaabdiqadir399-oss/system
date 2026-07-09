import { forwardRef } from 'react';

const Textarea = forwardRef(({ label, error, hint, className = '', containerClassName = '', id, ...rest }, ref) => {
  const textareaId = id || rest.name;
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={textareaId} className="field-label">
          {label}
        </label>
      )}
      <textarea ref={ref} id={textareaId} className={`textarea ${error ? 'input-error' : ''} ${className}`} {...rest} />
      {error && <p className="error-text">{error}</p>}
      {!error && hint && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;

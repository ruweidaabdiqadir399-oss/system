/**
 * Compact pill-style toggle group, used for chart period switches (7d/30d/1y).
 * `options`: array of strings or { value, label }.
 */
const SegmentedControl = ({ options, value, onChange, className = '' }) => (
  <div className={`inline-flex items-center gap-1 rounded-lg bg-slate-100 p-1 ${className}`}>
    {options.map((option) => {
      const optValue = typeof option === 'string' ? option : option.value;
      const optLabel = typeof option === 'string' ? option : option.label;
      const isActive = optValue === value;
      return (
        <button
          key={optValue}
          type="button"
          onClick={() => onChange(optValue)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            isActive ? 'bg-white text-primary-600 shadow-sm' : 'text-ink-muted hover:text-ink'
          }`}
        >
          {optLabel}
        </button>
      );
    })}
  </div>
);

export default SegmentedControl;

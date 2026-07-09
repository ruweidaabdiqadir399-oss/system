const Switch = ({ checked, onChange, label, description, disabled = false, className = '' }) => (
  <label className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-50' : 'cursor-pointer'} ${className}`}>
    {(label || description) && (
      <span>
        {label && <span className="block text-sm font-medium text-ink">{label}</span>}
        {description && <span className="block text-xs text-ink-muted">{description}</span>}
      </span>
    )}
    <span
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-primary-600' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </span>
  </label>
);

export default Switch;

import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';

const COLOR_CLASS = {
  primary: 'bg-primary-50 text-primary-600',
  secondary: 'bg-secondary-50 text-secondary-600',
  accent: 'bg-accent-50 text-accent-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  info: 'bg-info-50 text-info-600',
};

const StatCard = ({ icon, label, value, helperText, change, trend, color = 'primary', className = '' }) => {
  const Icon = icon;
  const isUp = trend === 'up';

  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="mt-1 text-2xl font-display font-bold text-ink">{value}</p>
        </div>
        {Icon && (
          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${COLOR_CLASS[color] ?? COLOR_CLASS.primary}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      {(change !== undefined || helperText) && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {change !== undefined && (
            <span className={`flex items-center gap-0.5 font-semibold ${isUp ? 'text-success-600' : 'text-danger-600'}`}>
              {isUp ? <FiArrowUpRight className="h-3.5 w-3.5" /> : <FiArrowDownRight className="h-3.5 w-3.5" />}
              {Math.abs(change)}%
            </span>
          )}
          {helperText && <span className="text-ink-muted">{helperText}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;

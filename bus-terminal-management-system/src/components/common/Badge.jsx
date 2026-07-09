import { statusBadgeClass } from '../../utils/formatters';

const VARIANT_CLASS = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  neutral: 'badge-neutral',
  primary: 'badge-primary',
};

/**
 * Renders a status pill. Pass `status` to auto-map common BTMS status
 * strings (Active, Cancelled, Delayed, ...) to a color, or pass `variant`
 * directly to force a specific color.
 */
const Badge = ({ status, variant, children, className = '' }) => {
  const badgeClass = variant ? VARIANT_CLASS[variant] ?? VARIANT_CLASS.neutral : statusBadgeClass(status);
  return <span className={`${badgeClass} ${className}`}>{children ?? status}</span>;
};

export default Badge;

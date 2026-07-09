import { FiAlertTriangle } from 'react-icons/fi';
import Button from './Button';

const ErrorState = ({ title = 'Something went wrong', message, onRetry, className = '' }) => (
  <div className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}>
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-50 text-danger-600">
      <FiAlertTriangle className="h-6 w-6" />
    </div>
    <div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {message && <p className="mt-1 text-sm text-ink-muted">{message}</p>}
    </div>
    {onRetry && (
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);

export default ErrorState;

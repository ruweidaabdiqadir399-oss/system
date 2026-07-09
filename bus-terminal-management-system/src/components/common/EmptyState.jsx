import { FiInbox } from 'react-icons/fi';

const EmptyState = ({ icon, title = 'Nothing here yet', description, action, className = '' }) => {
  const Icon = icon ?? FiInbox;
  return (
    <div className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-ink-muted">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">{title}</p>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
};

export default EmptyState;

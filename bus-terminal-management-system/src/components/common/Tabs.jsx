/**
 * Controlled tab strip. `tabs` is [{ value, label, count? }].
 */
const Tabs = ({ tabs, activeTab, onChange, className = '' }) => (
  <div className={`flex items-center gap-1 overflow-x-auto border-b border-slate-200 ${className}`}>
    {tabs.map((tab) => {
      const isActive = tab.value === activeTab;
      return (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            isActive ? 'border-primary-600 text-primary-600' : 'border-transparent text-ink-muted hover:text-ink'
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span
              className={`ml-2 rounded-full px-1.5 py-0.5 text-xs ${
                isActive ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-ink-muted'
              }`}
            >
              {tab.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default Tabs;

const PageHeader = ({ title, subtitle, actions, breadcrumb }) => (
  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div>
      {breadcrumb && <p className="mb-1 text-sm font-medium text-ink-muted">{breadcrumb}</p>}
      <h1 className="text-2xl font-display font-bold text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export default PageHeader;

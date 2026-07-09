const Card = ({ title, subtitle, actions, children, className = '', bodyClassName = '', noPadding = false }) => (
  <div className={`card ${className}`}>
    {(title || actions) && (
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          {title && <h3 className="text-base font-display font-semibold text-ink">{title}</h3>}
          {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    )}
    <div className={`${noPadding ? '' : 'p-5'} ${bodyClassName}`}>{children}</div>
  </div>
);

export default Card;

/**
 * Shared Recharts tooltip styled to match the app's card/popover aesthetic.
 * Pass `valueFormatter` to format raw numeric values (currency, %, etc).
 * Works for Area, Bar, and Line charts. PieChartCard uses its own inline tooltip.
 */
const ChartTooltip = ({ active, payload, label, valueFormatter = (v) => v }) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3.5 py-2.5 shadow-popover">
      {label && (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      )}
      <div className="space-y-1.5">
        {payload.map((entry) => (
          <div
            key={entry.dataKey ?? entry.name}
            className="flex items-center gap-2 text-sm"
          >
            <span
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: entry.color ?? entry.payload?.color ?? '#9CA3AF' }}
            />
            <span className="text-ink-muted">{entry.name}</span>
            <span className="ml-auto pl-4 font-semibold tabular-nums text-ink">
              {valueFormatter(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartTooltip;

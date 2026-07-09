import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Label } from 'recharts';
import Card from '../common/Card';

// ── Center label rendered inside the donut hole ──────────────────────────────

const CenterLabel = ({ viewBox, total }) => {
  if (!viewBox) return null;
  const { cx, cy } = viewBox;
  return (
    <g>
      <text
        x={cx}
        y={cy - 9}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 11, fill: '#9CA3AF', fontWeight: 500, letterSpacing: '0.03em' }}
      >
        TOTAL
      </text>
      <text
        x={cx}
        y={cy + 13}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: 24, fill: '#111827', fontWeight: 700 }}
      >
        {total.toLocaleString()}
      </text>
    </g>
  );
};

// ── Tooltip ───────────────────────────────────────────────────────────────────

const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  const pct =
    entry.payload?.percent != null ? Math.round(entry.payload.percent * 100) : null;

  return (
    <div className="rounded-lg border border-slate-100 bg-white px-3.5 py-2.5 shadow-popover">
      <div className="flex items-center gap-2 pb-1.5">
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ backgroundColor: entry.payload?.color ?? entry.fill }}
        />
        <span className="text-sm font-semibold text-ink">{entry.name}</span>
      </div>
      <div className="pl-4 text-sm">
        <span className="font-bold text-ink">{entry.value.toLocaleString()}</span>
        {pct != null && (
          <span className="ml-2 text-xs font-medium text-ink-muted">({pct}%)</span>
        )}
      </div>
    </div>
  );
};

// ── Legend item ───────────────────────────────────────────────────────────────

const LegendItem = ({ entry, total }) => {
  const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
  const color = entry.color ?? '#9CA3AF';

  return (
    <div className="flex items-center gap-2.5 py-1">
      <span
        className="h-2.5 w-2.5 flex-shrink-0 rounded-full ring-2 ring-white"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-ink-muted">{entry.label}</span>
      <div className="flex w-32 items-center gap-2.5">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>
        <span className="w-8 text-right text-xs font-semibold tabular-nums text-ink-muted">
          {pct}%
        </span>
      </div>
      <span className="w-7 text-right text-sm font-bold tabular-nums text-ink">
        {entry.value}
      </span>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

/**
 * `data`: [{ label, value, color }]
 * height controls the donut portion; the legend expands below naturally.
 */
const PieChartCard = ({
  title,
  subtitle,
  actions,
  data = [],
  height = 300,
  loading = false,
  donut = true,
}) => {
  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const hasData = data.length > 0 && total > 0;

  // Reserve space for legend rows so the donut is sized from remaining height.
  const LEGEND_ROW_H = 36;
  const LEGEND_GAP   = 20;
  const legendH      = data.length * LEGEND_ROW_H + LEGEND_GAP;
  const donutH       = Math.max(height - legendH, 140);

  return (
    <Card title={title} subtitle={subtitle} actions={actions} noPadding>
      <div className="p-5">
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton mx-auto rounded-full" style={{ width: donutH * 0.85, height: donutH * 0.85 }} />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton h-4 w-full rounded" />
            ))}
          </div>
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
              </svg>
            </div>
            <p className="text-sm text-ink-muted">No data available</p>
          </div>
        ) : (
          <>
            {/* Donut */}
            <ResponsiveContainer width="100%" height={donutH}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={donut ? '52%' : 0}
                  outerRadius="85%"
                  paddingAngle={donut && data.length > 1 ? 3 : 0}
                  dataKey="value"
                  nameKey="label"
                  strokeWidth={2}
                  stroke="#ffffff"
                  isAnimationActive
                  animationBegin={0}
                  animationDuration={600}
                >
                  {data.map((entry) => (
                    <Cell key={entry.label} fill={entry.color ?? '#9CA3AF'} />
                  ))}
                  {donut && (
                    <Label
                      content={<CenterLabel total={total} />}
                      position="center"
                    />
                  )}
                </Pie>
                <Tooltip
                  content={<PieTooltip />}
                  wrapperStyle={{ outline: 'none' }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Divider */}
            <div className="my-3 border-t border-slate-100" />

            {/* Custom legend */}
            <div className="divide-y divide-slate-50">
              {data.map((entry) => (
                <LegendItem key={entry.label} entry={entry} total={total} />
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default PieChartCard;

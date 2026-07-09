import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../common/Card';
import ChartTooltip from './ChartTooltip';

const AXIS_TICK = { fontSize: 12, fill: '#9CA3AF', fontWeight: 500 };

const abbreviate = (n) => {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
  return String(n);
};

// Custom legend item rendered below the chart
const renderLegend = ({ payload }) => (
  <div className="flex flex-wrap justify-center gap-x-5 gap-y-1.5 pt-2">
    {payload.map((entry) => (
      <div key={entry.dataKey ?? entry.value} className="flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
        <span className="text-xs font-medium text-ink-muted">{entry.value}</span>
      </div>
    ))}
  </div>
);

/**
 * `areas`: [{ dataKey, name?, color }]
 */
const AreaChartCard = ({
  title,
  subtitle,
  actions,
  data = [],
  areas = [],
  xKey = 'label',
  height = 300,
  valueFormatter,
  loading = false,
}) => (
  <Card title={title} subtitle={subtitle} actions={actions} noPadding>
    <div className="p-5">
      {loading ? (
        <div className="skeleton w-full" style={{ height }} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              {areas.map((area) => (
                <linearGradient key={area.dataKey} id={`gradient-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={area.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={area.color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            <XAxis
              dataKey={xKey}
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickMargin={8}
            />
            <YAxis
              tick={AXIS_TICK}
              axisLine={false}
              tickLine={false}
              tickFormatter={abbreviate}
              width={42}
            />
            <Tooltip
              content={<ChartTooltip valueFormatter={valueFormatter} />}
              cursor={{ stroke: '#E5E7EB', strokeWidth: 1 }}
            />
            <Legend content={renderLegend} verticalAlign="bottom" />
            {areas.map((area) => (
              <Area
                key={area.dataKey}
                type="monotone"
                dataKey={area.dataKey}
                name={area.name ?? area.dataKey}
                stroke={area.color}
                fill={`url(#gradient-${area.dataKey})`}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff', fill: area.color }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  </Card>
);

export default AreaChartCard;

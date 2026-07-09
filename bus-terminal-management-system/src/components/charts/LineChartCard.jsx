import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../common/Card';
import ChartTooltip from './ChartTooltip';

const AXIS_TICK = { fontSize: 12, fill: '#9CA3AF' };

/**
 * `lines`: [{ dataKey, name?, color }]
 */
const LineChartCard = ({ title, subtitle, actions, data = [], lines = [], xKey = 'label', height = 300, valueFormatter, loading = false }) => (
  <Card title={title} subtitle={subtitle} actions={actions} noPadding>
    <div className="p-5">
      {loading ? (
        <div className="skeleton w-full" style={{ height }} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} />
            {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />}
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name ?? line.dataKey}
                stroke={line.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  </Card>
);

export default LineChartCard;

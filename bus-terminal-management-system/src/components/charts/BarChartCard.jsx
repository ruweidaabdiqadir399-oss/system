import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../common/Card';
import ChartTooltip from './ChartTooltip';

const AXIS_TICK = { fontSize: 12, fill: '#9CA3AF' };

/**
 * `bars`: [{ dataKey, name?, color }]
 */
const BarChartCard = ({ title, subtitle, actions, data = [], bars = [], xKey = 'label', height = 300, valueFormatter, loading = false }) => (
  <Card title={title} subtitle={subtitle} actions={actions} noPadding>
    <div className="p-5">
      {loading ? (
        <div className="skeleton w-full" style={{ height }} />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip content={<ChartTooltip valueFormatter={valueFormatter} />} cursor={{ fill: '#F3F4F6' }} />
            {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />}
            {bars.map((bar) => (
              <Bar key={bar.dataKey} dataKey={bar.dataKey} name={bar.name ?? bar.dataKey} fill={bar.color} radius={[4, 4, 0, 0]} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  </Card>
);

export default BarChartCard;

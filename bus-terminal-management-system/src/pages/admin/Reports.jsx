import { useState } from 'react';
import {
  FiDollarSign,
  FiClipboard,
  FiUsers,
  FiPercent,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import SegmentedControl from '../../components/common/SegmentedControl';
import LineChartCard from '../../components/charts/LineChartCard';
import { useFetch } from '../../hooks/useFetch';
import {
  getReportSummary,
  getRevenueVsBookingsTrend,
  getTopRoutePerformance,
} from '../../services/reportService';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

const PERIOD_OPTIONS = [
  { value: '30d', label: '30D' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'ytd', label: 'YTD' },
];

const ROUTE_COLUMNS = [
  {
    key: 'name',
    header: 'Route',
    render: (row) => (
      <div>
        <p className="font-medium text-ink">{row.name}</p>
        <p className="text-xs text-ink-muted">{row.code}</p>
      </div>
    ),
  },
  { key: 'bookingCount', header: 'Bookings', render: (row) => formatNumber(row.bookingCount) },
  { key: 'revenue', header: 'Revenue', render: (row) => formatCurrency(row.revenue) },
  {
    key: 'trend',
    header: 'Trend',
    render: (row) => (
      <span className={`flex items-center gap-1 text-sm font-semibold ${row.trend >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
        {row.trend >= 0 ? <FiTrendingUp className="h-3.5 w-3.5" /> : <FiTrendingDown className="h-3.5 w-3.5" />}
        {Math.abs(row.trend)}%
      </span>
    ),
  },
];

const AdminReports = () => {
  const [period, setPeriod] = useState('30d');

  const { data: summary, loading: summaryLoading } = useFetch(() => getReportSummary(), []);
  const { data: trend, loading: trendLoading } = useFetch(() => getRevenueVsBookingsTrend(period), [period]);
  const { data: topRoutes, loading: routesLoading } = useFetch(() => getTopRoutePerformance(), []);

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        subtitle="Deep dive into revenue, bookings, and fleet performance."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FiDollarSign}
          label="Total Revenue"
          value={summaryLoading ? '...' : formatCurrency(summary?.totalRevenue.value)}
          change={summary?.totalRevenue.change}
          trend={summary?.totalRevenue.trend}
          color="primary"
        />
        <StatCard
          icon={FiClipboard}
          label="Total Bookings"
          value={summaryLoading ? '...' : formatNumber(summary?.totalBookings.value)}
          change={summary?.totalBookings.change}
          trend={summary?.totalBookings.trend}
          color="secondary"
        />
        <StatCard
          icon={FiUsers}
          label="Active Passengers"
          value={summaryLoading ? '...' : formatNumber(summary?.activePassengers.value)}
          change={summary?.activePassengers.change}
          trend={summary?.activePassengers.trend}
          color="success"
        />
        <StatCard
          icon={FiPercent}
          label="Route Efficiency"
          value={summaryLoading ? '...' : formatPercent(summary?.routeEfficiency.value, 1)}
          change={summary?.routeEfficiency.change}
          trend={summary?.routeEfficiency.trend}
          color="info"
        />
      </div>

      <div className="mt-6">
        <LineChartCard
          title="Revenue vs Bookings"
          subtitle="Compare revenue and booking volume over time"
          actions={<SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />}
          data={trend ?? []}
          lines={[
            { dataKey: 'revenue', name: 'Revenue', color: '#3B82F6' },
            { dataKey: 'bookings', name: 'Bookings', color: '#F59E0B' },
          ]}
          loading={trendLoading}
          height={320}
        />
      </div>

      <div className="mt-6">
        <Card title="Top Route Performance" subtitle="Ranked by revenue" noPadding>
          <DataTable
            columns={ROUTE_COLUMNS}
            data={topRoutes ?? []}
            loading={routesLoading}
            keyField="routeId"
            emptyMessage="No route data available yet. Analytics will appear once bookings are made."
          />
        </Card>
      </div>
    </div>
  );
};

export default AdminReports;

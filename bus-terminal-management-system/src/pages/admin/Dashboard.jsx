import { useState } from 'react';
import { FiUsers, FiTruck, FiMap, FiClipboard, FiDollarSign, FiPieChart } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import DataTable from '../../components/common/DataTable';
import SegmentedControl from '../../components/common/SegmentedControl';
import AreaChartCard from '../../components/charts/AreaChartCard';
import PieChartCard from '../../components/charts/PieChartCard';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import {
  getDashboardStats,
  getRevenueBookingTrend,
  getTopRoutesOccupancy,
  getBookingStatusDistribution,
  getFleetStatusDistribution,
} from '../../services/reportService';
import { formatCurrency, formatNumber, formatPercent } from '../../utils/formatters';

const PERIOD_OPTIONS = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: '1y', label: '1Y' },
];

const ROUTE_COLUMNS = [
  {
    key: 'label',
    header: 'Route',
    render: (row) => (
      <div>
        <p className="font-medium text-ink">{row.label}</p>
        <p className="text-xs text-ink-muted">{row.code}</p>
      </div>
    ),
  },
  {
    key: 'occupancy',
    header: 'Occupancy',
    render: (row) => (
      <div className="flex items-center gap-2">
        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-primary-600" style={{ width: `${row.occupancy}%` }} />
        </div>
        <span className="text-sm font-medium text-ink">{row.occupancy}%</span>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge status={row.status} />,
  },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('7d');

  const { data: stats, loading: statsLoading } = useFetch(() => getDashboardStats(), []);
  const { data: trend, loading: trendLoading } = useFetch(() => getRevenueBookingTrend(period), [period]);
  const { data: topRoutes, loading: routesLoading } = useFetch(() => getTopRoutesOccupancy(), []);
  const { data: bookingDist, loading: bookingDistLoading } = useFetch(() => getBookingStatusDistribution(), []);
  const { data: fleetDist, loading: fleetDistLoading } = useFetch(() => getFleetStatusDistribution(), []);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Admin'}`}
        subtitle="Here's what's happening across your terminal today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={FiUsers}
          label="Total Users"
          value={statsLoading ? '...' : formatNumber(stats?.totalUsers.value)}
          change={stats?.totalUsers.change}
          trend={stats?.totalUsers.trend}
          color="primary"
        />
        <StatCard
          icon={FiTruck}
          label="Active Buses"
          value={statsLoading ? '...' : `${formatNumber(stats?.activeBuses.value)}/${formatNumber(stats?.activeBuses.total)}`}
          helperText={stats?.activeBuses.label}
          color="secondary"
        />
        <StatCard
          icon={FiMap}
          label="Total Routes"
          value={statsLoading ? '...' : formatNumber(stats?.totalRoutes.value)}
          helperText={stats?.totalRoutes.label}
          color="accent"
        />
        <StatCard
          icon={FiClipboard}
          label="Bookings Today"
          value={statsLoading ? '...' : formatNumber(stats?.bookingsToday.value)}
          change={stats?.bookingsToday.change}
          trend={stats?.bookingsToday.trend}
          color="success"
        />
        <StatCard
          icon={FiDollarSign}
          label="Daily Revenue"
          value={statsLoading ? '...' : formatCurrency(stats?.dailyRevenue.value)}
          change={stats?.dailyRevenue.change}
          trend={stats?.dailyRevenue.trend}
          color="info"
        />
        <StatCard
          icon={FiPieChart}
          label="Avg Occupancy"
          value={statsLoading ? '...' : formatPercent(stats?.avgOccupancy.value)}
          helperText={stats?.avgOccupancy.label}
          color="warning"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreaChartCard
            title="Revenue Trend"
            subtitle="Estimated revenue across all routes"
            actions={<SegmentedControl options={PERIOD_OPTIONS} value={period} onChange={setPeriod} />}
            data={trend ?? []}
            areas={[{ dataKey: 'revenue', name: 'Revenue (USD)', color: '#3b82f6' }]}
            xKey="date"
            valueFormatter={formatCurrency}
            loading={trendLoading}
            height={320}
          />
        </div>
        <PieChartCard
          title="Booking Status"
          subtitle="Distribution of all bookings"
          data={bookingDist ?? []}
          loading={bookingDistLoading}
          height={320}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Top Routes by Occupancy" subtitle="Highest performing routes today" className="lg:col-span-2" noPadding>
          <DataTable columns={ROUTE_COLUMNS} data={topRoutes ?? []} loading={routesLoading} keyField="routeId" />
        </Card>
        <PieChartCard
          title="Fleet Status"
          subtitle="Current status of all buses"
          data={fleetDist ?? []}
          loading={fleetDistLoading}
          height={300}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;

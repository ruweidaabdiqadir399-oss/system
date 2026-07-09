import { FiClipboard, FiCalendar, FiCheckCircle, FiDollarSign, FiPlusCircle, FiSearch, FiList } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { getDashboardStats } from '../../services/reportService';
import { getSchedules } from '../../services/scheduleService';
import { getTickets } from '../../services/ticketService';
import { formatCurrency, formatNumber, formatTime } from '../../utils/formatters';

const today = new Date().toISOString().slice(0, 10);

const DEPARTURE_COLUMNS = [
  {
    key: 'id',
    header: 'Trip',
    render: (row) => (
      <div>
        <p className="font-medium text-ink">{row.id}</p>
        <p className="text-xs text-ink-muted">{row.route?.code} &middot; {row.route?.name}</p>
      </div>
    ),
  },
  {
    key: 'departureTime',
    header: 'Departure',
    render: (row) => `${formatTime(row.departureTime)} - ${formatTime(row.arrivalTime)}`,
  },
  { key: 'gate', header: 'Gate' },
  { key: 'bus', header: 'Bus', render: (row) => row.bus?.busNumber ?? '-' },
  {
    key: 'bookedSeats',
    header: 'Seats',
    render: (row) => `${row.bookedSeats}/${row.totalSeats}`,
  },
  { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
];

const StaffDashboard = () => {
  const { user } = useAuth();
  const { data: stats, loading: statsLoading } = useFetch(() => getDashboardStats(), []);
  const { data: schedules, loading: schedulesLoading } = useFetch(
    () => getSchedules({ date: today, pageSize: 50 }),
    []
  );
  const { data: validTickets, loading: validLoading } = useFetch(() => getTickets({ status: 'Valid', pageSize: 1 }), []);

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Staff'}`}
        subtitle="Here's what's happening at the counter today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FiClipboard}
          label="Bookings Today"
          value={statsLoading ? '...' : formatNumber(stats?.bookingsToday.value)}
          change={stats?.bookingsToday.change}
          trend={stats?.bookingsToday.trend}
          color="primary"
        />
        <StatCard
          icon={FiCalendar}
          label="Today's Departures"
          value={schedulesLoading ? '...' : formatNumber(schedules?.total)}
          helperText="Scheduled trips for today"
          color="secondary"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Valid Tickets"
          value={validLoading ? '...' : formatNumber(validTickets?.total)}
          helperText="Ready for boarding"
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
      </div>

      <Card title="Quick Actions" className="mt-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button to="/staff/bookings" leftIcon={<FiPlusCircle className="h-4 w-4" />} className="justify-center">
            New Booking
          </Button>
          <Button to="/staff/tickets" variant="secondary" leftIcon={<FiSearch className="h-4 w-4" />} className="justify-center">
            Verify Ticket
          </Button>
          <Button to="/staff/schedules" variant="outline" leftIcon={<FiList className="h-4 w-4" />} className="justify-center">
            View Schedules
          </Button>
        </div>
      </Card>

      <Card title="Today's Departures" subtitle="All trips scheduled to depart today" className="mt-6" noPadding>
        <DataTable columns={DEPARTURE_COLUMNS} data={schedules?.items ?? []} loading={schedulesLoading} keyField="_id" emptyMessage="No departures scheduled for today." />
      </Card>
    </div>
  );
};

export default StaffDashboard;

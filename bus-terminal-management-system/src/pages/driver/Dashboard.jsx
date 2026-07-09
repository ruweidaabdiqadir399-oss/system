import { FiCalendar, FiStar, FiTruck, FiNavigation, FiArrowRight } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { getSchedulesByDriver } from '../../services/scheduleService';
import { getMyBus } from '../../services/driverService';
import { getMyRatingSummary } from '../../services/ratingService';
import { formatTime, formatNumber } from '../../utils/formatters';

const StarDisplay = ({ avg }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className="text-xl"
        style={{ color: star <= Math.round(avg) ? '#F59E0B' : '#D1D5DB' }}
        aria-hidden="true"
      >
        ★
      </span>
    ))}
  </div>
);

const today = new Date().toISOString().slice(0, 10);

const TRIP_COLUMNS = [
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
  {
    key: 'bookedSeats',
    header: 'Passengers',
    render: (row) => `${row.bookedSeats}/${row.totalSeats}`,
  },
  { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
];

const DriverDashboard = () => {
  const { user } = useAuth();
  const { data: todaysTrips, loading } = useFetch(
    () => getSchedulesByDriver(user.id, { date: today }),
    [user.id]
  );

  const { data: assignedBus, loading: busLoading } = useFetch(
    () => getMyBus(),
    []
  );

  const { data: ratingSummary, loading: ratingLoading } = useFetch(
    () => getMyRatingSummary(),
    []
  );

  const nextTrip = (todaysTrips ?? []).find((trip) => trip.status === 'Scheduled' || trip.status === 'Boarding');

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${user?.name?.split(' ')[0] ?? 'Driver'}`}
        subtitle="Here's your schedule and vehicle status for today."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiCalendar} label="Today's Trips" value={loading ? '...' : formatNumber(todaysTrips?.length ?? 0)} color="primary" />
        <StatCard icon={FiNavigation} label="Total Trips" value={formatNumber(user?.totalTrips ?? 0)} color="secondary" />
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-ink-muted">Driver Rating</p>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-warning-50 text-warning-600">
              <FiStar className="h-5 w-5" />
            </div>
          </div>
          {ratingLoading ? (
            <div className="mt-2 space-y-1.5">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-6 w-20 rounded" />
              <div className="skeleton h-3 w-16 rounded" />
            </div>
          ) : ratingSummary && ratingSummary.totalReviews > 0 ? (
            <div className="mt-1">
              <StarDisplay avg={ratingSummary.avgRating} />
              <p className="mt-1 text-2xl font-display font-bold text-ink">{ratingSummary.avgRating.toFixed(1)} / 5</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {ratingSummary.totalReviews} {ratingSummary.totalReviews === 1 ? 'Review' : 'Reviews'}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm font-medium text-ink-muted">No Ratings Yet</p>
          )}
        </div>
        <div className="card p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-ink-muted">Assigned Bus</p>
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-info-50 text-info-600">
              <FiTruck className="h-5 w-5" />
            </div>
          </div>
          {busLoading ? (
            <div className="mt-2 space-y-1.5">
              <div className="skeleton h-5 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ) : assignedBus ? (
            <div className="mt-1">
              <p className="text-2xl font-display font-bold text-ink">{assignedBus.busNumber}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{assignedBus.model} · {assignedBus.capacity} seats</p>
              <div className="mt-1"><Badge status={assignedBus.status} /></div>
            </div>
          ) : (
            <p className="mt-1 text-2xl font-display font-bold text-ink">No Bus Assigned</p>
          )}
        </div>
      </div>

      <Card title="Next Trip" subtitle="Your next scheduled departure today" className="mt-6">
        {!loading && nextTrip ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-bold text-ink">{nextTrip.route?.name}</p>
              <p className="text-sm text-ink-muted">{nextTrip.route?.origin} → {nextTrip.route?.destination}</p>
              <p className="mt-2 text-sm text-ink-variant">
                Departs {formatTime(nextTrip.departureTime)} from Gate {nextTrip.gate} &middot; {nextTrip.bookedSeats}/{nextTrip.totalSeats} passengers
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge status={nextTrip.status} />
              <Button to="/driver/trip" rightIcon={<FiArrowRight className="h-4 w-4" />}>
                Open Trip Console
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState
            icon={FiCalendar}
            title="No upcoming trips"
            description="You have no trips scheduled for the rest of today."
          />
        )}
      </Card>

      <Card title="Today's Trips" subtitle="All trips assigned to you today" className="mt-6" noPadding>
        <DataTable columns={TRIP_COLUMNS} data={todaysTrips ?? []} loading={loading} keyField="_id" emptyMessage="No trips scheduled for today." />
      </Card>
    </div>
  );
};

export default DriverDashboard;

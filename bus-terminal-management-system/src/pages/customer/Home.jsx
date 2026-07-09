import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiArrowRight, FiMapPin, FiClock, FiCalendar } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { getRoutes } from '../../services/routeService';
import { getBookingsByCustomer } from '../../services/bookingService';
import { formatCurrency, formatDuration, formatDate, formatTime } from '../../utils/formatters';

const today = new Date().toISOString().slice(0, 10);

const CustomerHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: routeData, loading: routesLoading } = useFetch(() => getRoutes({ pageSize: 100 }), []);
  const { data: bookingData } = useFetch(
    () => getBookingsByCustomer(user.id, { status: 'Confirmed', pageSize: 10 }),
    [user.id]
  );

  const routes = (routeData?.items ?? []).filter((r) => r.status === 'Active');

  const origins = useMemo(() => [...new Set(routes.map((r) => r.origin))].sort(), [routes]);
  const destinations = useMemo(() => [...new Set(routes.map((r) => r.destination))].sort(), [routes]);

  const { register, handleSubmit } = useForm({ defaultValues: { origin: '', destination: '', date: today } });

  const goToSearch = (values) => {
    const params = new URLSearchParams();
    if (values.origin) params.set('origin', values.origin);
    if (values.destination) params.set('destination', values.destination);
    if (values.date) params.set('date', values.date);
    navigate(`/customer/search?${params.toString()}`);
  };

  const handleQuickSearch = (route) => {
    const params = new URLSearchParams({ origin: route.origin, destination: route.destination, date: today });
    navigate(`/customer/search?${params.toString()}`);
  };

  const upcomingTrip = (bookingData?.items ?? []).find(
    (b) => b.schedule && b.schedule.date >= today && b.schedule.status !== 'Completed' && b.schedule.status !== 'Cancelled'
  );

  return (
    <div>
      <PageHeader title={`Hi, ${user?.name?.split(' ')[0] ?? 'Traveler'}`} subtitle="Where would you like to go today?" />

      <Card title="Find Your Trip" subtitle="Search routes across our network and book in minutes.">
        <form onSubmit={handleSubmit(goToSearch)} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Select label="From" placeholder={routesLoading ? 'Loading...' : 'Any origin'} options={origins} {...register('origin')} />
          <Select label="To" placeholder={routesLoading ? 'Loading...' : 'Any destination'} options={destinations} {...register('destination')} />
          <Input label="Travel Date" type="date" {...register('date')} />
          <div className="flex items-end">
            <Button type="submit" leftIcon={<FiSearch className="h-4 w-4" />} className="w-full justify-center">
              Search Trips
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Your Upcoming Trip" subtitle="Your next confirmed departure" className="mt-6">
        {upcomingTrip ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-lg font-bold text-ink">{upcomingTrip.route?.name}</p>
              <p className="text-sm text-ink-muted">{upcomingTrip.route?.origin} → {upcomingTrip.route?.destination}</p>
              <p className="mt-2 text-sm text-ink-variant">
                {formatDate(upcomingTrip.schedule?.date)} &middot; {formatTime(upcomingTrip.schedule?.departureTime)} &middot; Seats {upcomingTrip.seatNumbers.join(', ')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge status={upcomingTrip.status} />
              <Button to="/customer/bookings" rightIcon={<FiArrowRight className="h-4 w-4" />}>
                View Bookings
              </Button>
            </div>
          </div>
        ) : (
          <EmptyState icon={FiCalendar} title="No upcoming trips" description="Search for a route above to book your next journey." />
        )}
      </Card>

      <Card title="Popular Routes" subtitle="Frequently traveled routes across our network" className="mt-6" noPadding>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {routes.slice(0, 6).map((route) => (
            <div
              key={route.id}
              className="flex flex-col justify-between rounded-lg border border-slate-100 p-4 transition hover:border-primary-200 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between">
                  <Badge variant="primary">{route.code}</Badge>
                  <span className="flex items-center gap-1 text-xs text-ink-muted">
                    <FiClock className="h-3.5 w-3.5" /> {formatDuration(route.durationMinutes)}
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <FiMapPin className="h-3.5 w-3.5 text-ink-muted" /> {route.origin}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink">
                  <FiArrowRight className="h-3.5 w-3.5 text-ink-muted" /> {route.destination}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-display text-lg font-bold text-ink">{formatCurrency(route.fare)}</span>
                <Button size="sm" variant="outline" onClick={() => handleQuickSearch(route)}>
                  View Trips
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default CustomerHome;

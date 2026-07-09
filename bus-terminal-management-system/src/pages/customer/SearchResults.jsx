import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiSearch, FiArrowRight, FiClock, FiMapPin, FiUsers } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { useFetch } from '../../hooks/useFetch';
import { getRoutes } from '../../services/routeService';
import { searchTrips } from '../../services/scheduleService';
import { formatCurrency, formatDuration, formatDate, formatTime } from '../../utils/formatters';

const CustomerSearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const origin = searchParams.get('origin') ?? '';
  const destination = searchParams.get('destination') ?? '';
  const date = searchParams.get('date') ?? '';

  const { data: routeData } = useFetch(() => getRoutes({ pageSize: 100 }), []);
  const routes = (routeData?.items ?? []).filter((r) => r.status === 'Active');
  const origins = useMemo(() => [...new Set(routes.map((r) => r.origin))].sort(), [routes]);
  const destinations = useMemo(() => [...new Set(routes.map((r) => r.destination))].sort(), [routes]);

  const { register, handleSubmit, reset } = useForm({ defaultValues: { origin, destination, date } });

  useEffect(() => {
    reset({ origin, destination, date });
  }, [origin, destination, date, reset]);

  const { data, loading, error } = useFetch(() => searchTrips({ date, pageSize: 100 }), [date]);

  const results = (data?.items ?? []).filter((trip) => {
    if (origin && trip.route?.origin !== origin) return false;
    if (destination && trip.route?.destination !== destination) return false;
    return true;
  });

  const onSubmit = (values) => {
    const params = new URLSearchParams();
    if (values.origin) params.set('origin', values.origin);
    if (values.destination) params.set('destination', values.destination);
    if (values.date) params.set('date', values.date);
    setSearchParams(params);
  };

  return (
    <div>
      <PageHeader
        title="Available Trips"
        subtitle={origin && destination ? `${origin} → ${destination}` : 'Browse all upcoming departures'}
      />

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Select label="From" placeholder="Any origin" options={origins} {...register('origin')} />
          <Select label="To" placeholder="Any destination" options={destinations} {...register('destination')} />
          <Input label="Travel Date" type="date" {...register('date')} />
          <div className="flex items-end">
            <Button type="submit" leftIcon={<FiSearch className="h-4 w-4" />} className="w-full justify-center">
              Update Search
            </Button>
          </div>
        </form>
      </Card>

      <div className="mt-6 space-y-4">
        {loading &&
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <div className="skeleton h-24 w-full" />
            </Card>
          ))}

        {!loading && error && (
          <Card>
            <ErrorState title="Unable to load trips" message={error} />
          </Card>
        )}

        {!loading && !error && results.length === 0 && (
          <Card>
            <EmptyState icon={FiSearch} title="No trips found" description="Try adjusting your search filters." />
          </Card>
        )}

        {!loading &&
          !error &&
          results.map((trip) => (
            <Card key={trip.id}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="primary">{trip.route?.code}</Badge>
                    <p className="font-display text-lg font-bold text-ink">{trip.route?.name}</p>
                  </div>
                  <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
                    <FiMapPin className="h-3.5 w-3.5" /> {trip.route?.origin}
                    <FiArrowRight className="h-3.5 w-3.5" /> {trip.route?.destination}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-ink-variant">
                    <span className="flex items-center gap-1.5">
                      <FiClock className="h-3.5 w-3.5" /> {formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)} (
                      {formatDuration(trip.route?.durationMinutes)})
                    </span>
                    <span>{formatDate(trip.date)}</span>
                    <span>Gate {trip.gate}</span>
                    <span className="flex items-center gap-1.5">
                      <FiUsers className="h-3.5 w-3.5" /> {trip.availableSeats} seats left
                    </span>
                    <Badge status={trip.status} />
                  </div>
                </div>
                <div className="flex flex-col items-start gap-2 sm:items-end">
                  <span className="font-display text-xl font-bold text-ink">{formatCurrency(trip.route?.fare)}</span>
                  <Button
                    disabled={trip.availableSeats <= 0}
                    rightIcon={<FiArrowRight className="h-4 w-4" />}
                    onClick={() => navigate(`/customer/book/${trip.id}/seats`)}
                  >
                    {trip.availableSeats <= 0 ? 'Sold Out' : 'Select Seats'}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
};

export default CustomerSearchResults;

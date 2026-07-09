import { useState } from 'react';
import { FiMapPin, FiNavigation, FiUsers, FiClock, FiAlertTriangle, FiCheckCircle, FiArrowRight, FiDroplet } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import EmptyState from '../../components/common/EmptyState';
import TripSimulationMap from '../../components/driver/TripSimulationMap';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getSchedulesByDriver, updateScheduleStatus, startTrip, completeTrip } from '../../services/scheduleService';
import { getTrackingByBus } from '../../services/trackingService';
import { getTickets } from '../../services/ticketService';
import { formatDate, formatTime } from '../../utils/formatters';

const STATUS_FLOW = ['Scheduled', 'Boarding', 'On Trip', 'Departed', 'In Transit', 'Arrived', 'Completed'];

const NEXT_ACTION_LABEL = {
  Scheduled: 'Start Boarding',
  Boarding: 'Depart',
  Departed: 'Mark In Transit',
  'In Transit': 'Mark Arrived',
  Arrived: 'Complete Trip',
};

const MANIFEST_COLUMNS = [
  { key: 'seatNumber', header: 'Seat', render: (row) => <span className="font-medium text-ink">{row.seatNumber}</span> },
  { key: 'passengerName', header: 'Passenger' },
  { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
];

const DriverTripConsole = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [finishedTrip, setFinishedTrip] = useState(null);

  const { data: schedules, loading: schedulesLoading, refetch } = useFetch(
    () => getSchedulesByDriver(user.id),
    [user.id]
  );

  const trip = finishedTrip ?? (schedules ?? []).find((s) => s.status !== 'Completed' && s.status !== 'Cancelled');

  const { data: tracking, error: trackingError } = useFetch(
    () => getTrackingByBus(user.assignedBusId),
    [user.assignedBusId],
    { skip: !user.assignedBusId }
  );

  const { data: ticketData, loading: ticketsLoading, refetch: refetchTickets } = useFetch(
    () => getTickets({ pageSize: 100 }),
    [],
    { skip: !trip }
  );

  const manifest = (ticketData?.items ?? []).filter((t) => t.scheduleId === trip?.id);

  const handleStatusUpdate = async (status) => {
    if (!trip) return;
    setIsUpdating(true);
    try {
      if (status === 'On Trip') {
        // Use startTrip so actualStartTime is recorded — customers use it for position sync
        await startTrip(trip._id ?? trip.id);
      } else {
        await updateScheduleStatus(trip.id, status);
      }
      toast.success(`Trip ${trip.id} marked as ${status}.`);
      refetch();
      refetchTickets();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update trip status.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCompleteTrip = async () => {
    if (!trip) return;
    setIsUpdating(true);
    try {
      const updated = await completeTrip(trip._id ?? trip.id);
      setFinishedTrip(updated);
      toast.success(`Trip ${trip.id} completed successfully.`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to complete trip.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (schedulesLoading) {
    return (
      <div>
        <PageHeader title="Trip Console" subtitle="Manage your active trip in real time." />
        <Card>
          <div className="space-y-4">
            <div className="skeleton h-6 w-1/3" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-24 w-full" />
          </div>
        </Card>
      </div>
    );
  }

  if (!trip) {
    return (
      <div>
        <PageHeader title="Trip Console" subtitle="Manage your active trip in real time." />
        <Card>
          <EmptyState icon={FiNavigation} title="No active trips" description="You don't have any trips in progress right now." />
        </Card>
      </div>
    );
  }

  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(trip.status) + 1];
  const canAdvance = trip.status !== 'Delayed' && trip.status !== 'On Trip' && Boolean(nextStatus);
  const canDelay = trip.status !== 'Delayed' && trip.status !== 'On Trip' && trip.status !== 'Completed' && trip.status !== 'Arrived';

  return (
    <div>
      <PageHeader title="Trip Console" subtitle="Manage your active trip in real time." />

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-xl font-bold text-ink">{trip.route?.name}</p>
            <p className="text-sm text-ink-muted">{trip.route?.origin} → {trip.route?.destination}</p>
            <p className="mt-2 text-sm text-ink-variant">
              {formatDate(trip.date)} &middot; {formatTime(trip.departureTime)} - {formatTime(trip.arrivalTime)} &middot; Gate {trip.gate}
            </p>
          </div>
          <Badge status={trip.status} />
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
              <FiUsers className="h-3.5 w-3.5" /> Passengers
            </p>
            <p className="mt-1 text-lg font-display font-bold text-ink">{trip.bookedSeats}/{trip.totalSeats}</p>
          </div>
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
              <FiNavigation className="h-3.5 w-3.5" /> Bus
            </p>
            <p className="mt-1 text-lg font-display font-bold text-ink">{trip.bus?.busNumber ?? '-'}</p>
          </div>
          <div className="rounded-lg border border-slate-100 p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
              <FiClock className="h-3.5 w-3.5" /> Trip ID
            </p>
            <p className="mt-1 text-lg font-display font-bold text-ink">{trip.id}</p>
          </div>
          {trip.actualStartTime && (
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                <FiClock className="h-3.5 w-3.5" /> Actual Start
              </p>
              <p className="mt-1 text-lg font-display font-bold text-ink">
                {new Date(trip.actualStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
          {trip.actualFinishTime && (
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                <FiClock className="h-3.5 w-3.5" /> Actual Finish
              </p>
              <p className="mt-1 text-lg font-display font-bold text-ink">
                {new Date(trip.actualFinishTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          {canAdvance && (
            <Button leftIcon={<FiArrowRight className="h-4 w-4" />} isLoading={isUpdating} onClick={() => handleStatusUpdate(nextStatus)}>
              {NEXT_ACTION_LABEL[trip.status]}
            </Button>
          )}
          {canDelay && (
            <Button
              variant="outline"
              leftIcon={<FiAlertTriangle className="h-4 w-4" />}
              isLoading={isUpdating}
              onClick={() => handleStatusUpdate('Delayed')}
            >
              Report Delay
            </Button>
          )}
          {trip.status === 'Delayed' && (
            <Button leftIcon={<FiCheckCircle className="h-4 w-4" />} isLoading={isUpdating} onClick={() => handleStatusUpdate('In Transit')}>
              Resume Trip
            </Button>
          )}
          {trip.status === 'On Trip' && (
            <Button leftIcon={<FiCheckCircle className="h-4 w-4" />} isLoading={isUpdating} onClick={handleCompleteTrip}>
              Complete Trip
            </Button>
          )}
          {trip.status === 'Completed' && (
            <p className="text-sm font-medium text-success-600">This trip has been completed.</p>
          )}
        </div>
      </Card>

      {trip.status === 'On Trip' && (
        <TripSimulationMap trip={trip} busId={user.assignedBusId} />
      )}

      {!trackingError && tracking && (
        <Card title="Live Vehicle Status" subtitle="Real-time telemetry for your assigned bus" className="mt-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                <FiMapPin className="h-3.5 w-3.5" /> Current Location
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{tracking.currentLocation}</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                <FiNavigation className="h-3.5 w-3.5" /> Next Stop
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{tracking.nextStop}</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                <FiClock className="h-3.5 w-3.5" /> ETA
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{tracking.etaMinutes} min</p>
            </div>
            <div className="rounded-lg border border-slate-100 p-4">
              <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                <FiDroplet className="h-3.5 w-3.5" /> Fuel Level
              </p>
              <p className="mt-1 text-sm font-semibold text-ink">{tracking.fuelLevel}%</p>
            </div>
          </div>
        </Card>
      )}

      <Card title="Passenger Manifest" subtitle="Tickets issued for this trip" className="mt-6" noPadding>
        <DataTable columns={MANIFEST_COLUMNS} data={manifest} loading={ticketsLoading} keyField="_id" emptyMessage="No passengers booked for this trip." />
      </Card>
    </div>
  );
};

export default DriverTripConsole;

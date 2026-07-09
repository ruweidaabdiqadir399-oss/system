import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getSchedulesByDriver, startTrip } from '../../services/scheduleService';
import { formatDate, formatTime } from '../../utils/formatters';

const BASE_COLUMNS = [
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
    key: 'date',
    header: 'Date & Time',
    render: (row) => (
      <div>
        <p className="text-ink">{formatDate(row.date)}</p>
        <p className="text-xs text-ink-muted">{formatTime(row.departureTime)} - {formatTime(row.arrivalTime)}</p>
      </div>
    ),
  },
  {
    key: 'route',
    header: 'Route',
    render: (row) => <span className="text-sm text-ink-variant">{row.route?.origin} → {row.route?.destination}</span>,
  },
  { key: 'bus', header: 'Bus', render: (row) => row.bus?.busNumber ?? '-' },
  { key: 'gate', header: 'Gate' },
  {
    key: 'bookedSeats',
    header: 'Seats',
    render: (row) => `${row.bookedSeats}/${row.totalSeats}`,
  },
  { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
];

const DriverSchedule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [date, setDate] = useState('');
  const [startingId, setStartingId] = useState(null);

  const { data: schedules, loading } = useFetch(() => getSchedulesByDriver(user.id, { date }), [user.id, date]);

  const handleStartTrip = async (scheduleId) => {
    setStartingId(scheduleId);
    try {
      await startTrip(scheduleId);
      toast.success('Trip started successfully.');
      navigate('/driver/trip');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to start trip.');
      setStartingId(null);
    }
  };

  const columns = [
    ...BASE_COLUMNS,
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'Boarding' ? (
          <Button
            size="sm"
            isLoading={startingId === row._id}
            onClick={() => handleStartTrip(row._id)}
          >
            Start Trip
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader title="My Schedule" subtitle="All trips assigned to you, past and upcoming." />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:max-w-[160px]" />
          {date && (
            <button type="button" onClick={() => setDate('')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Clear date
            </button>
          )}
        </div>
        <DataTable columns={columns} data={schedules ?? []} loading={loading} keyField="_id" emptyMessage="No trips found." />
      </Card>
    </div>
  );
};

export default DriverSchedule;

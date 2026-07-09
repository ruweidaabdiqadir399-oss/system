import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getSchedules, updateScheduleStatus, SCHEDULE_STATUS_FILTERS } from '../../services/scheduleService';
import { formatDate, formatTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const STATUS_OPTIONS = SCHEDULE_STATUS_FILTERS.slice(1);

const StaffSchedules = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('All Statuses');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState(null);

  const { data, loading, refetch } = useFetch(
    () => getSchedules({ search: debouncedSearch, status, date, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, date, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, date]);

  const handleStatusChange = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await updateScheduleStatus(id, newStatus);
      toast.success(`Trip marked as ${newStatus}.`);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update trip status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Trip',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row._id}</p>
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
      key: 'bus',
      header: 'Bus / Driver',
      render: (row) => (
        <div>
          <p className="text-ink">{row.bus?.busNumber ?? '-'}</p>
          <p className="text-xs text-ink-muted">{row.driverName}</p>
        </div>
      ),
    },
    {
      key: 'bookedSeats',
      header: 'Seats',
      render: (row) => (
        <span className="text-sm text-ink-variant">
          {row.bookedSeats}/{row.totalSeats} booked
        </span>
      ),
    },
    { key: 'gate', header: 'Gate' },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: 'Update Status',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <Select
          value={row.status}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          options={STATUS_OPTIONS}
          disabled={updatingId === row._id}
          className="min-w-[140px]"
        />
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Departure Board" subtitle="Track today's trips and update their live status." />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by trip ID, gate..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={SCHEDULE_STATUS_FILTERS} className="sm:max-w-[170px]" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:max-w-[160px]" />
          {date && (
            <button type="button" onClick={() => setDate('')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Clear date
            </button>
          )}
        </div>
        <DataTable columns={columns} data={data?.items ?? []} loading={loading} keyField="_id" emptyMessage="No trips found." />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>
    </div>
  );
};

export default StaffSchedules;

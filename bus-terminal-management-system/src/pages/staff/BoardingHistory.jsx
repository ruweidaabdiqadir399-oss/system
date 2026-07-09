import { useEffect, useState } from 'react';
import { FiClipboard } from 'react-icons/fi';
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
import { getBoardingHistory, DATE_FILTER_OPTIONS } from '../../services/boardingService';
import { formatDate, formatTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const DATE_FILTER_LABELS = DATE_FILTER_OPTIONS.map((o) => o.label);

const StaffBoardingHistory = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [dateFilterLabel, setDateFilterLabel] = useState('All Time');
  const [customDate, setCustomDate] = useState('');
  const [page, setPage] = useState(1);

  const selectedOption = DATE_FILTER_OPTIONS.find((o) => o.label === dateFilterLabel) ?? DATE_FILTER_OPTIONS[0];
  const isCustom = selectedOption.value === 'custom';

  const { data, loading } = useFetch(
    () =>
      getBoardingHistory({
        search: debouncedSearch,
        dateFilter: selectedOption.value,
        date: isCustom ? customDate : '',
        page,
        pageSize: DEFAULT_PAGE_SIZE,
      }),
    [debouncedSearch, selectedOption.value, isCustom ? customDate : '', page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedOption.value, customDate]);

  const columns = [
    {
      key: 'passenger',
      header: 'Passenger',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.passengerName}</p>
          <p className="text-xs text-ink-muted">Seat {row.seatNumber}</p>
        </div>
      ),
    },
    {
      key: 'ticket',
      header: 'Ticket',
      render: (row) => (
        <p className="font-mono text-sm font-medium text-ink">{row.ticketId}</p>
      ),
    },
    {
      key: 'bus',
      header: 'Bus',
      render: (row) => (
        <div>
          <p className="text-ink">{row.busNumber || '-'}</p>
          <p className="text-xs text-ink-muted">{row.routeCode}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Route',
      render: (row) => (
        <div>
          <p className="text-ink">{row.routeName || '-'}</p>
          <p className="text-xs text-ink-muted">
            {row.routeOrigin && row.routeDestination
              ? `${row.routeOrigin} → ${row.routeDestination}`
              : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'boardedAt',
      header: 'Date & Time',
      render: (row) => (
        <div>
          <p className="text-ink">{formatDate(row.boardedAt)}</p>
          <p className="text-xs text-ink-muted">{formatTime(row.boardedAt)}</p>
        </div>
      ),
    },
    {
      key: 'staff',
      header: 'Staff',
      render: (row) => <p className="text-sm text-ink-variant">{row.staffName || '-'}</p>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Boarding History"
        subtitle="A log of all confirmed boardings by passengers."
      />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:flex-wrap">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search ticket, passenger, bus..."
            className="sm:max-w-xs"
          />
          <Select
            value={dateFilterLabel}
            onChange={(e) => {
              setDateFilterLabel(e.target.value);
              setCustomDate('');
            }}
            options={DATE_FILTER_LABELS}
            className="sm:max-w-[160px]"
          />
          {isCustom && (
            <Input
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="sm:max-w-[160px]"
            />
          )}
        </div>

        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiClipboard className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No boarding records found</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Records appear here after passengers are boarded via QR scan.
                </p>
              </div>
            </div>
          }
        />

        <Pagination
          page={data?.page}
          totalPages={data?.totalPages}
          total={data?.total}
          pageSize={data?.pageSize}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
};

export default StaffBoardingHistory;

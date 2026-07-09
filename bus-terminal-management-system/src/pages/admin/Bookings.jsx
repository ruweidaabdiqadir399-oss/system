import { useEffect, useState } from 'react';
import { FiMoreVertical, FiEye, FiXCircle, FiCheckCircle, FiBookOpen } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Dropdown, { DropdownItem } from '../../components/common/Dropdown';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getBookings, cancelBooking, updateBookingStatus, BOOKING_STATUS_FILTERS } from '../../services/bookingService';
import { formatCurrency, formatDate, formatDateTime, formatTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const AdminBookings = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('All Statuses');
  const [page, setPage] = useState(1);

  const [viewBooking, setViewBooking] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => getBookings({ search: debouncedSearch, status, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsUpdating(true);
    try {
      await cancelBooking(cancelTarget._id);
      toast.success(`Booking ${cancelTarget._id} has been cancelled.`);
      setCancelTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to cancel booking.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkCompleted = async (booking) => {
    setIsUpdating(true);
    try {
      await updateBookingStatus(booking._id, 'Completed');
      toast.success(`Booking ${booking._id} marked as completed.`);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update booking.');
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Booking',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row._id}</p>
          <p className="text-xs text-ink-muted">{formatDate(row.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="text-ink">{row.customerName}</p>
          <p className="text-xs text-ink-muted">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Trip',
      render: (row) => (
        <div>
          <p className="text-ink">{row.route?.code ?? '-'}</p>
          <p className="text-xs text-ink-muted">{row.schedule ? `${formatDate(row.schedule.date)} ${formatTime(row.schedule.departureTime)}` : '-'}</p>
        </div>
      ),
    },
    {
      key: 'seatNumbers',
      header: 'Seats',
      render: (row) => <span className="text-sm text-ink-variant">{row.seatNumbers.join(', ')}</span>,
    },
    { key: 'totalAmount', header: 'Amount', render: (row) => formatCurrency(row.totalAmount) },
    { key: 'paymentStatus', header: 'Payment', render: (row) => <Badge status={row.paymentStatus} /> },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <Dropdown
          trigger={
            <button type="button" className="rounded-md p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Booking actions">
              <FiMoreVertical className="h-4 w-4" />
            </button>
          }
        >
          {({ close }) => (
            <>
              <DropdownItem
                icon={<FiEye className="h-4 w-4" />}
                onClick={() => {
                  setViewBooking(row);
                  close();
                }}
              >
                View Details
              </DropdownItem>
              {row.status === 'Confirmed' && (
                <DropdownItem
                  icon={<FiCheckCircle className="h-4 w-4" />}
                  onClick={() => {
                    handleMarkCompleted(row);
                    close();
                  }}
                >
                  Mark as Completed
                </DropdownItem>
              )}
              {(row.status === 'Confirmed' || row.status === 'Pending') && (
                <DropdownItem
                  icon={<FiXCircle className="h-4 w-4" />}
                  danger
                  onClick={() => {
                    setCancelTarget(row);
                    close();
                  }}
                >
                  Cancel Booking
                </DropdownItem>
              )}
            </>
          )}
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Booking Management" subtitle="View and manage all customer bookings." />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by booking ID, customer..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={BOOKING_STATUS_FILTERS} className="sm:max-w-[170px]" />
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiBookOpen className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No bookings available</p>
                <p className="mt-1 text-sm text-ink-muted">Bookings will appear here once customers make reservations.</p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <Modal isOpen={Boolean(viewBooking)} onClose={() => setViewBooking(null)} title={`Booking ${viewBooking?._id}`} size="lg">
        {viewBooking && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Customer</p>
                <p className="mt-1 text-sm font-medium text-ink">{viewBooking.customerName}</p>
                <p className="text-sm text-ink-muted">{viewBooking.customerEmail}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Booked On</p>
                <p className="mt-1 text-sm text-ink">{formatDateTime(viewBooking.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Trip</p>
                <p className="mt-1 text-sm font-medium text-ink">{viewBooking.route?.name}</p>
                <p className="text-sm text-ink-muted">{viewBooking.route?.origin} → {viewBooking.route?.destination}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Departure</p>
                <p className="mt-1 text-sm text-ink">
                  {viewBooking.schedule ? `${formatDate(viewBooking.schedule.date)} at ${formatTime(viewBooking.schedule.departureTime)}` : '-'}
                </p>
                <p className="text-sm text-ink-muted">Gate {viewBooking.schedule?.gate ?? '-'}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Passengers & Seats</p>
              <div className="table-shell">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Passenger</th>
                      <th>Age</th>
                      <th>Gender</th>
                      <th>Seat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewBooking.passengers.map((passenger) => (
                      <tr key={passenger.seatNumber}>
                        <td>{passenger.name}</td>
                        <td>{passenger.age}</td>
                        <td>{passenger.gender}</td>
                        <td className="font-medium text-ink">{passenger.seatNumber}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Total Amount</p>
                <p className="text-lg font-display font-bold text-ink">{formatCurrency(viewBooking.totalAmount)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge status={viewBooking.paymentStatus} />
                <Badge status={viewBooking.status} />
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel booking"
        message={`Are you sure you want to cancel booking ${cancelTarget?._id}? Seats will be released and the payment will be refunded.`}
        confirmLabel="Cancel Booking"
        isLoading={isUpdating}
      />
    </div>
  );
};

export default AdminBookings;

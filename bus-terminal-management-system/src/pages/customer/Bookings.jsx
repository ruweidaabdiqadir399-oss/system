import { useEffect, useState } from 'react';
import { FiEye, FiXCircle, FiPlus, FiMoreVertical, FiBookOpen, FiStar } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Select from '../../components/common/Select';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Dropdown, { DropdownItem } from '../../components/common/Dropdown';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { getBookingsByCustomer, cancelBooking, BOOKING_STATUS_FILTERS } from '../../services/bookingService';
import { getScheduleById } from '../../services/scheduleService';
import { submitDriverRating, checkBookingRating } from '../../services/ratingService';
import { formatCurrency, formatDate, formatTime, formatDateTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const CustomerBookings = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('All Statuses');
  const [page, setPage] = useState(1);
  const [viewBooking, setViewBooking] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null); // { booking, driverName }
  const [ratingStars, setRatingStars] = useState(0);
  const [ratingHover, setRatingHover] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [ratedBookings, setRatedBookings] = useState(new Set());

  const { data, loading, refetch } = useFetch(
    () => getBookingsByCustomer(user._id, { status, page, pageSize: DEFAULT_PAGE_SIZE }),
    [user._id, status, page]
  );

  useEffect(() => {
    setPage(1);
  }, [status]);

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

  const openRatingModal = async (booking) => {
    try {
      const [schedule, check] = await Promise.all([
        getScheduleById(booking.scheduleId),
        checkBookingRating(booking._id),
      ]);
      if (check.rated) {
        setRatedBookings((prev) => new Set([...prev, booking._id]));
        toast.info('You have already rated the driver for this booking.');
        return;
      }
      setRatingTarget({ booking, driverName: schedule.driverName ?? 'Driver' });
      setRatingStars(0);
      setRatingHover(0);
      setRatingComment('');
    } catch {
      toast.error('Could not load driver information. Please try again.');
    }
  };

  const handleSubmitRating = async () => {
    if (!ratingTarget || ratingStars < 1) {
      toast.error('Please select a star rating before submitting.');
      return;
    }
    setIsSubmittingRating(true);
    try {
      await submitDriverRating({ bookingId: ratingTarget.booking._id, rating: ratingStars, comment: ratingComment });
      toast.success('Thank you! Your rating has been submitted.');
      setRatedBookings((prev) => new Set([...prev, ratingTarget.booking._id]));
      setRatingTarget(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit rating. Please try again.');
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const isRatable = (row) =>
    row.status === 'Completed' &&
    row.paymentStatus === 'Paid' &&
    !ratedBookings.has(row._id);

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
      key: 'route',
      header: 'Trip',
      render: (row) => (
        <div>
          <p className="text-ink">{row.route?.name ?? '-'}</p>
          <p className="text-xs text-ink-muted">{row.route?.origin} → {row.route?.destination}</p>
        </div>
      ),
    },
    {
      key: 'schedule',
      header: 'Departure',
      render: (row) => (
        <div>
          <p className="text-ink">{row.schedule ? formatDate(row.schedule.date) : '-'}</p>
          <p className="text-xs text-ink-muted">{row.schedule ? formatTime(row.schedule.departureTime) : ''}</p>
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
              {isRatable(row) && (
                <DropdownItem
                  icon={<FiStar className="h-4 w-4" />}
                  onClick={() => {
                    openRatingModal(row);
                    close();
                  }}
                >
                  Rate Driver
                </DropdownItem>
              )}
              {row.status === 'Confirmed' && (
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
      <PageHeader
        title="My Bookings"
        subtitle="View and manage your trip reservations."
        actions={
          <Button to="/customer/home" leftIcon={<FiPlus className="h-4 w-4" />}>
            Book a New Trip
          </Button>
        }
      />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
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
                <p className="font-medium text-ink">No bookings yet</p>
                <p className="mt-1 text-sm text-ink-muted">Book a trip to get started.</p>
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
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Booked On</p>
                <p className="mt-1 text-sm text-ink">{formatDateTime(viewBooking.createdAt)}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Payment Method</p>
                <p className="mt-1 text-sm text-ink">{viewBooking.paymentMethod}</p>
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
        message={`Are you sure you want to cancel booking ${cancelTarget?._id}? Seats will be released and your payment will be refunded.`}
        confirmLabel="Cancel Booking"
        isLoading={isUpdating}
      />

      <Modal
        isOpen={Boolean(ratingTarget)}
        onClose={() => setRatingTarget(null)}
        title="Rate Driver"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRatingTarget(null)} disabled={isSubmittingRating}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRating} isLoading={isSubmittingRating} disabled={ratingStars < 1}>
              Submit
            </Button>
          </>
        }
      >
        {ratingTarget && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Driver</p>
                <p className="mt-1 text-sm font-medium text-ink">{ratingTarget.driverName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Trip</p>
                <p className="mt-1 text-sm font-medium text-ink">{ratingTarget.booking.scheduleId}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Rating</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                    className="text-2xl transition-colors focus:outline-none"
                    style={{ color: star <= (ratingHover || ratingStars) ? '#F59E0B' : '#D1D5DB' }}
                    onClick={() => setRatingStars(star)}
                    onMouseEnter={() => setRatingHover(star)}
                    onMouseLeave={() => setRatingHover(0)}
                  >
                    ★
                  </button>
                ))}
              </div>
              {ratingStars > 0 && (
                <p className="mt-1 text-xs text-ink-muted">
                  {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratingStars]}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="rating-comment" className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
                Comment (Optional)
              </label>
              <textarea
                id="rating-comment"
                rows={3}
                maxLength={500}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Share your experience..."
                className="input w-full resize-none"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerBookings;

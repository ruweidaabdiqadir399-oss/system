import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiMoreVertical, FiEye, FiXCircle, FiPlus, FiBookOpen } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Dropdown, { DropdownItem } from '../../components/common/Dropdown';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getBookings, cancelBooking, createBooking, getSeatMap, BOOKING_STATUS_FILTERS } from '../../services/bookingService';
import { createPayment } from '../../services/paymentService';
import { getSchedules } from '../../services/scheduleService';
import { getUsers } from '../../services/userService';
import { formatCurrency, formatDate, formatDateTime, formatTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const PAYMENT_METHOD_OPTIONS = ['EVC Plus', 'Sahal', 'Zaad', 'eDahab', 'Bank Card'];

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

const NewBookingModal = ({ isOpen, onClose, onCreated }) => {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [passengerFields, setPassengerFields] = useState([]);

  const { data: scheduleData, loading: schedulesLoading } = useFetch(
    () => getSchedules({ pageSize: 100 }),
    [],
    { skip: !isOpen }
  );
  const { data: customerData, loading: customersLoading } = useFetch(
    () => getUsers({ role: 'customer', pageSize: 100 }),
    [],
    { skip: !isOpen }
  );

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: { scheduleId: '', customerId: '', seatCount: 1, paymentMethod: 'EVC Plus' } });

  useEffect(() => {
    if (isOpen) {
      reset({ scheduleId: '', customerId: '', seatCount: 1, paymentMethod: 'EVC Plus' });
      setPassengerFields([]);
    }
  }, [isOpen, reset]);

  const scheduleId = watch('scheduleId');
  const seatCount = watch('seatCount');
  const selectedSchedule = scheduleData?.items?.find((s) => s._id === scheduleId);
  const maxSeats = Math.max(1, Math.min(selectedSchedule?.availableSeats ?? 6, 6));

  useEffect(() => {
    const count = Math.min(Number(seatCount) || 1, maxSeats);
    setPassengerFields((prev) => {
      const next = [];
      for (let i = 0; i < count; i++) {
        next.push(prev[i] ?? { name: '', age: '', gender: 'Male' });
      }
      return next;
    });
  }, [seatCount, maxSeats]);

  const updatePassenger = (idx, field, value) => {
    setPassengerFields((prev) => prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p)));
  };

  const tripOptions = (scheduleData?.items ?? [])
    .filter((s) => s.status !== 'Completed' && s.status !== 'Cancelled' && s.availableSeats > 0)
    .map((s) => ({
      value: s._id,
      label: `${s.route?.code ?? s._id} · ${s.route?.name ?? ''} - ${formatDate(s.date)} ${formatTime(s.departureTime)} (${s.availableSeats} left)`,
    }));

  const customerOptions = (customerData?.items ?? []).map((c) => ({ value: c._id, label: `${c.name} (${c.email})` }));

  const onSubmit = async (values) => {
    const missingPassenger = passengerFields.some((p) => !p.name.trim() || !p.age);
    if (missingPassenger) {
      toast.error('Please fill in name and age for all passengers.');
      return;
    }
    setIsSaving(true);
    try {
      const seatMap = await getSeatMap(values.scheduleId);
      const available = seatMap.layout.flat().filter((seat) => !seatMap.bookedSeats.includes(seat));
      const count = Math.min(Number(values.seatCount), available.length);
      const seatNumbers = available.slice(0, count);
      const passengers = seatNumbers.map((seat, idx) => ({
        name: passengerFields[idx]?.name?.trim() || `Passenger ${idx + 1}`,
        age: Number(passengerFields[idx]?.age) || 30,
        gender: passengerFields[idx]?.gender || 'Other',
        seatNumber: seat,
      }));
      const booking = await createBooking({
        scheduleId: values.scheduleId,
        customerId: values.customerId,
        seatNumbers,
        passengers,
        paymentMethod: values.paymentMethod,
      });
      await createPayment({ bookingId: booking._id, amount: booking.totalAmount, method: values.paymentMethod });
      toast.success('Booking created successfully.');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to create booking.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Walk-in Booking"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving}>
            Create Booking
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Trip"
          containerClassName="sm:col-span-2"
          placeholder={schedulesLoading ? 'Loading trips...' : 'Select a trip'}
          options={tripOptions}
          error={errors.scheduleId?.message}
          {...register('scheduleId', { required: 'Please select a trip.' })}
        />
        <Select
          label="Customer"
          containerClassName="sm:col-span-2"
          placeholder={customersLoading ? 'Loading customers...' : 'Select a customer'}
          options={customerOptions}
          error={errors.customerId?.message}
          {...register('customerId', { required: 'Please select a customer.' })}
        />
        <Input
          label="Number of Seats"
          type="number"
          min={1}
          max={maxSeats}
          hint={selectedSchedule ? `${selectedSchedule.availableSeats} seats available on this trip` : 'Choose a trip first'}
          error={errors.seatCount?.message}
          {...register('seatCount', {
            required: 'Required',
            valueAsNumber: true,
            min: { value: 1, message: 'At least 1 seat is required.' },
            max: { value: maxSeats, message: `Only ${maxSeats} seat(s) available.` },
          })}
        />
        <Select label="Payment Method" options={PAYMENT_METHOD_OPTIONS} {...register('paymentMethod')} />

        {passengerFields.length > 0 && (
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-ink">Passenger Details</p>
            <div className="space-y-3">
              {passengerFields.map((p, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <Input
                    label={`Passenger ${idx + 1}`}
                    placeholder="Full name"
                    value={p.name}
                    onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                  />
                  <Input
                    label="Age"
                    type="number"
                    min={1}
                    max={120}
                    placeholder="Age"
                    value={p.age}
                    onChange={(e) => updatePassenger(idx, 'age', e.target.value)}
                  />
                  <Select
                    label="Gender"
                    options={GENDER_OPTIONS}
                    value={p.gender}
                    onChange={(e) => updatePassenger(idx, 'gender', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};

const StaffBookings = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('All Statuses');
  const [page, setPage] = useState(1);

  const [viewBooking, setViewBooking] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newBookingOpen, setNewBookingOpen] = useState(false);

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
      <PageHeader
        title="Booking Management"
        subtitle="Create walk-in bookings and manage customer reservations."
        actions={
          <Button leftIcon={<FiPlus className="h-4 w-4" />} onClick={() => setNewBookingOpen(true)}>
            New Booking
          </Button>
        }
      />

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
                <p className="mt-1 text-sm text-ink-muted">
                  Click &lsquo;New Booking&rsquo; to create your first booking.
                </p>
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

      <NewBookingModal isOpen={newBookingOpen} onClose={() => setNewBookingOpen(false)} onCreated={refetch} />

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

export default StaffBookings;

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiEye, FiDollarSign, FiCheckCircle, FiClock, FiPlus, FiXCircle } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import {
  getPayments,
  getPaymentSummary,
  createPayment,
  PAYMENT_STATUS_FILTERS,
  PAYMENT_METHOD_FILTERS,
} from '../../services/paymentService';
import { getBookings } from '../../services/bookingService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const PAYMENT_METHOD_OPTIONS = ['EVC Plus', 'Sahal', 'Zaad', 'eDahab', 'Bank Card'];

const RecordPaymentModal = ({ isOpen, onClose, onRecorded }) => {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const { data: bookingData, loading: bookingsLoading } = useFetch(
    () => getBookings({ pageSize: 100 }),
    [],
    { skip: !isOpen }
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { bookingId: '', method: 'EVC Plus' } });

  useEffect(() => {
    if (isOpen) reset({ bookingId: '', method: 'EVC Plus' });
  }, [isOpen, reset]);

  const pendingBookings = (bookingData?.items ?? []).filter((b) => b.paymentStatus === 'Pending');

  const bookingOptions = pendingBookings.map((b) => ({
    value: b._id,
    label: `${b._id} · ${b.customerName} - ${formatCurrency(b.totalAmount)}`,
  }));

  const onSubmit = async (values) => {
    const booking = pendingBookings.find((b) => b._id === values.bookingId);
    if (!booking) return;
    setIsSaving(true);
    try {
      await createPayment({
        bookingId: booking._id,
        customerId: booking.customerId,
        amount: booking.totalAmount,
        method: values.method,
      });
      toast.success('Payment recorded successfully.');
      onRecorded();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to record payment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Payment"
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving} disabled={!pendingBookings.length}>
            Record Payment
          </Button>
        </>
      }
    >
      <form className="space-y-4">
        {!bookingsLoading && !pendingBookings.length ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-ink-muted">There are no bookings with a pending payment right now.</p>
        ) : (
          <Select
            label="Pending Booking"
            placeholder={bookingsLoading ? 'Loading bookings...' : 'Select a booking'}
            options={bookingOptions}
            error={errors.bookingId?.message}
            {...register('bookingId', { required: 'Please select a booking.' })}
          />
        )}
        <Select label="Payment Method" options={PAYMENT_METHOD_OPTIONS} {...register('method')} />
      </form>
    </Modal>
  );
};

const StaffPayments = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('All Statuses');
  const [method, setMethod] = useState('All Methods');
  const [page, setPage] = useState(1);
  const [viewPayment, setViewPayment] = useState(null);
  const [recordOpen, setRecordOpen] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => getPayments({ search: debouncedSearch, status, method, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, method, page]
  );
  const { data: summary, refetch: refetchSummary } = useFetch(() => getPaymentSummary(), []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, method]);

  const handleRecorded = () => {
    refetch();
    refetchSummary();
  };

  const columns = [
    {
      key: 'id',
      header: 'Payment',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row._id}</p>
          <p className="text-xs text-ink-muted">{row.bookingId}</p>
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
    { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
    { key: 'method', header: 'Method' },
    { key: 'transactionRef', header: 'Reference', render: (row) => <span className="font-mono text-xs text-ink-muted">{row.transactionRef}</span> },
    { key: 'date', header: 'Date', render: (row) => formatDateTime(row.date) },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setViewPayment(row)}
          className="rounded-md p-1.5 text-ink-muted transition hover:bg-info-50 hover:text-info-600"
          aria-label="View payment"
        >
          <FiEye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payments"
        subtitle="Record walk-in payments and review transaction history."
        actions={
          <Button leftIcon={<FiPlus className="h-4 w-4" />} onClick={() => setRecordOpen(true)}>
            Record Payment
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiDollarSign} label="Total Revenue" value={formatCurrency(summary?.completedAmount ?? 0)} color="primary" />
        <StatCard icon={FiCheckCircle} label="Paid Payments" value={summary?.Completed ?? 0} color="success" />
        <StatCard icon={FiClock} label="Pending Payments" value={summary?.Pending ?? 0} color="warning" />
        <StatCard icon={FiXCircle} label="Failed Payments" value={summary?.Failed ?? 0} color="danger" />
      </div>

      <Card className="mt-6" noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by payment, customer, reference..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={PAYMENT_STATUS_FILTERS} className="sm:max-w-[170px]" />
          <Select value={method} onChange={(e) => setMethod(e.target.value)} options={PAYMENT_METHOD_FILTERS} className="sm:max-w-[170px]" />
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiDollarSign className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No payments available</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Click &lsquo;Record Payment&rsquo; to process your first payment.
                </p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <Modal isOpen={Boolean(viewPayment)} onClose={() => setViewPayment(null)} title={`Payment ${viewPayment?._id}`} size="md">
        {viewPayment && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Customer</p>
              <p className="mt-1 text-sm font-medium text-ink">{viewPayment.customerName}</p>
              <p className="text-sm text-ink-muted">{viewPayment.customerEmail}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Booking</p>
              <p className="mt-1 text-sm text-ink">{viewPayment.bookingId}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Amount</p>
              <p className="mt-1 text-lg font-display font-bold text-ink">{formatCurrency(viewPayment.amount)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</p>
              <div className="mt-1"><Badge status={viewPayment.status} /></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Method</p>
              <p className="mt-1 text-sm text-ink">{viewPayment.method}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Date</p>
              <p className="mt-1 text-sm text-ink">{formatDateTime(viewPayment.date)}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Transaction Reference</p>
              <p className="mt-1 font-mono text-sm text-ink">{viewPayment.transactionRef}</p>
            </div>
          </div>
        )}
      </Modal>

      <RecordPaymentModal isOpen={recordOpen} onClose={() => setRecordOpen(false)} onRecorded={handleRecorded} />
    </div>
  );
};

export default StaffPayments;

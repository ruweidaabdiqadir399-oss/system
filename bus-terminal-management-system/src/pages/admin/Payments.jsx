import { useEffect, useState } from 'react';
import { FiMoreVertical, FiEye, FiRefreshCw, FiDollarSign, FiCheckCircle, FiClock, FiRotateCcw } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatCard from '../../components/common/StatCard';
import Dropdown, { DropdownItem } from '../../components/common/Dropdown';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import {
  getPayments,
  getPaymentSummary,
  refundPayment,
  PAYMENT_STATUS_FILTERS,
  PAYMENT_METHOD_FILTERS,
} from '../../services/paymentService';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const AdminPayments = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('All Statuses');
  const [method, setMethod] = useState('All Methods');
  const [page, setPage] = useState(1);

  const [viewPayment, setViewPayment] = useState(null);
  const [refundTarget, setRefundTarget] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => getPayments({ search: debouncedSearch, status, method, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, method, page]
  );
  const { data: summary, refetch: refetchSummary } = useFetch(() => getPaymentSummary(), []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, method]);

  const handleRefund = async () => {
    if (!refundTarget) return;
    setIsUpdating(true);
    try {
      await refundPayment(refundTarget._id);
      toast.success(`Payment ${refundTarget._id} has been refunded.`);
      setRefundTarget(null);
      refetch();
      refetchSummary();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to refund payment.');
    } finally {
      setIsUpdating(false);
    }
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
        <Dropdown
          trigger={
            <button type="button" className="rounded-md p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Payment actions">
              <FiMoreVertical className="h-4 w-4" />
            </button>
          }
        >
          {({ close }) => (
            <>
              <DropdownItem
                icon={<FiEye className="h-4 w-4" />}
                onClick={() => {
                  setViewPayment(row);
                  close();
                }}
              >
                View Details
              </DropdownItem>
              {row.status === 'Completed' && (
                <DropdownItem
                  icon={<FiRotateCcw className="h-4 w-4" />}
                  danger
                  onClick={() => {
                    setRefundTarget(row);
                    close();
                  }}
                >
                  Refund Payment
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
      <PageHeader title="Payments" subtitle="Track transactions, revenue, and refunds." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiDollarSign} label="Total Transactions" value={summary?.total ?? '...'} color="primary" />
        <StatCard icon={FiCheckCircle} label="Completed Revenue" value={formatCurrency(summary?.completedAmount ?? 0)} color="success" />
        <StatCard icon={FiClock} label="Pending" value={summary?.Pending ?? 0} color="warning" />
        <StatCard icon={FiRefreshCw} label="Refunded" value={summary?.Refunded ?? 0} color="info" />
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
                <p className="mt-1 text-sm text-ink-muted">Payments will appear here once transactions are processed.</p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <Modal isOpen={Boolean(viewPayment)} onClose={() => setViewPayment(null)} title={`Payment ${viewPayment?._id}`} size="md">
        {viewPayment && (
          <div className="space-y-4">
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
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        onConfirm={handleRefund}
        title="Refund payment"
        message={`Are you sure you want to refund ${formatCurrency(refundTarget?.amount ?? 0)} to ${refundTarget?.customerName}? This action cannot be undone.`}
        confirmLabel="Refund"
        isLoading={isUpdating}
      />
    </div>
  );
};

export default AdminPayments;

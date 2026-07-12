import { useEffect, useState } from 'react';
import { FiEye, FiHelpCircle, FiInbox, FiClock, FiCheckCircle } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { getSupportRequests } from '../../services/supportRequestService';
import { formatDateTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE, SUPPORT_CATEGORIES, SUPPORT_STATUS } from '../../utils/constants';

const STATUS_FILTER_OPTIONS = ['all', ...SUPPORT_STATUS].map((s) => ({ value: s, label: s === 'all' ? 'All Statuses' : s }));
const CATEGORY_FILTER_OPTIONS = ['all', ...SUPPORT_CATEGORIES].map((c) => ({ value: c, label: c === 'all' ? 'All Categories' : c }));

const STATUS_VARIANT = {
  Open: 'warning',
  'In Progress': 'info',
  Resolved: 'success',
  Closed: 'neutral',
};

// The list API doesn't support a date range filter, and it isn't part of
// the Customer Support backend contract we're not allowed to touch here.
// So we fetch a generous batch (already narrowed by search/status/category
// on the server) and apply the date filter + pagination on the client.
const FETCH_BATCH_SIZE = 200;

const AdminSupport = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [viewRequest, setViewRequest] = useState(null);

  const { data, loading } = useFetch(
    () => getSupportRequests({ search: debouncedSearch, status, category, page: 1, pageSize: FETCH_BATCH_SIZE }),
    [debouncedSearch, status, category]
  );

  const { data: stats } = useFetch(async () => {
    const [all, open, inProgress, resolved] = await Promise.all([
      getSupportRequests({ status: 'all', pageSize: 1 }),
      getSupportRequests({ status: 'Open', pageSize: 1 }),
      getSupportRequests({ status: 'In Progress', pageSize: 1 }),
      getSupportRequests({ status: 'Resolved', pageSize: 1 }),
    ]);
    return { total: all.total, open: open.total, inProgress: inProgress.total, resolved: resolved.total };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, category, from, to]);

  const filteredItems = (data?.items ?? []).filter((row) => {
    if (!from && !to) return true;
    const created = new Date(row.createdAt);
    if (from && created < new Date(from)) return false;
    if (to && created > new Date(`${to}T23:59:59.999Z`)) return false;
    return true;
  });

  const total = filteredItems.length;
  const totalPages = Math.max(Math.ceil(total / DEFAULT_PAGE_SIZE), 1);
  const pageItems = filteredItems.slice((page - 1) * DEFAULT_PAGE_SIZE, page * DEFAULT_PAGE_SIZE);

  const columns = [
    {
      key: 'customerName',
      header: 'Customer',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.customerName || '-'}</p>
          <p className="text-xs text-ink-muted">{row.customerEmail || '-'}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => (
        <div>
          <p className="text-ink">{row.subject}</p>
          <p className="text-xs text-ink-muted">{row._id}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category' },
    { key: 'createdAt', header: 'Date', render: (row) => formatDateTime(row.createdAt) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge variant={STATUS_VARIANT[row.status]}>{row.status}</Badge>,
    },
    {
      key: 'assignedStaffName',
      header: 'Assigned Staff',
      render: (row) => row.assignedStaffName || <span className="text-ink-muted">-</span>,
    },
    {
      key: 'handledByName',
      header: 'Handled By',
      render: (row) => row.handledByName || <span className="text-ink-muted">-</span>,
    },
    {
      key: 'resolvedByName',
      header: 'Resolved By',
      render: (row) => row.resolvedByName || <span className="text-ink-muted">-</span>,
    },
    {
      key: 'responseDate',
      header: 'Last Response',
      render: (row) => (row.responseDate ? formatDateTime(row.responseDate) : <span className="text-ink-muted">-</span>),
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setViewRequest(row)}
          className="rounded-md p-1.5 text-ink-muted transition hover:bg-info-50 hover:text-info-600"
          aria-label="View request"
          title="View Details"
        >
          <FiEye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Support Overview" subtitle="Monitor customer support activity handled by Customer Service." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiInbox} label="Total Requests" value={stats?.total ?? '...'} color="primary" />
        <StatCard icon={FiHelpCircle} label="Open" value={stats?.open ?? 0} color="warning" />
        <StatCard icon={FiClock} label="In Progress" value={stats?.inProgress ?? 0} color="info" />
        <StatCard icon={FiCheckCircle} label="Resolved" value={stats?.resolved ?? 0} color="success" />
      </div>

      <Card className="mt-6" noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by subject or message..." className="sm:max-w-xs" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_FILTER_OPTIONS} className="sm:max-w-[170px]" />
            <Select value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORY_FILTER_OPTIONS} className="sm:max-w-[180px]" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} containerClassName="sm:max-w-[170px]" />
            <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} containerClassName="sm:max-w-[170px]" />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={pageItems}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiHelpCircle className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No support requests found</p>
                <p className="mt-1 text-sm text-ink-muted">Customer support activity will appear here.</p>
              </div>
            </div>
          }
        />
        <Pagination page={page} totalPages={totalPages} total={total} pageSize={DEFAULT_PAGE_SIZE} onPageChange={setPage} />
      </Card>

      <Modal isOpen={Boolean(viewRequest)} onClose={() => setViewRequest(null)} title={viewRequest?.subject} size="md">
        {viewRequest && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Request ID</p>
              <p className="mt-1 text-sm font-medium text-ink">{viewRequest._id}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Category</p>
              <p className="mt-1 text-sm text-ink">{viewRequest.category}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Customer</p>
              <p className="mt-1 text-sm text-ink">{viewRequest.customerName || '-'}</p>
              <p className="text-xs text-ink-muted">{viewRequest.customerEmail || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Assigned Staff</p>
              <p className="mt-1 text-sm text-ink">{viewRequest.assignedStaffName || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Submitted</p>
              <p className="mt-1 text-sm text-ink">{formatDateTime(viewRequest.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</p>
              <div className="mt-1"><Badge variant={STATUS_VARIANT[viewRequest.status]}>{viewRequest.status}</Badge></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Handled By</p>
              <p className="mt-1 text-sm text-ink">{viewRequest.handledByName || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Resolved By</p>
              <p className="mt-1 text-sm text-ink">{viewRequest.resolvedByName || '-'}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Last Response</p>
              <p className="mt-1 text-sm text-ink">{viewRequest.responseDate ? formatDateTime(viewRequest.responseDate) : '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Message</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{viewRequest.message}</p>
            </div>
            <div className="col-span-2 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Staff Reply</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{viewRequest.reply || 'No reply yet.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminSupport;

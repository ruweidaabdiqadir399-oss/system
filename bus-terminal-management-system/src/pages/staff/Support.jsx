import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiEye, FiHelpCircle } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ErrorState from '../../components/common/ErrorState';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getSupportRequests, updateSupportRequest } from '../../services/supportRequestService';
import { formatDateTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE, SUPPORT_STATUS } from '../../utils/constants';

const STATUS_FILTER_OPTIONS = ['all', ...SUPPORT_STATUS].map((s) => ({ value: s, label: s === 'all' ? 'All Statuses' : s }));

const STATUS_VARIANT = {
  Open: 'warning',
  'In Progress': 'info',
  Resolved: 'success',
  Closed: 'neutral',
};

const SupportReviewModal = ({ request, onClose, onSaved }) => {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { status: request?.status, reply: request?.reply ?? '' },
  });

  useEffect(() => {
    if (request) reset({ status: request.status, reply: request.reply ?? '' });
  }, [request, reset]);

  const onSubmit = async (values) => {
    setIsSaving(true);
    try {
      await updateSupportRequest(request._id, values);
      toast.success('Support request updated successfully.');
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update support request.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!request) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={request.subject}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Request ID</p>
            <p className="mt-1 text-sm font-medium text-ink">{request._id}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Category</p>
            <p className="mt-1 text-sm text-ink">{request.category}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Customer</p>
            <p className="mt-1 text-sm text-ink">{request.customerName}</p>
            <p className="text-xs text-ink-muted">{request.customerEmail}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Submitted</p>
            <p className="mt-1 text-sm text-ink">{formatDateTime(request.createdAt)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Message</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{request.message}</p>
          </div>
        </div>

        <form className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <Select label="Status" options={SUPPORT_STATUS} {...register('status')} />
          <div />
          <Textarea
            label="Reply to Customer"
            rows={4}
            placeholder="Write a reply for the customer..."
            containerClassName="sm:col-span-2"
            {...register('reply')}
          />
        </form>
      </div>
    </Modal>
  );
};

const StaffSupport = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [reviewTarget, setReviewTarget] = useState(null);

  const { data, loading, error, refetch } = useFetch(
    () => getSupportRequests({ search: debouncedSearch, status, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const columns = [
    { key: 'customerName', header: 'Customer', render: (row) => (
      <div>
        <p className="font-medium text-ink">{row.customerName}</p>
        <p className="text-xs text-ink-muted">{row.customerEmail}</p>
      </div>
    ) },
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
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setReviewTarget(row)}
          className="rounded-md p-1.5 text-ink-muted transition hover:bg-info-50 hover:text-info-600"
          aria-label="View request"
          title="View & Reply"
        >
          <FiEye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Support Management" subtitle="Review, reply to, and resolve customer support requests." />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by subject or message..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_FILTER_OPTIONS} className="sm:max-w-[170px]" />
        </div>

        {error ? (
          <ErrorState
            title="Unable to load support requests"
            message={error}
            onRetry={refetch}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data?.items ?? []}
              loading={loading}
              keyField="_id"
              emptyMessage={
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                    <FiHelpCircle className="h-6 w-6 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-ink">No support requests found</p>
                    <p className="mt-1 text-sm text-ink-muted">Customer support requests will appear here.</p>
                  </div>
                </div>
              }
            />
            <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
          </>
        )}
      </Card>

      {reviewTarget && (
        <SupportReviewModal
          request={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSaved={() => {
            setReviewTarget(null);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default StaffSupport;

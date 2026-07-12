import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEye, FiHelpCircle } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getSupportRequests, createSupportRequest } from '../../services/supportRequestService';
import { formatDateTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE, SUPPORT_CATEGORIES, SUPPORT_STATUS } from '../../utils/constants';

const STATUS_FILTER_OPTIONS = ['all', ...SUPPORT_STATUS].map((s) => ({ value: s, label: s === 'all' ? 'All Statuses' : s }));

const STATUS_VARIANT = {
  Open: 'warning',
  'In Progress': 'info',
  Resolved: 'success',
  Closed: 'neutral',
};

const emptyRequest = { subject: '', category: SUPPORT_CATEGORIES[0], message: '' };

const NewRequestModal = ({ isOpen, onClose, onSubmit, isSaving }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: emptyRequest });

  useEffect(() => {
    if (isOpen) reset(emptyRequest);
  }, [isOpen, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="New Support Request"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving}>
            Submit Request
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4">
        <Input
          label="Subject"
          placeholder="e.g. Unable to complete payment"
          error={errors.subject?.message}
          {...register('subject', { required: 'Subject is required.' })}
        />
        <Select label="Category" options={SUPPORT_CATEGORIES} {...register('category', { required: true })} />
        <Textarea
          label="Message"
          rows={5}
          placeholder="Describe your issue..."
          error={errors.message?.message}
          {...register('message', { required: 'Message is required.' })}
        />
      </form>
    </Modal>
  );
};

const CustomerSupport = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [viewRequest, setViewRequest] = useState(null);

  const { data, loading, refetch } = useFetch(
    () => getSupportRequests({ search: debouncedSearch, status, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const handleCreate = async (formValues) => {
    setIsSaving(true);
    try {
      await createSupportRequest(formValues);
      toast.success('Support request submitted successfully.');
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to submit support request.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: 'subject',
      header: 'Request',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.subject}</p>
          <p className="text-xs text-ink-muted">{row._id}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category' },
    { key: 'createdAt', header: 'Submitted', render: (row) => formatDateTime(row.createdAt) },
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
      <PageHeader
        title="My Support Requests"
        subtitle="Get help from our Customer Service team."
        actions={
          <Button leftIcon={<FiPlus className="h-4 w-4" />} onClick={() => setModalOpen(true)}>
            New Request
          </Button>
        }
      />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by subject or message..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_FILTER_OPTIONS} className="sm:max-w-[170px]" />
        </div>
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
                <p className="font-medium text-ink">No support requests yet</p>
                <p className="mt-1 text-sm text-ink-muted">Click &lsquo;New Request&rsquo; if you need help from our team.</p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <NewRequestModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} isSaving={isSaving} />

      <Modal isOpen={Boolean(viewRequest)} onClose={() => setViewRequest(null)} title={viewRequest?.subject} size="md">
        {viewRequest && (
          <div className="space-y-4">
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
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</p>
                <div className="mt-1"><Badge variant={STATUS_VARIANT[viewRequest.status]}>{viewRequest.status}</Badge></div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Submitted</p>
                <p className="mt-1 text-sm text-ink">{formatDateTime(viewRequest.createdAt)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Your Message</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{viewRequest.message}</p>
              </div>
              <div className="col-span-2 rounded-lg bg-slate-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Reply from Customer Service</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{viewRequest.reply || 'No reply yet. Our team will get back to you soon.'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerSupport;

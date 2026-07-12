import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiFileText } from 'react-icons/fi';
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
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getReports, createReport, updateReport, deleteReport } from '../../services/staffReportService';
import { formatDateTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE, REPORT_TYPES, REPORT_STATUS } from '../../utils/constants';

const STATUS_FILTER_OPTIONS = ['all', ...REPORT_STATUS];

const STATUS_VARIANT = {
  Pending: 'warning',
  'In Review': 'info',
  Resolved: 'success',
  Closed: 'neutral',
};

const emptyReport = { title: '', type: REPORT_TYPES[0], description: '' };

const ReportFormModal = ({ isOpen, onClose, onSubmit, initialValues, isSaving, title }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: initialValues });

  useEffect(() => {
    if (isOpen) reset(initialValues);
  }, [isOpen, initialValues, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit(onSubmit)} isLoading={isSaving}>
            Submit Report
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4">
        <Input
          label="Report Title"
          placeholder="e.g. Delay on Route 12"
          error={errors.title?.message}
          {...register('title', { required: 'Report title is required.' })}
        />
        <Select label="Report Type" options={REPORT_TYPES} {...register('type', { required: true })} />
        <Textarea
          label="Description"
          rows={5}
          placeholder="Describe what happened..."
          error={errors.description?.message}
          {...register('description', { required: 'Description is required.' })}
        />
      </form>
    </Modal>
  );
};

const StaffReports = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewReport, setViewReport] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => getReports({ search: debouncedSearch, status, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const openCreate = () => {
    setEditingReport(null);
    setModalOpen(true);
  };

  const openEdit = (report) => {
    setEditingReport(report);
    setModalOpen(true);
  };

  const handleSave = async (formValues) => {
    setIsSaving(true);
    try {
      if (editingReport) {
        await updateReport(editingReport._id, formValues);
        toast.success('Report updated successfully.');
      } else {
        await createReport(formValues);
        toast.success('Report submitted successfully.');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save report.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteReport(deleteTarget._id);
      toast.success('Report deleted successfully.');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to delete report.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'title',
      header: 'Report',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.title}</p>
          <p className="text-xs text-ink-muted">{row._id}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type' },
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
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setViewReport(row)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-info-50 hover:text-info-600"
            aria-label="View report"
            title="View Details"
          >
            <FiEye className="h-4 w-4" />
          </button>
          {row.status === 'Pending' && (
            <>
              <button
                type="button"
                onClick={() => openEdit(row)}
                className="rounded-md p-1.5 text-ink-muted transition hover:bg-warning-50 hover:text-warning-600"
                aria-label="Edit report"
                title="Edit"
              >
                <FiEdit2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteTarget(row)}
                className="rounded-md p-1.5 text-ink-muted transition hover:bg-danger-50 hover:text-danger-600"
                aria-label="Delete report"
                title="Delete"
              >
                <FiTrash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="My Reports"
        subtitle="Submit operational reports to admin and track their status."
        actions={
          <Button leftIcon={<FiPlus className="h-4 w-4" />} onClick={openCreate}>
            New Report
          </Button>
        }
      />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by title or description..." className="sm:max-w-xs" />
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_FILTER_OPTIONS.map((s) => ({ value: s, label: s === 'all' ? 'All Statuses' : s }))}
            className="sm:max-w-[170px]"
          />
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiFileText className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No reports yet</p>
                <p className="mt-1 text-sm text-ink-muted">Click &lsquo;New Report&rsquo; to submit one to admin.</p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <ReportFormModal
        key={editingReport?._id ?? 'new'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialValues={editingReport ?? emptyReport}
        isSaving={isSaving}
        title={editingReport ? `Edit ${editingReport.title}` : 'New Report'}
      />

      <Modal isOpen={Boolean(viewReport)} onClose={() => setViewReport(null)} title={viewReport?.title} size="md">
        {viewReport && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Report ID</p>
                <p className="mt-1 text-sm font-medium text-ink">{viewReport._id}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Type</p>
                <p className="mt-1 text-sm text-ink">{viewReport.type}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</p>
                <div className="mt-1"><Badge variant={STATUS_VARIANT[viewReport.status]}>{viewReport.status}</Badge></div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Submitted</p>
                <p className="mt-1 text-sm text-ink">{formatDateTime(viewReport.createdAt)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Description</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{viewReport.description}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Admin Remarks</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{viewReport.adminRemarks || 'No remarks yet.'}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete report"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default StaffReports;

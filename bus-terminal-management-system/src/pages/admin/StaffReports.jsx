import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiEye, FiTrash2, FiFileText } from 'react-icons/fi';
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
import { getReports, updateReportStatus, deleteReport } from '../../services/staffReportService';
import { formatDateTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE, REPORT_TYPES, REPORT_STATUS, DEPARTMENTS } from '../../utils/constants';

const STATUS_FILTER_OPTIONS = ['all', ...REPORT_STATUS].map((s) => ({ value: s, label: s === 'all' ? 'All Statuses' : s }));
const DEPARTMENT_FILTER_OPTIONS = ['all', ...DEPARTMENTS].map((d) => ({ value: d, label: d === 'all' ? 'All Departments' : d }));
const TYPE_FILTER_OPTIONS = ['all', ...REPORT_TYPES].map((t) => ({ value: t, label: t === 'all' ? 'All Types' : t }));

const STATUS_VARIANT = {
  Pending: 'warning',
  'In Review': 'info',
  Resolved: 'success',
  Closed: 'neutral',
};

const ReportReviewModal = ({ report, onClose, onSaved }) => {
  const toast = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
  } = useForm({ defaultValues: { status: report?.status, adminRemarks: report?.adminRemarks ?? '' } });

  useEffect(() => {
    if (report) reset({ status: report.status, adminRemarks: report.adminRemarks ?? '' });
  }, [report, reset]);

  const onSubmit = async (values) => {
    setIsSaving(true);
    try {
      await updateReportStatus(report._id, values);
      toast.success('Report updated successfully.');
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to update report.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!report) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={report.title}
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
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Report ID</p>
            <p className="mt-1 text-sm font-medium text-ink">{report._id}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Type</p>
            <p className="mt-1 text-sm text-ink">{report.type}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Submitted By</p>
            <p className="mt-1 text-sm text-ink">{report.submittedByName}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Department</p>
            <p className="mt-1 text-sm text-ink">{report.department}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Submitted</p>
            <p className="mt-1 text-sm text-ink">{formatDateTime(report.createdAt)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Current Status</p>
            <div className="mt-1"><Badge variant={STATUS_VARIANT[report.status]}>{report.status}</Badge></div>
          </div>
          <div className="col-span-2">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{report.description}</p>
          </div>
        </div>

        <form className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <Select label="Status" options={REPORT_STATUS} {...register('status')} />
          <div />
          <Textarea
            label="Admin Remarks"
            rows={4}
            placeholder="Add feedback or remarks for the staff member..."
            containerClassName="sm:col-span-2"
            {...register('adminRemarks')}
          />
        </form>
      </div>
    </Modal>
  );
};

const AdminStaffReports = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');
  const [type, setType] = useState('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const [reviewTarget, setReviewTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => getReports({ search: debouncedSearch, status, department, type, from, to, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, department, type, from, to, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, department, type, from, to]);

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
    { key: 'submittedByName', header: 'Submitted By' },
    { key: 'department', header: 'Department' },
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
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => setReviewTarget(row)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-info-50 hover:text-info-600"
            aria-label="Review report"
            title="View & Update"
          >
            <FiEye className="h-4 w-4" />
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Reports Management" subtitle="Review, update, and respond to reports submitted by staff." />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search by title or description..." className="sm:max-w-xs" />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_FILTER_OPTIONS} className="sm:max-w-[160px]" />
            <Select value={department} onChange={(e) => setDepartment(e.target.value)} options={DEPARTMENT_FILTER_OPTIONS} className="sm:max-w-[180px]" />
            <Select value={type} onChange={(e) => setType(e.target.value)} options={TYPE_FILTER_OPTIONS} className="sm:max-w-[180px]" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input type="date" label="From" value={from} onChange={(e) => setFrom(e.target.value)} containerClassName="sm:max-w-[170px]" />
            <Input type="date" label="To" value={to} onChange={(e) => setTo(e.target.value)} containerClassName="sm:max-w-[170px]" />
          </div>
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
                <p className="font-medium text-ink">No reports found</p>
                <p className="mt-1 text-sm text-ink-muted">Reports submitted by staff will appear here.</p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      {reviewTarget && (
        <ReportReviewModal
          report={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSaved={() => {
            setReviewTarget(null);
            refetch();
          }}
        />
      )}

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

export default AdminStaffReports;

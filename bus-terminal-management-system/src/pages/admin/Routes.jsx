import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiArrowRight, FiMap } from 'react-icons/fi';
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
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import {
  getRoutes,
  getRegions,
  createRoute,
  updateRoute,
  deleteRoute,
  ROUTE_STATUS_FILTERS,
} from '../../services/routeService';
import { formatCurrency, formatDuration } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const STATUS_OPTIONS = ['Active', 'Suspended'];

const emptyRoute = {
  code: '',
  name: '',
  origin: '',
  destination: '',
  distanceMiles: 0,
  durationMinutes: 0,
  fare: 0,
  stops: '',
  status: 'Active',
  region: '',
};

const toFormValues = (route) =>
  route ? { ...route, stops: (route.stops ?? []).join(', ') } : emptyRoute;

const RouteFormModal = ({ isOpen, onClose, onSubmit, initialValues, isSaving, title }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: toFormValues(initialValues) });

  useEffect(() => {
    if (isOpen) reset(toFormValues(initialValues));
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
            Save Route
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Route Code"
          placeholder="e.g. RTE-104"
          error={errors.code?.message}
          {...register('code', { required: 'Route code is required.' })}
        />
        <Input
          label="Route Name"
          placeholder="e.g. NY - Boston Express"
          error={errors.name?.message}
          {...register('name', { required: 'Route name is required.' })}
        />
        <Input
          label="Origin"
          placeholder="e.g. New York (Port Authority)"
          error={errors.origin?.message}
          {...register('origin', { required: 'Origin is required.' })}
        />
        <Input
          label="Destination"
          placeholder="e.g. Boston (South Station)"
          error={errors.destination?.message}
          {...register('destination', { required: 'Destination is required.' })}
        />
        <Input label="Distance (miles)" type="number" min={0} {...register('distanceMiles')} />
        <Input label="Duration (minutes)" type="number" min={0} {...register('durationMinutes')} />
        <Input
          label="Fare ($)"
          type="number"
          step="0.01"
          min={0}
          error={errors.fare?.message}
          {...register('fare', { required: 'Fare is required.', min: { value: 0, message: 'Fare cannot be negative.' } })}
        />
        <Input label="Region" placeholder="e.g. Northeast" {...register('region', { required: 'Region is required.' })} error={errors.region?.message} />
        <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
        <Input
          label="Intermediate Stops"
          placeholder="Comma separated, e.g. Hartford Central, Philadelphia"
          containerClassName="sm:col-span-2"
          hint="Optional. Separate multiple stops with commas."
          {...register('stops')}
        />
      </form>
    </Modal>
  );
};

const AdminRoutes = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('All Statuses');
  const [region, setRegion] = useState('All Regions');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => getRoutes({ search: debouncedSearch, status, region, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, region, page]
  );
  const { data: regions } = useFetch(() => getRegions(), []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, region]);

  const openCreate = () => {
    setEditingRoute(null);
    setModalOpen(true);
  };

  const openEdit = (route) => {
    setEditingRoute(route);
    setModalOpen(true);
  };

  const handleSave = async (formValues) => {
    setIsSaving(true);
    const payload = {
      ...formValues,
      distanceMiles: Number(formValues.distanceMiles),
      durationMinutes: Number(formValues.durationMinutes),
      fare: Number(formValues.fare),
      stops: formValues.stops
        ? formValues.stops.split(',').map((stop) => stop.trim()).filter(Boolean)
        : [],
    };
    try {
      if (editingRoute) {
        await updateRoute(editingRoute._id, payload);
        toast.success('Route updated successfully.');
      } else {
        await createRoute(payload);
        toast.success('Route created successfully.');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save route.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRoute(deleteTarget._id);
      toast.success('Route deleted successfully.');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to delete route.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'code',
      header: 'Route',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.code}</p>
          <p className="text-xs text-ink-muted">{row.name}</p>
        </div>
      ),
    },
    {
      key: 'origin',
      header: 'Origin → Destination',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-sm text-ink-variant">
          <span className="max-w-[140px] truncate">{row.origin}</span>
          <FiArrowRight className="h-3.5 w-3.5 flex-shrink-0 text-ink-muted" />
          <span className="max-w-[140px] truncate">{row.destination}</span>
        </div>
      ),
    },
    { key: 'durationMinutes', header: 'Duration', render: (row) => formatDuration(row.durationMinutes) },
    { key: 'fare', header: 'Fare', render: (row) => formatCurrency(row.fare) },
    { key: 'assignedBuses', header: 'Buses', render: (row) => `${row.assignedBuses}` },
    { key: 'region', header: 'Region' },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-warning-50 hover:text-warning-600"
            aria-label="Edit route"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-danger-50 hover:text-danger-600"
            aria-label="Delete route"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Route Management"
        subtitle="Manage routes, stops, fares, and regional coverage."
        actions={
          <Button leftIcon={<FiPlus className="h-4 w-4" />} onClick={openCreate}>
            Add Route
          </Button>
        }
      />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by code, name, city..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={ROUTE_STATUS_FILTERS} className="sm:max-w-[160px]" />
          <Select value={region} onChange={(e) => setRegion(e.target.value)} options={regions ?? ['All Regions']} className="sm:max-w-[180px]" />
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiMap className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No routes available</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Click &lsquo;Add Route&rsquo; to create your first route.
                </p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <RouteFormModal
        key={editingRoute?.id ?? 'new'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialValues={editingRoute}
        isSaving={isSaving}
        title={editingRoute ? `Edit ${editingRoute.code}` : 'Add New Route'}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete route"
        message={`Are you sure you want to delete ${deleteTarget?.code} — ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminRoutes;

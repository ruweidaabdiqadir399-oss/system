import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  FiPlus, FiEdit2, FiTrash2, FiEye,
  FiTruck, FiCheckCircle, FiTool, FiXCircle,
} from 'react-icons/fi';
import PageHeader    from '../../components/common/PageHeader';
import Card          from '../../components/common/Card';
import Button        from '../../components/common/Button';
import SearchInput   from '../../components/common/SearchInput';
import Select        from '../../components/common/Select';
import Input         from '../../components/common/Input';
import DataTable     from '../../components/common/DataTable';
import Pagination    from '../../components/common/Pagination';
import Badge         from '../../components/common/Badge';
import Modal         from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatCard      from '../../components/common/StatCard';
import { useFetch }    from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast }    from '../../hooks/useToast';
import {
  getBuses, getBusById, createBus, updateBus, deleteBus, assignDriver,
  getFleetSummary, BUS_STATUS_FILTERS,
} from '../../services/busService';
import { getRouteOptions }        from '../../services/routeService';
import { getUsers }               from '../../services/userService';
import { formatDate, formatNumber } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE }        from '../../utils/constants';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_OPTIONS    = ['Active', 'Maintenance', 'Inactive'];
const AC_TYPE_OPTIONS   = ['AC', 'Non-AC'];
const SEAT_TYPE_OPTIONS = ['Seater', 'Sleeper'];

const EMPTY_BUS = {
  busNumber:       '',
  model:           '',
  acType:          'AC',
  seatType:        'Seater',
  capacity:        40,
  year:            new Date().getFullYear(),
  status:          'Active',
  fuelLevel:       100,
  mileage:         0,
  lastServiceDate: new Date().toISOString().slice(0, 10),
  currentRouteId:  '',
  driverId:        '',
};

// ─── Small helpers ────────────────────────────────────────────────────────────

const fuelBarColor = (level) => {
  if (level < 25) return 'bg-danger-500';
  if (level < 50) return 'bg-warning-500';
  return 'bg-success-500';
};

/** Converts any date string → YYYY-MM-DD for <input type="date"> */
const toDateInput = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

// ─── DetailRow ────────────────────────────────────────────────────────────────

const DetailRow = ({ label, children }) => (
  <div className="flex flex-col gap-0.5">
    <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
      {label}
    </span>
    <span className="text-sm font-medium text-ink">{children ?? '—'}</span>
  </div>
);

// ─── BusDetailModal ───────────────────────────────────────────────────────────

const BusDetailModal = ({ isOpen, onClose, busId }) => {
  const { data: bus, loading } = useFetch(
    () => (busId ? getBusById(busId) : Promise.resolve(null)),
    [busId],
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bus Details" size="lg">
      {loading || !bus ? (
        <div className="space-y-3 py-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-8 w-full rounded" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Header card ── */}
          <div className="flex items-start justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div>
              <p className="font-mono text-xs font-semibold text-ink-muted">{bus._id}</p>
              <p className="mt-0.5 text-xl font-display font-bold text-ink">{bus.busNumber}</p>
              <p className="text-sm text-ink-muted">{bus.model}&ensp;·&ensp;{bus.type}</p>
              <div className="mt-2">
                <Badge status={bus.status} />
              </div>
            </div>
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
              <FiTruck className="h-7 w-7" />
            </div>
          </div>

          {/* ── Detail grid ── */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
            <DetailRow label="Bus Number">{bus._id}</DetailRow>
            <DetailRow label="Plate Number">{bus.busNumber}</DetailRow>
            <DetailRow label="Bus Type">{bus.type}</DetailRow>
            <DetailRow label="Capacity">{bus.capacity} seats</DetailRow>
            <DetailRow label="Year">{bus.year ?? '—'}</DetailRow>
            <DetailRow label="Mileage">
              {bus.mileage != null ? `${formatNumber(bus.mileage)} mi` : '—'}
            </DetailRow>
            <DetailRow label="Assigned Driver">
              {bus.driverName && bus.driverName !== 'Unassigned'
                ? bus.driverName
                : <span className="italic text-ink-muted">Unassigned</span>}
            </DetailRow>
            <DetailRow label="Driver Phone">
              {bus.driverPhone
                ? bus.driverPhone
                : <span className="italic text-ink-muted">—</span>}
            </DetailRow>
            <DetailRow label="Current Route">
              {bus.currentRoute && bus.currentRoute !== 'Unassigned'
                ? bus.currentRoute
                : <span className="italic text-ink-muted">Unassigned</span>}
            </DetailRow>
            <DetailRow label="Route Origin">
              {bus.routeOrigin || <span className="italic text-ink-muted">—</span>}
            </DetailRow>
            <DetailRow label="Route Destination">
              {bus.routeDestination || <span className="italic text-ink-muted">—</span>}
            </DetailRow>
            <DetailRow label="Last Service">{formatDate(bus.lastServiceDate)}</DetailRow>
            <DetailRow label="Created Date">{formatDate(bus.createdAt)}</DetailRow>
            <DetailRow label="Last Updated">{formatDate(bus.updatedAt)}</DetailRow>
          </div>

          {/* ── Fuel level ── */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                Fuel Level
              </span>
              <span className="text-sm font-bold tabular-nums text-ink">
                {bus.fuelLevel ?? 0}%
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${fuelBarColor(bus.fuelLevel ?? 0)}`}
                style={{ width: `${bus.fuelLevel ?? 0}%` }}
              />
            </div>
          </div>

        </div>
      )}
    </Modal>
  );
};

// ─── BusFormModal ─────────────────────────────────────────────────────────────

const BusFormModal = ({ isOpen, onClose, onSubmit, initialValues, routeOptions, drivers, isSaving, isEditing }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: initialValues });

  useEffect(() => {
    if (isOpen) reset(initialValues);
  }, [isOpen, initialValues, reset]);

  const sectionLabel = (text) => (
    <h4 className="col-span-full mb-1 border-b border-slate-100 pb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">
      {text}
    </h4>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Bus' : 'Add New Bus'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(onSubmit)}
            isLoading={isSaving}
            leftIcon={<FiTruck className="h-4 w-4" />}
          >
            {isEditing ? 'Save Changes' : 'Add Bus'}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">

        {/* Basic info */}
        {sectionLabel('Basic Information')}
        <Input
          label="Plate Number"
          placeholder="e.g. NY-12-HC-1234"
          error={errors.busNumber?.message}
          hint="Vehicle registration / license plate"
          {...register('busNumber', { required: 'Plate number is required.' })}
        />
        <Input
          label="Model"
          placeholder="e.g. Volvo 9700"
          error={errors.model?.message}
          {...register('model', { required: 'Model is required.' })}
        />
        <Input
          label="Capacity (seats)"
          type="number"
          min={1}
          max={200}
          error={errors.capacity?.message}
          {...register('capacity', {
            required: 'Capacity is required.',
            min: { value: 1,   message: 'Must be at least 1.' },
            max: { value: 200, message: 'Cannot exceed 200.' },
          })}
        />
        <Input
          label="Year"
          type="number"
          min={1990}
          max={new Date().getFullYear() + 1}
          error={errors.year?.message}
          {...register('year', {
            min: { value: 1990, message: 'Must be 1990 or later.' },
          })}
        />

        {/* Configuration */}
        {sectionLabel('Configuration')}
        <Select label="AC Type"   options={AC_TYPE_OPTIONS}   {...register('acType')} />
        <Select label="Seat Type" options={SEAT_TYPE_OPTIONS} {...register('seatType')} />
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          containerClassName="sm:col-span-2"
          {...register('status')}
        />

        {/* Operational */}
        {sectionLabel('Operational Details')}
        <Input
          label="Fuel Level (%)"
          type="number"
          min={0}
          max={100}
          error={errors.fuelLevel?.message}
          {...register('fuelLevel', {
            min: { value: 0,   message: 'Cannot be below 0.' },
            max: { value: 100, message: 'Cannot exceed 100.' },
          })}
        />
        <Input
          label="Mileage (mi)"
          type="number"
          min={0}
          error={errors.mileage?.message}
          {...register('mileage', {
            min: { value: 0, message: 'Cannot be negative.' },
          })}
        />
        <Input
          label="Last Service Date"
          type="date"
          containerClassName="sm:col-span-2"
          {...register('lastServiceDate')}
        />

        {/* Assignment */}
        {sectionLabel('Assignment')}
        <Select
          label="Assigned Route"
          error={errors.currentRouteId?.message}
          {...register('currentRouteId', { required: 'Please select a route.' })}
        >
          <option value="">— Select Route —</option>
          {(routeOptions ?? []).map((r) => (
            <option key={r.id} value={r.id}>{r.label}</option>
          ))}
        </Select>
        <Select
          label="Assigned Driver"
          error={errors.driverId?.message}
          {...register('driverId', { required: 'Please select a driver.' })}
        >
          <option value="">— Select Driver —</option>
          {(drivers ?? []).map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </Select>

      </div>
    </Modal>
  );
};

// ─── AdminBuses (main page) ───────────────────────────────────────────────────

const AdminBuses = () => {
  const toast = useToast();

  // ── Filter / pagination state ──
  const [search, setSearch]           = useState('');
  const debouncedSearch               = useDebounce(search);
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [page, setPage]               = useState(1);

  // ── Modal state ──
  const [modalOpen, setModalOpen]     = useState(false);
  const [editingBus, setEditingBus]   = useState(null);   // null = create mode
  const [isSaving, setIsSaving]       = useState(false);

  const [viewingBusId, setViewingBusId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting]     = useState(false);

  // ── Data fetches ──
  const { data, loading, refetch } = useFetch(
    () => getBuses({ search: debouncedSearch, status: statusFilter, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, statusFilter, page],
  );
  const { data: summary, refetch: refetchSummary } = useFetch(() => getFleetSummary(), []);
  const { data: routeOptions }  = useFetch(() => getRouteOptions(), []);
  const { data: driverData }    = useFetch(() => getUsers({ role: 'driver', pageSize: 100 }), []);

  const drivers = driverData?.items ?? [];

  // Reset to page 1 whenever filters change
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter]);

  // ── Handlers ──
  const openCreate = () => {
    setEditingBus(null);
    setModalOpen(true);
  };

  const openEdit = (bus) => {
    setEditingBus({
      ...bus,
      lastServiceDate: toDateInput(bus.lastServiceDate),
      currentRouteId:  bus.currentRouteId ?? '',
      driverId:        bus.driverId       ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async (formValues) => {
    setIsSaving(true);
    const newDriverId = formValues.driverId || null;

    // Build the payload (driver handled separately via assignDriver for proper sync)
    const payload = {
      busNumber:       formValues.busNumber,
      model:           formValues.model,
      acType:          formValues.acType,
      seatType:        formValues.seatType,
      type:            `${formValues.acType} ${formValues.seatType}`,
      capacity:        Number(formValues.capacity),
      year:            formValues.year ? Number(formValues.year) : undefined,
      status:          formValues.status,
      fuelLevel:       Number(formValues.fuelLevel  ?? 100),
      mileage:         Number(formValues.mileage    ?? 0),
      lastServiceDate: formValues.lastServiceDate   || undefined,
      currentRouteId:  formValues.currentRouteId    || null,
      driverId:        newDriverId,
    };

    try {
      if (editingBus) {
        // ── UPDATE ──
        const busId = editingBus._id ?? editingBus.id;
        await updateBus(busId, payload);

        // Use the dedicated assignDriver endpoint when the driver changes —
        // it also clears the old assignment on other buses and syncs Driver.assignedBusId.
        const originalDriverId = editingBus.driverId || null;
        if (newDriverId && newDriverId !== originalDriverId) {
          await assignDriver(busId, newDriverId);
        }

        toast.success(`${payload.busNumber} updated successfully.`);
      } else {
        // ── CREATE ──
        const created = await createBus(payload);
        if (newDriverId) {
          await assignDriver(created._id, newDriverId);
        }
        toast.success(`${payload.busNumber} added to the fleet.`);
      }

      setModalOpen(false);
      refetch();
      refetchSummary();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save bus. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteBus(deleteTarget._id ?? deleteTarget.id);
      toast.success(`${deleteTarget.busNumber} removed from the fleet.`);
      setDeleteTarget(null);
      refetch();
      refetchSummary();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to delete bus.');
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Table columns ──
  const columns = [
    {
      key: 'bus',
      header: 'Bus',
      render: (row) => (
        <div>
          <p className="font-mono text-[11px] text-ink-muted">{row._id}</p>
          <p className="font-semibold text-ink">{row.busNumber}</p>
          <p className="text-xs text-ink-muted">{row.model}</p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Bus Type',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-ink">{row.acType}</p>
          <p className="text-xs text-ink-muted">{row.seatType}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Assigned Route',
      render: (row) =>
        row.currentRoute && row.currentRoute !== 'Unassigned' ? (
          <div>
            <p className="text-sm font-medium text-ink">{row.currentRoute}</p>
            <p className="text-xs text-ink-muted">{row.routeOrigin} → {row.routeDestination}</p>
          </div>
        ) : (
          <span className="text-sm italic text-ink-muted">Unassigned</span>
        ),
    },
    {
      key: 'driverName',
      header: 'Assigned Driver',
      render: (row) =>
        row.driverName && row.driverName !== 'Unassigned' ? (
          <span className="text-sm font-medium text-ink">{row.driverName}</span>
        ) : (
          <span className="text-sm italic text-ink-muted">Unassigned</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge status={row.status} />,
    },
    {
      key: 'fuelLevel',
      header: 'Fuel',
      render: (row) => {
        const fuel = row.fuelLevel ?? 0;
        return (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${fuelBarColor(fuel)}`}
                style={{ width: `${fuel}%` }}
              />
            </div>
            <span className="text-xs tabular-nums text-ink-muted">{fuel}%</span>
          </div>
        );
      },
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
            title="View details"
            aria-label="View bus details"
            onClick={() => setViewingBusId(row._id ?? row.id)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-info-50 hover:text-info-600"
          >
            <FiEye className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Edit bus"
            aria-label="Edit bus"
            onClick={() => openEdit(row)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-warning-50 hover:text-warning-600"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Delete bus"
            aria-label="Delete bus"
            onClick={() => setDeleteTarget(row)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-danger-50 hover:text-danger-600"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div>
      <PageHeader
        title="Bus Management"
        subtitle="Manage your fleet — vehicles, drivers, and operational status."
        actions={
          <Button leftIcon={<FiPlus className="h-4 w-4" />} onClick={openCreate}>
            Add Bus
          </Button>
        }
      />

      {/* ── Fleet stat cards ── */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={FiTruck}
          label="Total Fleet"
          value={summary?.total ?? '—'}
          color="primary"
        />
        <StatCard
          icon={FiCheckCircle}
          label="Active"
          value={summary?.byStatus?.Active ?? 0}
          color="success"
        />
        <StatCard
          icon={FiTool}
          label="Maintenance"
          value={summary?.byStatus?.Maintenance ?? 0}
          color="warning"
        />
        <StatCard
          icon={FiXCircle}
          label="Inactive"
          value={summary?.byStatus?.Inactive ?? 0}
          color="danger"
        />
      </div>

      {/* ── Buses table ── */}
      <Card className="mt-6" noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search plate, model, bus ID…"
            className="sm:max-w-xs"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={BUS_STATUS_FILTERS}
            className="sm:max-w-[180px]"
          />
          {data?.total != null && (
            <span className="ml-auto hidden text-sm text-ink-muted sm:block">
              {data.total} bus{data.total !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiTruck className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No buses available</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Click &lsquo;Add Bus&rsquo; to create your first bus.
                </p>
              </div>
            </div>
          }
        />
        <Pagination
          page={data?.page}
          totalPages={data?.totalPages}
          total={data?.total}
          pageSize={data?.pageSize}
          onPageChange={setPage}
        />
      </Card>

      {/* ── View details modal ── */}
      <BusDetailModal
        isOpen={Boolean(viewingBusId)}
        onClose={() => setViewingBusId(null)}
        busId={viewingBusId}
      />

      {/* ── Create / Edit modal ── */}
      <BusFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialValues={editingBus ?? EMPTY_BUS}
        routeOptions={routeOptions}
        drivers={drivers}
        isSaving={isSaving}
        isEditing={Boolean(editingBus)}
      />

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Bus"
        message={`Remove ${deleteTarget?.busNumber ?? 'this bus'} (${deleteTarget?._id ?? ''}) from the fleet? This cannot be undone.`}
        confirmLabel="Delete Bus"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminBuses;

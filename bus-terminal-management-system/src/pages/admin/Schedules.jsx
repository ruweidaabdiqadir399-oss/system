import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi';
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
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  SCHEDULE_STATUS_FILTERS,
} from '../../services/scheduleService';
import { getRouteOptions } from '../../services/routeService';
import { getBuses } from '../../services/busService';
import { getUsers } from '../../services/userService';
import { formatDate, formatTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const STATUS_OPTIONS = SCHEDULE_STATUS_FILTERS.slice(1);

const emptySchedule = {
  routeId: '',
  busId: '',
  driverId: '',
  date: new Date().toISOString().slice(0, 10),
  departureTime: '08:00',
  arrivalTime: '12:00',
  gate: '',
  status: 'Scheduled',
};

const toFormValues = (schedule) =>
  schedule
    ? {
        routeId: schedule.routeId,
        busId: schedule.busId,
        driverId: schedule.driverId ?? '',
        date: schedule.date,
        departureTime: schedule.departureTime,
        arrivalTime: schedule.arrivalTime,
        gate: schedule.gate ?? '',
        status: schedule.status,
      }
    : emptySchedule;

const ScheduleFormModal = ({ isOpen, onClose, onSubmit, initialValues, routeOptions, buses, drivers, isSaving, title, isEditing }) => {
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
            Save Trip
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Route"
          placeholder="Select a route"
          error={errors.routeId?.message}
          {...register('routeId', { required: 'Route is required.' })}
        >
          <option value="">Select a route</option>
          {(routeOptions ?? []).map((route) => (
            <option key={route.id} value={route.id}>
              {route.label}
            </option>
          ))}
        </Select>
        <Select
          label="Bus"
          placeholder="Select a bus"
          error={errors.busId?.message}
          {...register('busId', { required: 'Bus is required.' })}
        >
          <option value="">Select a bus</option>
          {buses.map((bus) => (
            <option key={bus._id} value={bus._id}>
              {bus.busNumber} - {bus.type} ({bus.capacity} seats)
            </option>
          ))}
        </Select>
        <Select label="Driver" {...register('driverId')}>
          <option value="">Unassigned</option>
          {drivers.map((driver) => (
            <option key={driver._id} value={driver._id}>
              {driver.name}
            </option>
          ))}
        </Select>
        <Input
          label="Departure Date"
          type="date"
          error={errors.date?.message}
          {...register('date', { required: 'Date is required.' })}
        />
        <Input
          label="Departure Time"
          type="time"
          error={errors.departureTime?.message}
          {...register('departureTime', { required: 'Departure time is required.' })}
        />
        <Input
          label="Arrival Time"
          type="time"
          error={errors.arrivalTime?.message}
          {...register('arrivalTime', { required: 'Arrival time is required.' })}
        />
        <Input label="Gate" placeholder="e.g. A-12" {...register('gate')} />
        {isEditing && <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />}
      </form>
    </Modal>
  );
};

const AdminSchedules = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('All Statuses');
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => getSchedules({ search: debouncedSearch, status, date, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, date, page]
  );
  const { data: routeOptions } = useFetch(() => getRouteOptions(), []);
  const { data: busData } = useFetch(() => getBuses({ pageSize: 100 }), []);
  const { data: driverData } = useFetch(() => getUsers({ role: 'driver', pageSize: 100 }), []);

  const buses = busData?.items ?? [];
  const drivers = driverData?.items ?? [];

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, date]);

  const openCreate = () => {
    setEditingSchedule(null);
    setModalOpen(true);
  };

  const openEdit = (schedule) => {
    setEditingSchedule(schedule);
    setModalOpen(true);
  };

  const handleSave = async (formValues) => {
    setIsSaving(true);
    const payload = {
      ...formValues,
      driverId: formValues.driverId || null,
    };
    try {
      if (editingSchedule) {
        await updateSchedule(editingSchedule._id, payload);
        toast.success('Trip schedule updated successfully.');
      } else {
        await createSchedule(payload);
        toast.success('Trip scheduled successfully.');
      }
      setModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save trip schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteSchedule(deleteTarget._id);
      toast.success('Trip schedule deleted successfully.');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to delete trip schedule.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Trip',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row._id}</p>
          <p className="text-xs text-ink-muted">{row.route?.code} &middot; {row.route?.name}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date & Time',
      render: (row) => (
        <div>
          <p className="text-ink">{formatDate(row.date)}</p>
          <p className="text-xs text-ink-muted">{formatTime(row.departureTime)} - {formatTime(row.arrivalTime)}</p>
        </div>
      ),
    },
    {
      key: 'bus',
      header: 'Bus',
      render: (row) => (
        <div>
          <p className="text-ink">{row.bus?.busNumber ?? '-'}</p>
          <p className="text-xs text-ink-muted">{row.driverName}</p>
        </div>
      ),
    },
    {
      key: 'bookedSeats',
      header: 'Seats',
      render: (row) => (
        <span className="text-sm text-ink-variant">
          {row.bookedSeats}/{row.totalSeats} booked
        </span>
      ),
    },
    { key: 'gate', header: 'Gate' },
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
            aria-label="Edit trip"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-danger-50 hover:text-danger-600"
            aria-label="Delete trip"
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
        title="Schedule Management"
        subtitle="Plan and manage upcoming trips across your fleet."
        actions={
          <Button leftIcon={<FiPlus className="h-4 w-4" />} onClick={openCreate}>
            Schedule Trip
          </Button>
        }
      />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by trip ID, gate..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={SCHEDULE_STATUS_FILTERS} className="sm:max-w-[170px]" />
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="sm:max-w-[160px]" />
          {date && (
            <button type="button" onClick={() => setDate('')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
              Clear date
            </button>
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
                <FiCalendar className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No schedules available</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Click &lsquo;Schedule Trip&rsquo; to create your first schedule.
                </p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <ScheduleFormModal
        key={editingSchedule?._id ?? 'new'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialValues={editingSchedule}
        routeOptions={routeOptions}
        buses={buses}
        drivers={drivers}
        isSaving={isSaving}
        isEditing={Boolean(editingSchedule)}
        title={editingSchedule ? `Edit ${editingSchedule._id}` : 'Schedule New Trip'}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete trip schedule"
        message={`Are you sure you want to delete trip ${deleteTarget?._id}? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AdminSchedules;

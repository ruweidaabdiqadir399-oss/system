import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiUserCheck, FiTruck, FiUser, FiStar } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Avatar from '../../components/common/Avatar';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatCard from '../../components/common/StatCard';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getUsers, createUser, updateUser, deleteUser, getUserCounts } from '../../services/userService';
import { getBuses } from '../../services/busService';
import { assignBusToDriver } from '../../services/driverService';
import { getDriversSummary, getDriverRatings } from '../../services/ratingService';
import { formatDate, formatDateTime } from '../../utils/formatters';
import { emailRule, phoneRule } from '../../utils/validators';
import { DEFAULT_PAGE_SIZE, DEPARTMENTS } from '../../utils/constants';

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'driver', label: 'Driver' },
  { value: 'customer', label: 'Customer' },
];

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'On Leave', label: 'On Leave' },
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'driver', label: 'Driver' },
  { value: 'customer', label: 'Customer' },
];

const STATUS_OPTIONS = ['Active', 'Inactive', 'On Leave'];

const ROLE_VARIANT = {
  admin: 'primary',
  staff: 'info',
  driver: 'warning',
  customer: 'neutral',
};

const emptyUser = {
  name: '',
  email: '',
  phone: '',
  role: 'customer',
  status: 'Active',
  password: '',
  department: '',
  desk: '',
  licenseNumber: '',
  licenseExpiry: '',
};

const UserFormModal = ({ isOpen, onClose, onSubmit, initialValues, isSaving, title, isEditing }) => {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ defaultValues: initialValues });

  useEffect(() => {
    if (isOpen) reset(initialValues);
  }, [isOpen, initialValues, reset]);

  const role = watch('role');

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
            Save User
          </Button>
        </>
      }
    >
      <form className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Full Name"
          placeholder="e.g. Jordan Blake"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required.' })}
        />
        <Input
          label="Email Address"
          type="email"
          placeholder="name@example.com"
          error={errors.email?.message}
          {...register('email', emailRule)}
        />
        <Input
          label="Phone Number"
          placeholder="+1 (212) 555-0100"
          error={errors.phone?.message}
          {...register('phone', phoneRule)}
        />
        <Select label="Role" options={ROLE_OPTIONS} {...register('role', { required: true })} />
        {isEditing && <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />}
        {!isEditing && (
          <Input
            label="Temporary Password"
            type="text"
            placeholder="Leave blank for default (Welcome@123)"
            hint="The user can change this after their first login."
            {...register('password')}
          />
        )}

        {role === 'staff' && (
          <>
            <Select
              label="Department"
              placeholder="Select department..."
              options={DEPARTMENTS}
              error={errors.department?.message}
              {...register('department', { required: 'Department is required for staff users.' })}
            />
            <Input label="Desk / Counter" placeholder="e.g. Counter 3 - Terminal A" {...register('desk')} />
          </>
        )}
        {role === 'driver' && (
          <>
            <Input label="License Number" placeholder="e.g. CDL-NY-558210" {...register('licenseNumber')} />
            <Input label="License Expiry" type="date" {...register('licenseExpiry')} />
          </>
        )}
      </form>
    </Modal>
  );
};

const AssignBusModal = ({ driver, onClose, onSaved }) => {
  const toast = useToast();
  const [selectedBusId, setSelectedBusId] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: busData, loading: busesLoading } = useFetch(
    () => getBuses({ pageSize: 100 }),
    []
  );

  // Show unassigned buses AND the bus already assigned to this driver
  const availableBuses = (busData?.items ?? []).filter(
    (b) => !b.driverId || b.driverId === driver._id
  );

  const handleSave = async () => {
    if (!selectedBusId) return;
    setIsSaving(true);
    try {
      await assignBusToDriver(driver._id, selectedBusId);
      toast.success('Bus assigned successfully.');
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to assign bus.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Assign Bus — ${driver.name}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={!selectedBusId}>Save</Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-ink-muted">
          Only unassigned buses are listed. A bus can only be assigned to one driver at a time.
        </p>
        {busesLoading ? (
          <div className="skeleton h-10 w-full rounded" />
        ) : availableBuses.length === 0 ? (
          <p className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">
            No available buses. All buses are currently assigned to other drivers.
          </p>
        ) : (
          <select
            className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-ink focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
          >
            <option value="">Choose a bus…</option>
            {availableBuses.map((b) => (
              <option key={b._id} value={b._id}>
                {b.busNumber} — {b.model} ({b.capacity} seats, {b.status})
              </option>
            ))}
          </select>
        )}
      </div>
    </Modal>
  );
};

const AdminUsers = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [assignBusTarget, setAssignBusTarget] = useState(null);
  const [reviewsTarget, setReviewsTarget] = useState(null);
  const [reviewsData, setReviewsData] = useState(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  const { data: driversSummary } = useFetch(() => getDriversSummary(), []);

  const openReviews = async (driver) => {
    setReviewsTarget(driver);
    setReviewsData(null);
    setReviewsLoading(true);
    try {
      const result = await getDriverRatings(driver._id);
      setReviewsData(result);
    } catch {
      setReviewsData(null);
    } finally {
      setReviewsLoading(false);
    }
  };

  const { data, loading, refetch } = useFetch(
    () => getUsers({ search: debouncedSearch, role, status, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, role, status, page]
  );
  const { data: counts, refetch: refetchCounts } = useFetch(() => getUserCounts(), []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status]);

  const openCreate = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleSave = async (formValues) => {
    setIsSaving(true);
    try {
      const values = { ...formValues, department: formValues.role === 'staff' ? formValues.department : '' };
      if (editingUser) {
        const { password, ...payload } = values;
        await updateUser(editingUser._id, payload);
        toast.success('User updated successfully.');
      } else {
        await createUser(values);
        toast.success('User created successfully.');
      }
      setModalOpen(false);
      refetch();
      refetchCounts();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to save user.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteUser(deleteTarget._id);
      toast.success('User removed successfully.');
      setDeleteTarget(null);
      refetch();
      refetchCounts();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to delete user.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} size="sm" />
          <div>
            <p className="font-medium text-ink">{row.name}</p>
            <p className="text-xs text-ink-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <Badge variant={ROLE_VARIANT[row.role]}>{row.role.charAt(0).toUpperCase() + row.role.slice(1)}</Badge>,
    },
    { key: 'phone', header: 'Phone' },
    {
      key: 'department',
      header: 'Department',
      render: (row) =>
        row.role === 'staff' ? (
          row.department || <span className="text-ink-muted">—</span>
        ) : (
          <span className="text-ink-muted">N/A</span>
        ),
    },
    { key: 'joinedDate', header: 'Joined', render: (row) => formatDate(row.joinedDate) },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'rating',
      header: 'Rating',
      render: (row) => {
        if (row.role !== 'driver') return <span className="text-ink-muted">—</span>;
        const s = driversSummary?.[row._id];
        if (!s || s.totalReviews === 0) return <span className="text-xs text-ink-muted">No ratings</span>;
        return (
          <div>
            <span className="text-sm text-warning-500">
              {'★'.repeat(Math.round(s.avgRating))}{'☆'.repeat(5 - Math.round(s.avgRating))}
            </span>
            <p className="text-xs text-ink-muted">{s.avgRating.toFixed(1)} &middot; {s.totalReviews} {s.totalReviews === 1 ? 'review' : 'reviews'}</p>
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
          {row.role === 'driver' && (
            <button
              type="button"
              onClick={() => setAssignBusTarget(row)}
              className="rounded-md p-1.5 text-ink-muted transition hover:bg-info-50 hover:text-info-600"
              aria-label="Assign bus"
              title="Assign Bus"
            >
              <FiTruck className="h-4 w-4" />
            </button>
          )}
          {row.role === 'driver' && (
            <button
              type="button"
              onClick={() => openReviews(row)}
              className="rounded-md p-1.5 text-ink-muted transition hover:bg-info-50 hover:text-info-600"
              aria-label="View reviews"
              title="View Reviews"
            >
              <FiStar className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => openEdit(row)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-warning-50 hover:text-warning-600"
            aria-label="Edit user"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(row)}
            className="rounded-md p-1.5 text-ink-muted transition hover:bg-danger-50 hover:text-danger-600"
            aria-label="Delete user"
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
        title="User Management"
        subtitle="Manage admins, staff, drivers, and customer accounts."
        actions={
          <Button leftIcon={<FiPlus className="h-4 w-4" />} onClick={openCreate}>
            Add User
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiUsers} label="Total Users" value={counts?.total ?? '...'} color="primary" />
        <StatCard icon={FiUserCheck} label="Staff" value={counts?.staff ?? 0} color="info" />
        <StatCard icon={FiTruck} label="Drivers" value={counts?.driver ?? 0} color="warning" />
        <StatCard icon={FiUser} label="Customers" value={counts?.customer ?? 0} color="success" />
      </div>

      <Card className="mt-6" noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, phone..." className="sm:max-w-xs" />
          <Select value={role} onChange={(e) => setRole(e.target.value)} options={ROLE_FILTER_OPTIONS} className="sm:max-w-[160px]" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_FILTER_OPTIONS} className="sm:max-w-[160px]" />
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiUsers className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No users found</p>
                <p className="mt-1 text-sm text-ink-muted">
                  Click &lsquo;Add User&rsquo; to create a new user.
                </p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <UserFormModal
        key={editingUser?._id ?? 'new'}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSave}
        initialValues={editingUser ?? emptyUser}
        isSaving={isSaving}
        isEditing={Boolean(editingUser)}
        title={editingUser ? `Edit ${editingUser.name}` : 'Add New User'}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete user"
        message={`Are you sure you want to remove ${deleteTarget?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        isLoading={isDeleting}
      />

      {assignBusTarget && (
        <AssignBusModal
          driver={assignBusTarget}
          onClose={() => setAssignBusTarget(null)}
          onSaved={refetch}
        />
      )}

      <Modal
        isOpen={Boolean(reviewsTarget)}
        onClose={() => { setReviewsTarget(null); setReviewsData(null); }}
        title={`Reviews — ${reviewsTarget?.name ?? ''}`}
        size="lg"
      >
        {reviewsLoading && (
          <div className="space-y-3 py-2">
            <div className="skeleton h-12 w-full rounded" />
            <div className="skeleton h-32 w-full rounded" />
          </div>
        )}
        {!reviewsLoading && reviewsData && (
          <div className="space-y-4">
            <div className="flex items-center gap-6 rounded-lg bg-slate-50 p-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Average Rating</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-2xl font-display font-bold text-ink">
                    {reviewsData.totalReviews > 0 ? reviewsData.avgRating.toFixed(1) : '—'}
                  </p>
                  {reviewsData.totalReviews > 0 && (
                    <span className="text-lg text-warning-500">
                      {'★'.repeat(Math.round(reviewsData.avgRating))}
                      {'☆'.repeat(5 - Math.round(reviewsData.avgRating))}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Total Reviews</p>
                <p className="mt-1 text-2xl font-display font-bold text-ink">{reviewsData.totalReviews}</p>
              </div>
            </div>

            {reviewsData.reviews.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">No reviews yet for this driver.</p>
            ) : (
              <div className="table-shell">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Rating</th>
                      <th>Comment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewsData.reviews.map((review) => (
                      <tr key={review._id}>
                        <td className="font-medium text-ink">{review.customerName}</td>
                        <td>
                          <span className="text-warning-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                          <span className="ml-1 text-xs text-ink-muted">{review.rating}/5</span>
                        </td>
                        <td className="text-sm text-ink-muted">{review.comment || '—'}</td>
                        <td className="text-sm text-ink-muted">{formatDateTime(review.reviewDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {!reviewsLoading && !reviewsData && (
          <p className="py-4 text-center text-sm text-ink-muted">Could not load reviews.</p>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;

import { useState } from 'react';
import { FiStar, FiMessageSquare, FiUser, FiTruck } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import SearchInput from '../../components/common/SearchInput';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import StatCard from '../../components/common/StatCard';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { getAllReviews, getDriversSummary, getBusesSummary } from '../../services/ratingService';
import { formatDateTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';

const Stars = ({ rating }) => (
  <span className="text-warning-500">{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
);

const AdminReviews = () => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [page, setPage] = useState(1);
  const [viewReview, setViewReview] = useState(null);

  const { data, loading } = useFetch(
    () => getAllReviews({ search: debouncedSearch, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, page]
  );

  const { data: driversSummary } = useFetch(() => getDriversSummary(), []);
  const { data: busesSummary } = useFetch(() => getBusesSummary(), []);

  const totalReviews = data?.total ?? 0;
  const driverCount = driversSummary ? Object.keys(driversSummary).length : 0;
  const busCount = busesSummary ? Object.keys(busesSummary).length : 0;
  const avgOfAvgs = (summary) => {
    const rows = Object.values(summary ?? {});
    if (!rows.length) return 0;
    const totalScore = rows.reduce((sum, r) => sum + r.avgRating * r.totalReviews, 0);
    const totalCount = rows.reduce((sum, r) => sum + r.totalReviews, 0);
    return totalCount ? Math.round((totalScore / totalCount) * 10) / 10 : 0;
  };
  const overallAverage = avgOfAvgs(driversSummary);

  const columns = [
    {
      key: 'trip',
      header: 'Trip',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row.routeName ?? row.scheduleId}</p>
          {row.routeOrigin && (
            <p className="text-xs text-ink-muted">{row.routeOrigin} → {row.routeDestination}</p>
          )}
        </div>
      ),
    },
    { key: 'customerName', header: 'Customer' },
    { key: 'driverName', header: 'Driver' },
    { key: 'busNumber', header: 'Bus', render: (row) => row.busNumber ?? '-' },
    { key: 'rating', header: 'Rating', render: (row) => <Stars rating={row.rating} /> },
    { key: 'reviewDate', header: 'Date', render: (row) => formatDateTime(row.reviewDate) },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <button
          type="button"
          onClick={() => setViewReview(row)}
          className="rounded-md p-1.5 text-ink-muted transition hover:bg-info-50 hover:text-info-600"
          aria-label="View review"
          title="View Feedback"
        >
          <FiMessageSquare className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Reviews Overview" subtitle="Trip ratings and feedback submitted by customers." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FiStar} label="Total Reviews" value={totalReviews} color="primary" />
        <StatCard icon={FiStar} label="Overall Average Rating" value={overallAverage ? `${overallAverage} / 5` : '—'} color="warning" />
        <StatCard icon={FiUser} label="Drivers Rated" value={driverCount} color="info" />
        <StatCard icon={FiTruck} label="Buses Rated" value={busCount} color="success" />
      </div>

      <Card className="mt-6" noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search feedback comments..." className="sm:max-w-xs" />
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiStar className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No reviews yet</p>
                <p className="mt-1 text-sm text-ink-muted">Customer trip ratings will appear here.</p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <Modal isOpen={Boolean(viewReview)} onClose={() => setViewReview(null)} title="Trip Feedback" size="md">
        {viewReview && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Customer</p>
              <p className="mt-1 text-sm text-ink">{viewReview.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Rating</p>
              <div className="mt-1"><Stars rating={viewReview.rating} /></div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Driver</p>
              <p className="mt-1 text-sm text-ink">{viewReview.driverName}</p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Bus</p>
              <p className="mt-1 text-sm text-ink">{viewReview.busNumber ?? '-'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Trip</p>
              <p className="mt-1 text-sm text-ink">{viewReview.routeName ?? viewReview.scheduleId}</p>
              {viewReview.routeOrigin && (
                <p className="text-xs text-ink-muted">{viewReview.routeOrigin} → {viewReview.routeDestination}</p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Date</p>
              <p className="mt-1 text-sm text-ink">{formatDateTime(viewReview.reviewDate)}</p>
            </div>
            <div className="col-span-2 rounded-lg bg-slate-50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Comment</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{viewReview.comment || 'No comment left.'}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminReviews;

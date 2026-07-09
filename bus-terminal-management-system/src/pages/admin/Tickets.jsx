import { useEffect, useState } from 'react';
import { FiMoreVertical, FiEye, FiXCircle, FiHash, FiDownload, FiPrinter } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import SearchInput from '../../components/common/SearchInput';
import Select from '../../components/common/Select';
import DataTable from '../../components/common/DataTable';
import Pagination from '../../components/common/Pagination';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Dropdown, { DropdownItem } from '../../components/common/Dropdown';
import { useFetch } from '../../hooks/useFetch';
import { useDebounce } from '../../hooks/useDebounce';
import { useToast } from '../../hooks/useToast';
import { getTickets, updateTicketStatus, TICKET_STATUS_FILTERS } from '../../services/ticketService';
import { formatDate, formatDateTime, formatTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { downloadTicketPDF, printTicketPDF } from '../../utils/ticketPdf';

const AdminTickets = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [status, setStatus] = useState('All Statuses');
  const [page, setPage] = useState(1);

  const [viewTicket, setViewTicket] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const { data, loading, refetch } = useFetch(
    () => getTickets({ search: debouncedSearch, status, page, pageSize: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, status, page]
  );

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setIsUpdating(true);
    try {
      await updateTicketStatus(cancelTarget._id, 'Cancelled');
      toast.success(`Ticket ${cancelTarget._id} has been cancelled.`);
      setCancelTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Unable to cancel ticket.');
    } finally {
      setIsUpdating(false);
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'Ticket',
      render: (row) => (
        <div>
          <p className="font-medium text-ink">{row._id}</p>
          <p className="text-xs text-ink-muted">{row.bookingId}</p>
        </div>
      ),
    },
    {
      key: 'passengerName',
      header: 'Passenger',
      render: (row) => (
        <div>
          <p className="text-ink">{row.passengerName}</p>
          <p className="text-xs text-ink-muted">{row.customerName}</p>
        </div>
      ),
    },
    {
      key: 'route',
      header: 'Trip',
      render: (row) => (
        <div>
          <p className="text-ink">{row.route?.code ?? '-'}</p>
          <p className="text-xs text-ink-muted">{row.schedule ? `${formatDate(row.schedule.date)} ${formatTime(row.schedule.departureTime)}` : '-'}</p>
        </div>
      ),
    },
    { key: 'seatNumber', header: 'Seat', render: (row) => <span className="font-medium text-ink">{row.seatNumber}</span> },
    { key: 'issuedAt', header: 'Issued', render: (row) => formatDate(row.issuedAt) },
    { key: 'status', header: 'Status', render: (row) => <Badge status={row.status} /> },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      render: (row) => (
        <Dropdown
          trigger={
            <button type="button" className="rounded-md p-1.5 text-ink-muted transition hover:bg-slate-100 hover:text-ink" aria-label="Ticket actions">
              <FiMoreVertical className="h-4 w-4" />
            </button>
          }
        >
          {({ close }) => (
            <>
              <DropdownItem
                icon={<FiEye className="h-4 w-4" />}
                onClick={() => {
                  setViewTicket(row);
                  close();
                }}
              >
                View Ticket
              </DropdownItem>
              {row.status === 'Valid' && (
                <DropdownItem
                  icon={<FiXCircle className="h-4 w-4" />}
                  danger
                  onClick={() => {
                    setCancelTarget(row);
                    close();
                  }}
                >
                  Cancel Ticket
                </DropdownItem>
              )}
            </>
          )}
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Ticketing" subtitle="View issued tickets and manage their validity." />

      <Card noPadding>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by ticket, passenger, seat..." className="sm:max-w-xs" />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} options={TICKET_STATUS_FILTERS} className="sm:max-w-[170px]" />
        </div>
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          loading={loading}
          keyField="_id"
          emptyMessage={
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <FiHash className="h-6 w-6 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="font-medium text-ink">No tickets available</p>
                <p className="mt-1 text-sm text-ink-muted">Tickets are generated automatically when bookings are confirmed.</p>
              </div>
            </div>
          }
        />
        <Pagination page={data?.page} totalPages={data?.totalPages} total={data?.total} pageSize={data?.pageSize} onPageChange={setPage} />
      </Card>

      <Modal
        isOpen={Boolean(viewTicket)}
        onClose={() => setViewTicket(null)}
        title="E-Ticket"
        size="md"
        footer={viewTicket && (
          <>
            <button
              type="button"
              onClick={() => downloadTicketPDF(viewTicket)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-variant shadow-sm transition hover:border-primary-300 hover:text-primary-600"
            >
              <FiDownload className="h-4 w-4" /> Download PDF
            </button>
            <button
              type="button"
              onClick={() => printTicketPDF(viewTicket)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-ink-variant shadow-sm transition hover:border-primary-300 hover:text-primary-600"
            >
              <FiPrinter className="h-4 w-4" /> Print Ticket
            </button>
          </>
        )}
      >
        {viewTicket && (
          <div className="space-y-5">
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <p className="font-display text-lg font-bold text-ink">{viewTicket.route?.name}</p>
              <p className="text-sm text-ink-muted">{viewTicket.route?.origin} → {viewTicket.route?.destination}</p>
              <div className="my-4 flex items-center justify-center">
                <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-slate-200 bg-white">
                  <FiHash className="h-16 w-16 text-slate-300" />
                </div>
              </div>
              <p className="font-mono text-xs text-ink-muted break-all">{viewTicket.qrPayload}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Ticket No.</p>
                <p className="mt-1 text-sm font-semibold text-ink">{viewTicket._id}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</p>
                <div className="mt-1"><Badge status={viewTicket.status} /></div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Passenger</p>
                <p className="mt-1 text-sm text-ink">{viewTicket.passengerName}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Seat</p>
                <p className="mt-1 text-sm font-semibold text-ink">{viewTicket.seatNumber}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Departure</p>
                <p className="mt-1 text-sm text-ink">
                  {viewTicket.schedule ? `${formatDate(viewTicket.schedule.date)} at ${formatTime(viewTicket.schedule.departureTime)}` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Gate</p>
                <p className="mt-1 text-sm text-ink">{viewTicket.schedule?.gate ?? '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Issued On</p>
                <p className="mt-1 text-sm text-ink">{formatDateTime(viewTicket.issuedAt)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel ticket"
        message={`Are you sure you want to cancel ticket ${cancelTarget?._id}? This will mark it as invalid for travel.`}
        confirmLabel="Cancel Ticket"
        isLoading={isUpdating}
      />
    </div>
  );
};

export default AdminTickets;

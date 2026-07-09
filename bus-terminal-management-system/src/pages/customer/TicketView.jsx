import { useState } from 'react';
import { FiHash, FiDownload, FiPrinter } from 'react-icons/fi';
import PageHeader from '../../components/common/PageHeader';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Pagination from '../../components/common/Pagination';
import EmptyState from '../../components/common/EmptyState';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import { getTicketsByCustomer } from '../../services/ticketService';
import { formatDate, formatTime } from '../../utils/formatters';
import { DEFAULT_PAGE_SIZE } from '../../utils/constants';
import { downloadTicketPDF, printTicketPDF } from '../../utils/ticketPdf';

const CustomerTicketView = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  const { data, loading } = useFetch(() => getTicketsByCustomer(user.id, { page, pageSize: DEFAULT_PAGE_SIZE }), [user.id, page]);

  const tickets = data?.items ?? [];

  return (
    <div>
      <PageHeader title="My Tickets" subtitle="Your e-tickets for upcoming and past trips." />

      {loading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <div className="skeleton h-56 w-full" />
            </Card>
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card>
          <EmptyState title="No tickets yet" description="Book a trip to receive your first e-ticket." />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {tickets.map((ticket) => (
            <Card key={ticket.id}>
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                <p className="font-display text-lg font-bold text-ink">{ticket.route?.name}</p>
                <p className="text-sm text-ink-muted">{ticket.route?.origin} → {ticket.route?.destination}</p>
                <div className="my-4 flex items-center justify-center">
                  <div className="flex h-28 w-28 items-center justify-center rounded-lg border-2 border-slate-200 bg-white p-1">
                    {ticket.qrCode
                      ? <img src={ticket.qrCode} alt="QR Code" className="h-full w-full object-contain" />
                      : <FiHash className="h-14 w-14 text-slate-300" />}
                  </div>
                </div>
                <p className="font-mono text-xs text-ink-muted break-all">{ticket.qrPayload}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Ticket No.</p>
                  <p className="mt-1 font-semibold text-ink">{ticket.id}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Status</p>
                  <div className="mt-1"><Badge status={ticket.status} /></div>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Passenger</p>
                  <p className="mt-1 text-ink">{ticket.passengerName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Seat</p>
                  <p className="mt-1 font-semibold text-ink">{ticket.seatNumber}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Departure</p>
                  <p className="mt-1 text-ink">
                    {ticket.schedule ? `${formatDate(ticket.schedule.date)} at ${formatTime(ticket.schedule.departureTime)}` : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Gate</p>
                  <p className="mt-1 text-ink">{ticket.schedule?.gate ?? '-'}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => downloadTicketPDF(ticket)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-variant shadow-sm transition hover:border-primary-300 hover:text-primary-600"
                >
                  <FiDownload className="h-3.5 w-3.5" /> Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => printTicketPDF(ticket)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-variant shadow-sm transition hover:border-primary-300 hover:text-primary-600"
                >
                  <FiPrinter className="h-3.5 w-3.5" /> Print Ticket
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <Card className="mt-6" noPadding>
          <Pagination page={data.page} totalPages={data.totalPages} total={data.total} pageSize={data.pageSize} onPageChange={setPage} />
        </Card>
      )}
    </div>
  );
};

export default CustomerTicketView;

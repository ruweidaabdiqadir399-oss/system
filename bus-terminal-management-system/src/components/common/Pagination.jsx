import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const getPageNumbers = (page, totalPages) => {
  const pages = new Set([1, totalPages, page - 1, page, page + 1]);
  return [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
};

const Pagination = ({ page = 1, totalPages = 1, total = 0, pageSize = 0, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pages = getPageNumbers(page, totalPages);
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 sm:flex-row">
      <p className="text-sm text-ink-muted">
        Showing <span className="font-semibold text-ink">{start}</span>-
        <span className="font-semibold text-ink">{end}</span> of <span className="font-semibold text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-variant transition hover:bg-slate-100 disabled:opacity-40"
          aria-label="Previous page"
        >
          <FiChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((p, idx) => {
          const prev = pages[idx - 1];
          const showEllipsis = prev !== undefined && p - prev > 1;
          return (
            <span key={p} className="flex items-center">
              {showEllipsis && <span className="px-1 text-sm text-ink-muted">...</span>}
              <button
                type="button"
                onClick={() => onPageChange(p)}
                className={`h-8 min-w-8 rounded-md px-2 text-sm font-medium transition-colors ${
                  p === page ? 'bg-primary-600 text-white' : 'text-ink-variant hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            </span>
          );
        })}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="flex h-8 w-8 items-center justify-center rounded-md text-ink-variant transition hover:bg-slate-100 disabled:opacity-40"
          aria-label="Next page"
        >
          <FiChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

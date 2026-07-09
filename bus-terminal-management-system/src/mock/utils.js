// Lightweight helpers that make the in-memory mock API feel like a real
// network-backed REST API: latency, occasional failures, pagination & errors
// that mirror the shape of an Axios error (`error.response.data.message`).

export const delay = (ms = 450) => new Promise((resolve) => setTimeout(resolve, ms));

export class ApiError extends Error {
  constructor(message, status = 400, data = {}) {
    super(message);
    this.name = 'ApiError';
    this.response = { status, data: { message, ...data } };
  }
}

/**
 * Wraps a synchronous resolver with a simulated network round-trip.
 * `failRate` (0-1) randomly throws an ApiError to exercise error states.
 */
export const simulate = async (resolver, { latency = 450, failRate = 0 } = {}) => {
  await delay(latency);
  if (failRate > 0 && Math.random() < failRate) {
    throw new ApiError('Something went wrong. Please try again.', 500);
  }
  return resolver();
};

export const paginate = (items, { page = 1, pageSize = 10 } = {}) => {
  const total = items.length;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    page: safePage,
    pageSize,
    total,
    totalPages,
  };
};

export const matchesSearch = (record, search, fields) => {
  if (!search) return true;
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return fields.some((field) => String(record[field] ?? '').toLowerCase().includes(term));
};

let idCounter = Date.now() % 100000;
export const nextId = (prefix) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

export const clone = (value) => JSON.parse(JSON.stringify(value));

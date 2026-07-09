import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const TICKET_STATUS_FILTERS = ['All Statuses', 'Valid', 'Used', 'Boarded', 'Cancelled'];

export const getTickets = async ({ search = '', status = 'All Statuses', bookingId, scheduleId, customerId, page = 1, pageSize = 8 } = {}) => {
  const params = { search, page, pageSize };
  if (status !== 'All Statuses') params.status = status;
  if (bookingId) params.bookingId = bookingId;
  if (scheduleId) params.scheduleId = scheduleId;
  if (customerId) params.customerId = customerId;
  const res = await apiClient.get('/tickets', { params });
  return unwrapPaginated(res);
};

export const getTicketById = async (id) => {
  const res = await apiClient.get(`/tickets/${id}`);
  return unwrap(res);
};

export const getTicketsByBooking = async (bookingId) => {
  const res = await apiClient.get('/tickets', { params: { bookingId, pageSize: 50 } });
  const { items } = unwrapPaginated(res);
  return items;
};

export const getTicketsByCustomer = async (customerId, { page = 1, pageSize = 8 } = {}) => {
  const res = await apiClient.get('/tickets', { params: { customerId, page, pageSize } });
  return unwrapPaginated(res);
};

export const verifyTicket = async (code) => {
  const res = await apiClient.post('/tickets/verify', { code });
  return unwrap(res);
};

export const updateTicketStatus = async (id, status) => {
  const res = await apiClient.patch(`/tickets/${id}/status`, { status });
  return unwrap(res);
};

export const boardTicket = async (code) => {
  const res = await apiClient.post('/tickets/board', { code });
  return unwrap(res);
};

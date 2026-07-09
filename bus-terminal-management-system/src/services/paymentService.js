import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const PAYMENT_STATUS_FILTERS = ['All Statuses', 'Completed', 'Pending', 'Failed', 'Refunded'];
export const PAYMENT_METHOD_FILTERS = ['All Methods', 'EVC Plus', 'Sahal', 'Zaad', 'eDahab', 'Bank Card'];

export const getPayments = async ({ search = '', status = 'All Statuses', method = 'All Methods', page = 1, pageSize = 8 } = {}) => {
  const params = { search, page, pageSize };
  if (status !== 'All Statuses') params.status = status;
  if (method !== 'All Methods') params.method = method;
  const res = await apiClient.get('/payments', { params });
  return unwrapPaginated(res);
};

export const getPaymentById = async (id) => {
  const res = await apiClient.get(`/payments/${id}`);
  return unwrap(res);
};

export const getPaymentsByCustomer = async (customerId, { page = 1, pageSize = 8 } = {}) => {
  const res = await apiClient.get('/payments', { params: { customerId, page, pageSize } });
  return unwrapPaginated(res);
};

export const createPayment = async ({ bookingId, amount, method }) => {
  const res = await apiClient.post('/payments', { bookingId, amount, method });
  return unwrap(res);
};

export const refundPayment = async (id) => {
  const res = await apiClient.patch(`/payments/${id}/refund`);
  return unwrap(res);
};

export const getPaymentSummary = async () => {
  const res = await apiClient.get('/payments/summary');
  return unwrap(res);
};

import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const getSupportRequests = async ({ search = '', status = 'all', category = 'all', page = 1, pageSize = 8 } = {}) => {
  const res = await apiClient.get('/support-requests', { params: { search, status, category, page, pageSize } });
  return unwrapPaginated(res);
};

export const getSupportRequestById = async (id) => {
  const res = await apiClient.get(`/support-requests/${id}`);
  return unwrap(res);
};

export const createSupportRequest = async (data) => {
  const res = await apiClient.post('/support-requests', data);
  return unwrap(res);
};

export const updateSupportRequest = async (id, data) => {
  const res = await apiClient.patch(`/support-requests/${id}`, data);
  return unwrap(res);
};

export const deleteSupportRequest = async (id) => {
  const res = await apiClient.delete(`/support-requests/${id}`);
  return unwrap(res);
};

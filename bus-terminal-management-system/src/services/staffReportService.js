import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const getReports = async ({
  search = '',
  status = 'all',
  department = 'all',
  type = 'all',
  from = '',
  to = '',
  page = 1,
  pageSize = 8,
} = {}) => {
  const params = { search, status, department, type, page, pageSize };
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await apiClient.get('/staff-reports', { params });
  return unwrapPaginated(res);
};

export const getReportById = async (id) => {
  const res = await apiClient.get(`/staff-reports/${id}`);
  return unwrap(res);
};

export const createReport = async (data) => {
  const res = await apiClient.post('/staff-reports', data);
  return unwrap(res);
};

export const updateReport = async (id, data) => {
  const res = await apiClient.patch(`/staff-reports/${id}`, data);
  return unwrap(res);
};

export const updateReportStatus = async (id, data) => {
  const res = await apiClient.patch(`/staff-reports/${id}/status`, data);
  return unwrap(res);
};

export const deleteReport = async (id) => {
  const res = await apiClient.delete(`/staff-reports/${id}`);
  return unwrap(res);
};

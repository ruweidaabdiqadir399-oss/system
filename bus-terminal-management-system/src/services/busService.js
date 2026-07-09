import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const BUS_TYPE_FILTERS = ['All Types', 'AC', 'Non-AC', 'Sleeper'];
export const BUS_STATUS_FILTERS = ['All Statuses', 'Active', 'Maintenance', 'Inactive'];

export const getBuses = async ({ search = '', type = 'All Types', status = 'All Statuses', page = 1, pageSize = 8 } = {}) => {
  const params = { search, page, pageSize };
  if (status !== 'All Statuses') params.status = status;
  if (type === 'AC' || type === 'Non-AC') params.acType = type;
  if (type === 'Sleeper') params.seatType = type;
  const res = await apiClient.get('/buses', { params });
  return unwrapPaginated(res);
};

export const getBusById = async (id) => {
  const res = await apiClient.get(`/buses/${id}`);
  return unwrap(res);
};

export const createBus = async (data) => {
  const res = await apiClient.post('/buses', data);
  return unwrap(res);
};

export const updateBus = async (id, data) => {
  const res = await apiClient.patch(`/buses/${id}`, data);
  return unwrap(res);
};

export const deleteBus = async (id) => {
  const res = await apiClient.delete(`/buses/${id}`);
  return unwrap(res);
};

export const assignDriver = async (busId, driverId) => {
  const res = await apiClient.patch(`/buses/${busId}/assign-driver`, { driverId });
  return unwrap(res);
};

export const getFleetSummary = async () => {
  const res = await apiClient.get('/buses/stats');
  const raw = unwrap(res);
  return {
    total: raw.total ?? 0,
    byStatus: {
      Active: raw.Active ?? 0,
      Maintenance: raw.Maintenance ?? 0,
      Inactive: raw.Inactive ?? 0,
    },
  };
};

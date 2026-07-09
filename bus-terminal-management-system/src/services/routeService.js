import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const ROUTE_STATUS_FILTERS = ['All Statuses', 'Active', 'Suspended'];

export const getRoutes = async ({ search = '', status = 'All Statuses', region = 'All Regions', page = 1, pageSize = 8 } = {}) => {
  const params = { search, page, pageSize };
  if (status !== 'All Statuses') params.status = status;
  if (region !== 'All Regions') params.region = region;
  const res = await apiClient.get('/routes', { params });
  return unwrapPaginated(res);
};

export const getRouteOptions = async () => {
  const res = await apiClient.get('/routes', { params: { status: 'Active', pageSize: 100 } });
  const { items } = unwrapPaginated(res);
  return items.map((r) => ({
    id: r._id,
    label: `${r.code} — ${r.name} (${r.origin} → ${r.destination})`,
    name: r.name,
    origin: r.origin,
    destination: r.destination,
  }));
};

export const getRegions = async () => {
  const res = await apiClient.get('/routes', { params: { pageSize: 100 } });
  const { items } = unwrapPaginated(res);
  const regions = [...new Set(items.map((r) => r.region).filter(Boolean))];
  return ['All Regions', ...regions];
};

export const getRouteById = async (id) => {
  const res = await apiClient.get(`/routes/${id}`);
  return unwrap(res);
};

export const createRoute = async (data) => {
  const res = await apiClient.post('/routes', data);
  return unwrap(res);
};

export const updateRoute = async (id, data) => {
  const res = await apiClient.patch(`/routes/${id}`, data);
  return unwrap(res);
};

export const deleteRoute = async (id) => {
  const res = await apiClient.delete(`/routes/${id}`);
  return unwrap(res);
};

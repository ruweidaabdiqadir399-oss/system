import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const TRACKING_STATUS_FILTERS = ['All Statuses', 'On Time', 'Delayed', 'Offline'];

export const getLiveTracking = async ({ search = '', status = 'All Statuses', routeId, page = 1, pageSize = 8 } = {}) => {
  const params = {};
  if (search) params.search = search;
  if (status !== 'All Statuses') params.status = status;
  if (routeId) params.routeId = routeId;
  const res = await apiClient.get('/tracking', { params });
  const data = unwrap(res);
  // Backend returns an array, not paginated
  const items = Array.isArray(data) ? data : [];
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize),
  };
};

export const getTrackingByBus = async (busId) => {
  const res = await apiClient.get(`/tracking/${busId}`);
  return unwrap(res);
};

export const getTrackingBySchedule = async (scheduleId) => {
  // Backend doesn't have a dedicated scheduleId lookup — filter client-side from list
  const res = await apiClient.get('/tracking');
  const items = unwrap(res) ?? [];
  const entry = Array.isArray(items)
    ? items.find((t) => t.scheduleId === scheduleId)
    : null;
  if (!entry) throw new Error('No live tracking data for this trip.');
  return entry;
};

export const getRoutePath = async () => [];

export const getFleetOverview = async () => {
  const res = await apiClient.get('/tracking');
  const items = unwrap(res) ?? [];
  const arr = Array.isArray(items) ? items : [];
  const byStatus = arr.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});
  return { total: arr.length, byStatus };
};

export const updateTracking = async (busId, data) => {
  const res = await apiClient.patch(`/tracking/${busId}`, data);
  return unwrap(res);
};

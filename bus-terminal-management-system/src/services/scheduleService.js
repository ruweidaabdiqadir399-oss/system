import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const SCHEDULE_STATUS_FILTERS = [
  'All Statuses', 'Scheduled', 'Boarding', 'Departed',
  'In Transit', 'Delayed', 'Arrived', 'Completed', 'Cancelled',
];

export const getSchedules = async ({ search = '', status = 'All Statuses', routeId = 'all', busId = 'all', driverId = 'all', date = '', page = 1, pageSize = 8 } = {}) => {
  const params = { search, page, pageSize };
  if (status !== 'All Statuses') params.status = status;
  if (routeId !== 'all') params.routeId = routeId;
  if (busId !== 'all') params.busId = busId;
  if (driverId !== 'all') params.driverId = driverId;
  if (date) params.date = date;
  const res = await apiClient.get('/schedules', { params });
  return unwrapPaginated(res);
};

export const getScheduleById = async (id) => {
  const res = await apiClient.get(`/schedules/${id}`);
  return unwrap(res);
};

export const getSchedulesByDriver = async (driverId, { date = '' } = {}) => {
  const params = { driverId, pageSize: 50 };
  if (date) params.date = date;
  const res = await apiClient.get('/schedules', { params });
  const { items } = unwrapPaginated(res);
  return items;
};

export const searchTrips = async ({ search = '', date = '', page = 1, pageSize = 8 } = {}) => {
  const params = { search, page, pageSize };
  if (date) params.date = date;
  const res = await apiClient.get('/schedules', { params });
  return unwrapPaginated(res);
};

export const getScheduleSeatMap = async (scheduleId) => {
  const res = await apiClient.get(`/schedules/${scheduleId}/seats`);
  return unwrap(res);
};

export const createSchedule = async (data) => {
  const res = await apiClient.post('/schedules', data);
  return unwrap(res);
};

export const updateSchedule = async (id, data) => {
  const res = await apiClient.patch(`/schedules/${id}`, data);
  return unwrap(res);
};

export const updateScheduleStatus = async (id, status) => {
  const res = await apiClient.patch(`/schedules/${id}/status`, { status });
  return unwrap(res);
};

export const startTrip = async (id) => {
  const res = await apiClient.post(`/schedules/${id}/start`);
  return unwrap(res);
};

export const completeTrip = async (id) => {
  const res = await apiClient.post(`/schedules/${id}/complete`);
  return unwrap(res);
};

export const deleteSchedule = async (id) => {
  const res = await apiClient.delete(`/schedules/${id}`);
  return unwrap(res);
};

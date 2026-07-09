import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const getDrivers = async ({ search = '', status = 'all', page = 1, pageSize = 8 } = {}) => {
  const res = await apiClient.get('/drivers', { params: { search, status, page, pageSize } });
  return unwrapPaginated(res);
};

export const getDriverById = async (userId) => {
  const res = await apiClient.get(`/drivers/${userId}`);
  return unwrap(res);
};

export const getMyDriverProfile = async () => {
  const res = await apiClient.get('/drivers/me');
  return unwrap(res);
};

export const createDriverProfile = async (data) => {
  const res = await apiClient.post('/drivers', data);
  return unwrap(res);
};

export const updateDriver = async (userId, data) => {
  const res = await apiClient.patch(`/drivers/${userId}`, data);
  return unwrap(res);
};

export const updateMyDriverProfile = async (data) => {
  const res = await apiClient.patch('/drivers/me', data);
  return unwrap(res);
};

export const getMyBus = async () => {
  const res = await apiClient.get('/drivers/me/bus');
  return unwrap(res);
};

export const assignBusToDriver = async (userId, busId) => {
  const res = await apiClient.patch(`/drivers/${userId}/assign-bus`, { busId });
  return unwrap(res);
};

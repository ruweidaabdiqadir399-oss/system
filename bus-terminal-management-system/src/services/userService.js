import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const getUsers = async ({ search = '', role = 'all', status = 'all', page = 1, pageSize = 8 } = {}) => {
  const res = await apiClient.get('/users', { params: { search, role, status, page, pageSize } });
  return unwrapPaginated(res);
};

export const getUserById = async (id) => {
  const res = await apiClient.get(`/users/${id}`);
  return unwrap(res);
};

export const createUser = async (data) => {
  const res = await apiClient.post('/users', data);
  return unwrap(res);
};

export const updateUser = async (id, data) => {
  const res = await apiClient.patch(`/users/${id}`, data);
  return unwrap(res);
};

export const updateProfile = async (data) => {
  const res = await apiClient.patch('/users/profile', data);
  return unwrap(res);
};

export const uploadAvatar = async (file) => {
  const form = new FormData();
  form.append('avatar', file);
  const res = await apiClient.post('/users/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return unwrap(res);
};

export const deleteUser = async (id) => {
  const res = await apiClient.delete(`/users/${id}`);
  return unwrap(res);
};

export const getUserCounts = async () => {
  const res = await apiClient.get('/users/counts');
  return unwrap(res);
};

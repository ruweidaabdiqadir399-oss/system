import { apiClient, unwrap } from '../api/axiosClient';

export const login = async (credentials) => {
  const res = await apiClient.post('/auth/login', credentials);
  return unwrap(res);
};

export const register = async (data) => {
  const res = await apiClient.post('/auth/register', data);
  return unwrap(res);
};

export const logout = async (refreshToken) => {
  await apiClient.post('/auth/logout', { refreshToken });
};

export const getMe = async () => {
  const res = await apiClient.get('/auth/me');
  return unwrap(res);
};

export const changePassword = async ({ currentPassword, newPassword }) => {
  const res = await apiClient.patch('/auth/change-password', { currentPassword, newPassword });
  return unwrap(res);
};

export const forgotPassword = async (email) => {
  const res = await apiClient.post('/auth/forgot-password', { email });
  return unwrap(res);
};

export const resetPassword = async ({ token, password }) => {
  const res = await apiClient.post('/auth/reset-password', { token, password });
  return unwrap(res);
};
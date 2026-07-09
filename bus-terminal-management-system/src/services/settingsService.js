import { apiClient, unwrap } from '../api/axiosClient';

export const getSettings = async () => {
  const res = await apiClient.get('/settings');
  return unwrap(res);
};

export const updateSettings = async (section, data) => {
  const res = await apiClient.patch(`/settings/${section}`, data);
  return unwrap(res);
};

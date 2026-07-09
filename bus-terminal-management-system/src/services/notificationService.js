import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const getNotifications = async ({ page = 1, pageSize = 20 } = {}) => {
  const res = await apiClient.get('/notifications', { params: { page, pageSize } });
  const result = unwrapPaginated(res);
  return {
    items: result.items,
    unreadCount: result.items.filter((n) => !n.read).length,
    total: result.total,
  };
};

export const getUnreadCount = async () => {
  const res = await apiClient.get('/notifications/unread-count');
  return unwrap(res);
};

export const markAsRead = async (id) => {
  const res = await apiClient.patch(`/notifications/${id}/read`);
  return unwrap(res);
};

export const markAllAsRead = async () => {
  const res = await apiClient.patch('/notifications/read-all');
  return unwrap(res);
};

export const createNotification = async (data) => {
  const res = await apiClient.post('/notifications', data);
  return unwrap(res);
};

export const deleteNotification = async (id) => {
  const res = await apiClient.delete(`/notifications/${id}`);
  return unwrap(res);
};

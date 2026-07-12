import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const submitDriverRating = async ({ bookingId, rating, comment }) => {
  const res = await apiClient.post('/ratings', { bookingId, rating, comment });
  return unwrap(res);
};

export const checkBookingRating = async (bookingId) => {
  const res = await apiClient.get('/ratings/check', { params: { bookingId } });
  return unwrap(res);
};

export const getMyRatingSummary = async () => {
  const res = await apiClient.get('/ratings/my-summary');
  return unwrap(res);
};

export const getDriversSummary = async () => {
  const res = await apiClient.get('/ratings/drivers/summary');
  return unwrap(res);
};

export const getDriverRatings = async (driverId) => {
  const res = await apiClient.get(`/ratings/driver/${driverId}`);
  return unwrap(res);
};

export const getMyReviews = async () => {
  const res = await apiClient.get('/ratings/my-reviews');
  return unwrap(res);
};

export const getBusesSummary = async () => {
  const res = await apiClient.get('/ratings/buses/summary');
  return unwrap(res);
};

export const getAllReviews = async ({ search = '', page = 1, pageSize = 8 } = {}) => {
  const res = await apiClient.get('/ratings', { params: { search, page, pageSize } });
  return unwrapPaginated(res);
};

import { apiClient, unwrapPaginated } from '../api/axiosClient';

export const DATE_FILTER_OPTIONS = [
  { value: 'all',       label: 'All Time' },
  { value: 'today',     label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'this-week', label: 'This Week' },
  { value: 'custom',    label: 'Custom Date' },
];

export const getBoardingHistory = async ({
  search = '',
  dateFilter = 'all',
  date = '',
  busId = 'all',
  page = 1,
  pageSize = 10,
} = {}) => {
  const params = { search, dateFilter, page, pageSize };
  if (dateFilter === 'custom' && date) params.date = date;
  if (busId !== 'all') params.busId = busId;
  const res = await apiClient.get('/boarding', { params });
  return unwrapPaginated(res);
};

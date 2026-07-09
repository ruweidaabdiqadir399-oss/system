import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

// Transform backend dashboard stats into the shape the admin Dashboard page expects.
export const getDashboardStats = async () => {
  const res = await apiClient.get('/reports/dashboard');
  const raw = unwrap(res);

  return {
    totalUsers: { value: raw.users?.total ?? 0, change: null, trend: 'up' },
    activeBuses: {
      value: raw.buses?.Active ?? 0,
      total: raw.buses?.total ?? 0,
      label: `${raw.buses?.Maintenance ?? 0} in maintenance`,
    },
    totalRoutes: { value: raw.routes ?? 0, label: `${raw.schedulesToday ?? 0} trips today` },
    bookingsToday: { value: raw.bookings?.total ?? 0, change: null, trend: 'up' },
    dailyRevenue: { value: raw.totalRevenue ?? 0, change: null, trend: 'up' },
    avgOccupancy: { value: raw.avgOccupancy ?? 0, label: 'Across all active routes' },
    users: raw.users,
    buses: raw.buses,
    bookings: raw.bookings,
    routes: raw.routes,
    schedulesToday: raw.schedulesToday,
    totalRevenue: raw.totalRevenue,
    recentBookings: raw.recentBookings,
  };
};

// Returns [{ date, revenue, transactions }] mapped to { date, revenue, bookings } for charts.
export const getRevenueBookingTrend = async (period = '7d') => {
  const days = period === '1y' ? 365 : period === '30d' ? 30 : 7;
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  const res = await apiClient.get('/reports/revenue', {
    params: {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    },
  });
  const raw = unwrap(res) ?? [];
  return raw.map((d) => ({ date: d.date, revenue: d.revenue, bookings: d.transactions ?? 0 }));
};

// Returns route performance array mapped to the occupancy shape the dashboard table expects.
export const getTopRoutesOccupancy = async () => {
  const res = await apiClient.get('/reports/routes');
  const routes = unwrap(res) ?? [];
  return routes.map((r) => {
    const total = r.seatsBooked + r.seatsAvailable;
    const occupancy = total > 0 ? Math.round((r.seatsBooked / total) * 100) : 0;
    return {
      routeId: r.routeId,
      label: r.name,
      code: r.code,
      origin: r.origin,
      destination: r.destination,
      occupancy,
      status: 'Active',
      revenue: r.revenue,
      bookingCount: r.bookingCount,
    };
  });
};

// Summary stats for the Reports page (different shape from Dashboard stats).
export const getReportSummary = async () => {
  const res = await apiClient.get('/reports/dashboard');
  const raw = unwrap(res);
  return {
    totalRevenue: { value: raw.totalRevenue ?? 0, change: null, trend: 'up' },
    totalBookings: { value: raw.bookings?.total ?? 0, change: null, trend: 'up' },
    activePassengers: { value: raw.users?.customer ?? 0, change: null, trend: 'up' },
    routeEfficiency: { value: 0, change: null, trend: 'up' },
  };
};

export const getRevenueVsBookingsTrend = async (period = '30d') => getRevenueBookingTrend(period);

export const getTopRoutePerformance = async () => {
  const res = await apiClient.get('/reports/routes');
  const routes = unwrap(res) ?? [];
  return routes.map((r) => ({
    routeId: r.routeId,
    name: r.name,
    code: r.code,
    origin: r.origin,
    destination: r.destination,
    revenue: r.revenue,
    bookingCount: r.bookingCount,
    onTimePct: 0,
    trend: 0,
  }));
};

export const getRecentReports = async () => [];

export const getPassengerGrowth = async () => [];

export const getBookingStatusDistribution = async () => {
  const stats = await getDashboardStats();
  const { bookings = {} } = stats;

  const COLORS = {
    Completed: '#3B82F6', // Info
    Confirmed: '#22C55E', // Success
    Pending:   '#F59E0B', // Warning
    Cancelled: '#EF4444', // Danger
  };

  return ['Completed', 'Confirmed', 'Pending', 'Cancelled']
    .filter((k) => bookings[k] != null)
    .map((k) => ({ label: k, value: bookings[k] ?? 0, color: COLORS[k] ?? '#9CA3AF' }));
};

export const getFleetStatusDistribution = async () => {
  const stats = await getDashboardStats();
  const { buses = {} } = stats;

  const COLORS = {
    Active:      '#22C55E', // Success
    Maintenance: '#F59E0B', // Warning
    Inactive:    '#EF4444', // Danger
    Reserved:    '#3B82F6', // Info
  };

  return ['Active', 'Maintenance', 'Inactive', 'Reserved']
    .filter((k) => buses[k] != null)
    .map((k) => ({ label: k, value: buses[k] ?? 0, color: COLORS[k] ?? '#9CA3AF' }));
};

export const exportReport = async ({ type = 'Revenue', format = 'PDF' } = {}) => {
  const id = `RPT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  return {
    id,
    type,
    format,
    fileName: `${type.replace(/\s+/g, '_')}_Report_${id}.${format.toLowerCase()}`,
    generatedAt: new Date().toISOString(),
    status: 'Ready',
  };
};

export const getAuditLogs = async ({ action = 'all', entity = 'all', userId, page = 1, pageSize = 20 } = {}) => {
  const params = { action, entity, page, pageSize };
  if (userId) params.userId = userId;
  const res = await apiClient.get('/reports/audit-logs', { params });
  return unwrapPaginated(res);
};

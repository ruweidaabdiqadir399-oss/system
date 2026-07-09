// High-level KPI tiles shown on the Admin overview dashboard.
export const dashboardStats = {
  totalUsers: { value: 14205, change: 12, trend: 'up', label: 'Active accounts this month' },
  activeBuses: { value: 248, total: 260, label: '12 currently in maintenance' },
  totalRoutes: { value: 84, label: 'Covering 14 regions' },
  bookingsToday: { value: 3192, change: 5, trend: 'up', label: 'Across all schedules' },
  dailyRevenue: { value: 42500, change: -2, trend: 'down', label: 'Estimated total' },
  avgOccupancy: { value: 78, label: 'Fleet-wide capacity utilization' },
};

// Revenue & Booking trend chart (Dashboard overview)
export const revenueBookingTrend = {
  '7d': [
    { label: 'Mon', revenue: 28500, bookings: 1850 },
    { label: 'Tue', revenue: 31200, bookings: 2010 },
    { label: 'Wed', revenue: 26800, bookings: 1720 },
    { label: 'Thu', revenue: 35400, bookings: 2280 },
    { label: 'Fri', revenue: 42500, bookings: 3192 },
    { label: 'Sat', revenue: 48900, bookings: 3640 },
    { label: 'Sun', revenue: 39700, bookings: 2950 },
  ],
  '30d': Array.from({ length: 30 }, (_, i) => ({
    label: `${i + 1}`,
    revenue: Math.round(24000 + Math.sin(i / 3) * 8000 + (i % 7 === 5 ? 9000 : 0)),
    bookings: Math.round(1600 + Math.cos(i / 4) * 600 + (i % 7 === 5 ? 700 : 0)),
  })),
  '1y': [
    { label: 'Jan', revenue: 820000, bookings: 58000 },
    { label: 'Feb', revenue: 790000, bookings: 55200 },
    { label: 'Mar', revenue: 910000, bookings: 63100 },
    { label: 'Apr', revenue: 940000, bookings: 65800 },
    { label: 'May', revenue: 1010000, bookings: 70200 },
    { label: 'Jun', revenue: 1080000, bookings: 74500 },
    { label: 'Jul', revenue: 1150000, bookings: 79800 },
    { label: 'Aug', revenue: 1120000, bookings: 77200 },
    { label: 'Sep', revenue: 1040000, bookings: 71600 },
    { label: 'Oct', revenue: 990000, bookings: 68400 },
    { label: 'Nov', revenue: 1060000, bookings: 73900 },
    { label: 'Dec', revenue: 1230000, bookings: 86200 },
  ],
};

// Top routes by occupancy (Dashboard overview table)
export const topRoutesOccupancy = [
  { routeId: 'RT-001', label: 'NY - Boston (Exp)', code: 'Route #402', occupancy: 92, status: 'On Time' },
  { routeId: 'RT-002', label: 'Chi - Detroit', code: 'Route #118', occupancy: 88, status: 'On Time' },
  { routeId: 'RT-003', label: 'LA - SF (Night)', code: 'Route #805', occupancy: 85, status: 'On Time' },
  { routeId: 'RT-004', label: 'Mia - Orl', code: 'Delay Rep.', occupancy: 42, status: 'Delayed' },
];

// Reports & Analytics page summary cards
export const reportSummary = {
  totalRevenue: { value: 124500, change: 8.2, trend: 'up' },
  totalBookings: { value: 8432, change: 12.4, trend: 'up' },
  activePassengers: { value: 45210, change: 3.1, trend: 'up' },
  routeEfficiency: { value: 94.2, change: -0.8, trend: 'down' },
};

// Revenue vs Bookings trend on the Reports page
export const revenueVsBookingsTrend = {
  '30d': Array.from({ length: 30 }, (_, i) => ({
    label: `Day ${i + 1}`,
    revenue: Math.round(3200 + Math.sin(i / 2.5) * 1100 + (i % 6 === 0 ? 1200 : 0)),
    bookings: Math.round(220 + Math.cos(i / 3) * 70 + (i % 6 === 0 ? 90 : 0)),
  })),
  quarter: [
    { label: 'Wk 1', revenue: 26200, bookings: 1820 },
    { label: 'Wk 2', revenue: 28900, bookings: 1990 },
    { label: 'Wk 3', revenue: 31100, bookings: 2150 },
    { label: 'Wk 4', revenue: 27800, bookings: 1900 },
    { label: 'Wk 5', revenue: 33500, bookings: 2310 },
    { label: 'Wk 6', revenue: 35900, bookings: 2480 },
    { label: 'Wk 7', revenue: 32400, bookings: 2240 },
    { label: 'Wk 8', revenue: 38700, bookings: 2670 },
    { label: 'Wk 9', revenue: 41200, bookings: 2840 },
    { label: 'Wk 10', revenue: 39800, bookings: 2750 },
    { label: 'Wk 11', revenue: 43500, bookings: 3010 },
    { label: 'Wk 12', revenue: 45900, bookings: 3170 },
  ],
  ytd: [
    { label: 'Jan', revenue: 102000, bookings: 7100 },
    { label: 'Feb', revenue: 98500, bookings: 6850 },
    { label: 'Mar', revenue: 112400, bookings: 7780 },
    { label: 'Apr', revenue: 118900, bookings: 8230 },
    { label: 'May', revenue: 121300, bookings: 8390 },
    { label: 'Jun', revenue: 124500, bookings: 8432 },
  ],
};

// Top Route Performance table on Reports page
export const topRoutePerformance = [
  { routeId: 'RT-001', name: 'NY-BOS Express', code: 'RTE-104', onTimePct: 98, revenue: 45200, trend: 5 },
  { routeId: 'RT-002', name: 'CHI-DET Direct', code: 'RTE-201', onTimePct: 95, revenue: 38900, trend: 2 },
  { routeId: 'RT-003', name: 'SF-LA Coastal', code: 'RTE-305', onTimePct: 91, revenue: 32100, trend: -1 },
  { routeId: 'RT-004', name: 'MIA-ORL Shuttle', code: 'RTE-410', onTimePct: 88, revenue: 28400, trend: 8 },
  { routeId: 'RT-009', name: 'NY-Washington Express', code: 'RTE-905', onTimePct: 93, revenue: 24600, trend: 4 },
];

// Recent generated report files
export const recentReports = [
  {
    id: 'RPT-2026-1042',
    dateGenerated: '2026-06-13T08:30:00',
    type: 'Revenue',
    generatedBy: 'Admin System',
    status: 'Ready',
  },
  {
    id: 'RPT-2026-1041',
    dateGenerated: '2026-06-12T09:15:00',
    type: 'Passenger',
    generatedBy: 'Amara Whitfield',
    status: 'Ready',
  },
  {
    id: 'RPT-2026-1040',
    dateGenerated: '2026-06-12T14:45:00',
    type: 'Route Evaluation',
    generatedBy: 'Daniel Cho',
    status: 'Processing',
  },
  {
    id: 'RPT-2026-1039',
    dateGenerated: '2026-06-11T11:00:00',
    type: 'Revenue',
    generatedBy: 'Admin System',
    status: 'Ready',
  },
  {
    id: 'RPT-2026-1038',
    dateGenerated: '2026-06-10T17:25:00',
    type: 'Booking',
    generatedBy: 'Admin System',
    status: 'Ready',
  },
];

// Passenger growth for analytics chart
export const passengerGrowth = [
  { label: 'Jan', passengers: 31200 },
  { label: 'Feb', passengers: 29800 },
  { label: 'Mar', passengers: 34100 },
  { label: 'Apr', passengers: 36700 },
  { label: 'May', passengers: 39900 },
  { label: 'Jun', passengers: 45210 },
];

// Booking status distribution (used in pie/donut charts)
export const bookingStatusDistribution = [
  { label: 'Confirmed', value: 68, color: '#22C55E' },
  { label: 'Pending', value: 14, color: '#F59E0B' },
  { label: 'Completed', value: 12, color: '#3B82F6' },
  { label: 'Cancelled', value: 6, color: '#EF4444' },
];

// Fleet status distribution
export const fleetStatusDistribution = [
  { label: 'Active', value: 8, color: '#22C55E' },
  { label: 'Maintenance', value: 2, color: '#F59E0B' },
  { label: 'Inactive', value: 2, color: '#EF4444' },
];

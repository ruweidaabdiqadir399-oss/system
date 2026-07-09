const asyncHandler = require('../utils/asyncHandler');
const { ok, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { User, Bus, Route, Schedule, Booking, Payment, AuditLog } = require('../models');
const { ROLES, BUS_STATUS, BOOKING_STATUS, PAYMENT_STATUS } = require('../constants');

const todayString = () => new Date().toISOString().slice(0, 10);

// @desc    Get aggregate statistics for the admin/staff dashboard
// @route   GET /api/v1/reports/dashboard
// @access  Private (admin, staff)
const getDashboardStats = asyncHandler(async (req, res) => {
  const [userGroups, busGroups, bookingGroups, routeCount, schedulesToday, revenueAgg, recentBookings, occupancyAgg] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Bus.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Route.countDocuments(),
    Schedule.countDocuments({ date: todayString() }),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Booking.find().sort('-createdAt').limit(5),
    Schedule.aggregate([
      { $match: { status: { $nin: ['Completed', 'Cancelled'] } } },
      { $group: { _id: null, totalSeats: { $sum: '$totalSeats' }, bookedSeats: { $sum: '$bookedSeats' } } },
    ]),
  ]);

  const users = { [ROLES.ADMIN]: 0, [ROLES.STAFF]: 0, [ROLES.DRIVER]: 0, [ROLES.CUSTOMER]: 0, total: 0 };
  userGroups.forEach((g) => {
    users[g._id] = g.count;
    users.total += g.count;
  });

  const buses = { [BUS_STATUS.ACTIVE]: 0, [BUS_STATUS.MAINTENANCE]: 0, [BUS_STATUS.INACTIVE]: 0, total: 0 };
  busGroups.forEach((g) => {
    buses[g._id] = g.count;
    buses.total += g.count;
  });

  const bookings = {
    [BOOKING_STATUS.CONFIRMED]: 0,
    [BOOKING_STATUS.PENDING]: 0,
    [BOOKING_STATUS.CANCELLED]: 0,
    [BOOKING_STATUS.COMPLETED]: 0,
    total: 0,
  };
  bookingGroups.forEach((g) => {
    bookings[g._id] = g.count;
    bookings.total += g.count;
  });

  const occ = occupancyAgg[0];
  const avgOccupancy = occ && occ.totalSeats > 0
    ? Math.round((occ.bookedSeats / occ.totalSeats) * 100)
    : 0;

  ok(res, {
    users,
    buses,
    bookings,
    routes: routeCount,
    schedulesToday,
    totalRevenue: revenueAgg[0]?.total || 0,
    recentBookings,
    avgOccupancy,
  }, 'Dashboard statistics fetched successfully.');
});

// @desc    Get daily revenue totals for completed payments
// @route   GET /api/v1/reports/revenue
// @access  Private (admin, staff)
const getRevenueReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  const match = { status: PAYMENT_STATUS.COMPLETED };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = new Date(from);
    if (to) match.date.$lte = new Date(to);
  }

  const data = await Payment.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        revenue: { $sum: '$amount' },
        transactions: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { _id: 0, date: '$_id', revenue: 1, transactions: 1 } },
  ]);

  ok(res, data, 'Revenue report fetched successfully.');
});

// @desc    Get booking and revenue performance per route
// @route   GET /api/v1/reports/routes
// @access  Private (admin, staff)
const getRoutePerformance = asyncHandler(async (req, res) => {
  const data = await Schedule.aggregate([
    {
      $lookup: {
        from: 'bookings',
        localField: '_id',
        foreignField: 'scheduleId',
        as: 'bookings',
      },
    },
    {
      $group: {
        _id: '$routeId',
        scheduleCount: { $sum: 1 },
        bookingCount: { $sum: { $size: '$bookings' } },
        seatsBooked: { $sum: '$bookedSeats' },
        seatsAvailable: { $sum: { $subtract: ['$totalSeats', '$bookedSeats'] } },
        revenue: {
          $sum: {
            $sum: {
              $map: {
                input: '$bookings',
                as: 'b',
                in: {
                  $cond: [{ $ne: ['$$b.status', BOOKING_STATUS.CANCELLED] }, '$$b.totalAmount', 0],
                },
              },
            },
          },
        },
      },
    },
    {
      $lookup: {
        from: 'routes',
        localField: '_id',
        foreignField: '_id',
        as: 'route',
      },
    },
    { $unwind: '$route' },
    {
      $project: {
        _id: 0,
        routeId: '$_id',
        code: '$route.code',
        name: '$route.name',
        origin: '$route.origin',
        destination: '$route.destination',
        scheduleCount: 1,
        bookingCount: 1,
        seatsBooked: 1,
        seatsAvailable: 1,
        revenue: 1,
      },
    },
    { $sort: { revenue: -1 } },
  ]);

  ok(res, data, 'Route performance report fetched successfully.');
});

// @desc    List audit log entries
// @route   GET /api/v1/reports/audit-logs
// @access  Private (admin)
const getAuditLogs = asyncHandler(async (req, res) => {
  const { action = 'all', entity = 'all', userId, page, pageSize } = req.query;

  const filter = {};
  if (action !== 'all') filter.action = action;
  if (entity !== 'all') filter.entity = entity;
  if (userId) filter.userId = userId;

  const result = await paginate(AuditLog, filter, { page, pageSize, sort: '-createdAt' });
  paginated(res, result, 'Audit logs fetched successfully.');
});

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getRoutePerformance,
  getAuditLogs,
};

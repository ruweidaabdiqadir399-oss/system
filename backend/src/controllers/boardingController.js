const asyncHandler = require('../utils/asyncHandler');
const { paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { BoardingLog } = require('../models');

// Build a boardedAt range from the date filter query param.
const buildDateFilter = (dateFilter, date) => {
  const now = new Date();

  if (dateFilter === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { boardedAt: { $gte: start } };
  }

  if (dateFilter === 'yesterday') {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(0, 0, 0, 0);
    return { boardedAt: { $gte: start, $lt: end } };
  }

  if (dateFilter === 'this-week') {
    const start = new Date(now);
    const day = start.getDay(); // 0 = Sunday
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setDate(start.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    return { boardedAt: { $gte: start } };
  }

  if (dateFilter === 'custom' && date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return { boardedAt: { $gte: start, $lte: end } };
  }

  return {};
};

// @desc    List boarding history with search and date filters
// @route   GET /api/v1/boarding
// @access  Private (admin, staff)
const getBoardingHistory = asyncHandler(async (req, res) => {
  const { search = '', dateFilter = 'all', date = '', busId = 'all', page, pageSize } = req.query;

  const filter = {};

  if (search.trim()) {
    const regex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { ticketId: regex },
      { passengerName: regex },
      { busNumber: regex },
    ];
  }

  if (busId !== 'all') filter.busId = busId;

  Object.assign(filter, buildDateFilter(dateFilter, date));

  const result = await paginate(BoardingLog, filter, {
    page,
    pageSize,
    sort: '-boardedAt',
  });

  paginated(res, result, 'Boarding history fetched successfully.');
});

module.exports = { getBoardingHistory };

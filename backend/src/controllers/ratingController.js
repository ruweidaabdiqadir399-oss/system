const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const generateId = require('../utils/generateId');
const { Booking, Schedule, Ticket, Driver, User, DriverRating } = require('../models');
const { ROLES, BOOKING_PAYMENT_STATUS, TICKET_STATUS, SCHEDULE_STATUS } = require('../constants');

// @desc    Submit a driver rating for a completed booking
// @route   POST /api/v1/ratings
// @access  Private (customer)
const submitRating = asyncHandler(async (req, res) => {
  const { bookingId, rating, comment = '' } = req.body;

  if (!bookingId) throw ApiError.badRequest('bookingId is required.');
  if (!rating || rating < 1 || rating > 5) throw ApiError.badRequest('Rating must be between 1 and 5.');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.notFound('Booking not found.');

  if (booking.customerId !== req.user._id) {
    throw ApiError.forbidden('You can only rate your own bookings.');
  }

  if (booking.paymentStatus !== BOOKING_PAYMENT_STATUS.PAID) {
    throw ApiError.badRequest('Only paid bookings can be rated.');
  }

  const boardedTicket = await Ticket.findOne({ bookingId, status: TICKET_STATUS.BOARDED });
  if (!boardedTicket) {
    throw ApiError.badRequest('Rating is only allowed after boarding the bus.');
  }

  const schedule = await Schedule.findById(booking.scheduleId);
  if (!schedule) throw ApiError.notFound('Schedule not found.');

  if (schedule.status !== SCHEDULE_STATUS.COMPLETED) {
    throw ApiError.badRequest('You can only rate a driver after the trip is completed.');
  }

  if (!schedule.driverId) {
    throw ApiError.badRequest('No driver is assigned to this trip.');
  }

  const existing = await DriverRating.findOne({ bookingId });
  if (existing) {
    throw ApiError.conflict('You have already rated the driver for this booking.');
  }

  const _id = await generateId('RTG', 'RTG-', 10001, 5);
  const newRating = await DriverRating.create({
    _id,
    driverId: schedule.driverId,
    customerId: req.user._id,
    bookingId,
    scheduleId: schedule._id,
    rating: Math.round(rating),
    comment: comment.trim(),
    reviewDate: new Date(),
  });

  // Update the driver's average rating
  const allRatings = await DriverRating.find({ driverId: schedule.driverId });
  const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
  await Driver.findOneAndUpdate({ userId: schedule.driverId }, { rating: Math.round(avg * 10) / 10 });

  created(res, newRating, 'Rating submitted successfully.');
});

// @desc    Check if a customer has already rated a booking
// @route   GET /api/v1/ratings/check?bookingId=xxx
// @access  Private (customer)
const checkRating = asyncHandler(async (req, res) => {
  const { bookingId } = req.query;
  if (!bookingId) throw ApiError.badRequest('bookingId is required.');

  const existing = await DriverRating.findOne({ bookingId, customerId: req.user._id });
  ok(res, { rated: Boolean(existing), rating: existing ?? null }, 'Rating check completed.');
});

// @desc    Get the authenticated driver's own rating summary
// @route   GET /api/v1/ratings/my-summary
// @access  Private (driver)
const getMyRatingSummary = asyncHandler(async (req, res) => {
  const ratings = await DriverRating.find({ driverId: req.user._id });
  const totalReviews = ratings.length;
  const avgRating = totalReviews
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
    : 0;
  ok(res, { avgRating, totalReviews }, 'Rating summary fetched successfully.');
});

// @desc    Get rating summaries for all drivers (keyed by driverId)
// @route   GET /api/v1/ratings/drivers/summary
// @access  Private (admin)
const getDriversSummary = asyncHandler(async (req, res) => {
  const agg = await DriverRating.aggregate([
    {
      $group: {
        _id: '$driverId',
        totalReviews: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  const summary = {};
  agg.forEach((row) => {
    summary[row._id] = {
      avgRating: Math.round(row.avgRating * 10) / 10,
      totalReviews: row.totalReviews,
    };
  });
  ok(res, summary, 'Driver rating summaries fetched successfully.');
});

// @desc    Get all reviews for a specific driver (with customer names)
// @route   GET /api/v1/ratings/driver/:driverId
// @access  Private (admin)
const getDriverRatings = asyncHandler(async (req, res) => {
  const { driverId } = req.params;

  const driver = await User.findById(driverId);
  if (!driver) throw ApiError.notFound('Driver not found.');

  const ratings = await DriverRating.find({ driverId })
    .sort({ reviewDate: -1 });

  const customerIds = [...new Set(ratings.map((r) => r.customerId))];
  const customers = await User.find({ _id: { $in: customerIds } }).select('name');
  const customerMap = Object.fromEntries(customers.map((c) => [c._id, c.name]));

  const totalReviews = ratings.length;
  const avgRating = totalReviews
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / totalReviews) * 10) / 10
    : 0;

  const reviews = ratings.map((r) => ({
    _id: r._id,
    rating: r.rating,
    comment: r.comment,
    reviewDate: r.reviewDate,
    customerName: customerMap[r.customerId] ?? 'Customer',
  }));

  ok(res, { driverName: driver.name, avgRating, totalReviews, reviews }, 'Driver ratings fetched successfully.');
});

module.exports = { submitRating, checkRating, getMyRatingSummary, getDriversSummary, getDriverRatings };

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const generateId = require('../utils/generateId');
const { Booking, Schedule, Ticket, Driver, Bus, User, DriverRating } = require('../models');
const { ROLES, BOOKING_PAYMENT_STATUS, TICKET_STATUS, SCHEDULE_STATUS } = require('../constants');

const REVIEW_POPULATE = [
  { path: 'driverId', select: 'name' },
  { path: 'customerId', select: 'name' },
  { path: 'busId', select: 'busNumber model' },
  { path: 'scheduleId', populate: { path: 'routeId', select: 'name origin destination' } },
];

const enrichReview = (doc) => {
  const r = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  const driver = r.driverId && typeof r.driverId === 'object' ? r.driverId : null;
  const customer = r.customerId && typeof r.customerId === 'object' ? r.customerId : null;
  const bus = r.busId && typeof r.busId === 'object' ? r.busId : null;
  const schedule = r.scheduleId && typeof r.scheduleId === 'object' ? r.scheduleId : null;
  const route = schedule?.routeId && typeof schedule.routeId === 'object' ? schedule.routeId : null;
  return {
    ...r,
    driverId: driver?._id ?? r.driverId,
    driverName: driver?.name ?? 'Driver',
    customerId: customer?._id ?? r.customerId,
    customerName: customer?.name ?? 'Customer',
    busId: bus?._id ?? r.busId,
    busNumber: bus?.busNumber ?? null,
    scheduleId: schedule?._id ?? r.scheduleId,
    routeName: route?.name ?? null,
    routeOrigin: route?.origin ?? null,
    routeDestination: route?.destination ?? null,
  };
};

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
    busId: schedule.busId,
    customerId: req.user._id,
    bookingId,
    scheduleId: schedule._id,
    rating: Math.round(rating),
    comment: comment.trim(),
    reviewDate: new Date(),
  });

  // Update the driver's average rating
  const driverRatings = await DriverRating.find({ driverId: schedule.driverId });
  const driverAvg = driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length;
  await Driver.findOneAndUpdate({ userId: schedule.driverId }, { rating: Math.round(driverAvg * 10) / 10 });

  // Update the bus's average rating
  const busRatings = await DriverRating.find({ busId: schedule.busId });
  const busAvg = busRatings.reduce((sum, r) => sum + r.rating, 0) / busRatings.length;
  await Bus.findByIdAndUpdate(schedule.busId, { rating: Math.round(busAvg * 10) / 10 });

  const populated = await DriverRating.findById(newRating._id).populate(REVIEW_POPULATE);
  created(res, enrichReview(populated), 'Rating submitted successfully.');
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

// @desc    Get the authenticated customer's own submitted reviews
// @route   GET /api/v1/ratings/my-reviews
// @access  Private (customer)
const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await DriverRating.find({ customerId: req.user._id })
    .sort({ reviewDate: -1 })
    .populate(REVIEW_POPULATE);

  ok(res, reviews.map(enrichReview), 'Your reviews were fetched successfully.');
});

// @desc    Get rating summaries for all buses (keyed by busId)
// @route   GET /api/v1/ratings/buses/summary
// @access  Private (admin)
const getBusesSummary = asyncHandler(async (req, res) => {
  const agg = await DriverRating.aggregate([
    {
      $group: {
        _id: '$busId',
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
  ok(res, summary, 'Bus rating summaries fetched successfully.');
});

// @desc    List every review across all trips, drivers, and buses
// @route   GET /api/v1/ratings
// @access  Private (admin)
const getAllReviews = asyncHandler(async (req, res) => {
  const { search = '', page, pageSize } = req.query;

  const filter = { ...buildSearchFilter(search, ['comment', '_id']) };

  const result = await paginate(DriverRating, filter, {
    page,
    pageSize,
    sort: '-reviewDate',
    populate: REVIEW_POPULATE,
  });

  paginated(res, { ...result, items: result.items.map(enrichReview) }, 'Reviews fetched successfully.');
});

module.exports = {
  submitRating,
  checkRating,
  getMyRatingSummary,
  getDriversSummary,
  getDriverRatings,
  getMyReviews,
  getBusesSummary,
  getAllReviews,
};

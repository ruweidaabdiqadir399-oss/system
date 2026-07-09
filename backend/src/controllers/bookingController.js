const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const generateId = require('../utils/generateId');
const logAudit = require('../utils/auditLog');
const { Booking, Schedule, Route, User, Ticket, Payment } = require('../models');
const {
  ROLES,
  BOOKING_STATUS,
  BOOKING_PAYMENT_STATUS,
  PAYMENT_STATUS,
  TICKET_STATUS,
  SCHEDULE_STATUS,
  PAYMENT_METHODS,
  AUDIT_ACTIONS,
} = require('../constants');

const NOT_BOOKABLE_STATUSES = [
  SCHEDULE_STATUS.CANCELLED,
  SCHEDULE_STATUS.COMPLETED,
  SCHEDULE_STATUS.DEPARTED,
  SCHEDULE_STATUS.IN_TRANSIT,
  SCHEDULE_STATUS.ARRIVED,
];

const enrichBooking = (booking) => {
  const b = typeof booking.toJSON === 'function' ? booking.toJSON() : booking;
  const schedule = b.scheduleId && typeof b.scheduleId === 'object' ? b.scheduleId : null;
  const route = schedule?.routeId && typeof schedule.routeId === 'object' ? schedule.routeId : null;
  const customer = b.customerId && typeof b.customerId === 'object' ? b.customerId : null;

  return {
    ...b,
    scheduleId: schedule?._id ?? b.scheduleId,
    customerId: customer?._id ?? b.customerId,
    schedule: schedule
      ? {
          id: schedule._id,
          date: schedule.date,
          departureTime: schedule.departureTime,
          arrivalTime: schedule.arrivalTime,
          status: schedule.status,
          gate: schedule.gate,
          totalSeats: schedule.totalSeats,
          bookedSeats: schedule.bookedSeats,
          availableSeats: schedule.availableSeats,
        }
      : null,
    route: route
      ? {
          id: route._id,
          code: route.code,
          name: route.name,
          origin: route.origin,
          destination: route.destination,
          fare: route.fare,
          durationMinutes: route.durationMinutes,
        }
      : null,
    customerName: customer?.name ?? 'Unknown',
    customerEmail: customer?.email ?? '',
  };
};

const BOOKING_POPULATE = [
  { path: 'scheduleId', populate: { path: 'routeId' } },
  { path: 'customerId', select: 'name email' },
];

// @desc    List bookings (own bookings for customers, all for admin/staff)
// @route   GET /api/v1/bookings
// @access  Private
const getBookings = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', scheduleId = 'all', customerId, page, pageSize } = req.query;

  const filter = { ...buildSearchFilter(search, ['_id']) };
  if (status !== 'all') filter.status = status;
  if (scheduleId !== 'all') filter.scheduleId = scheduleId;

  if (req.user.role === ROLES.CUSTOMER) {
    filter.customerId = req.user._id;
  } else if (customerId) {
    filter.customerId = customerId;
  }

  const result = await paginate(Booking, filter, {
    page,
    pageSize,
    sort: '-createdAt',
    populate: BOOKING_POPULATE,
  });

  const enriched = result.items.map(enrichBooking);
  paginated(res, { ...result, items: enriched }, 'Bookings fetched successfully.');
});

// @desc    Get a single booking by ID
// @route   GET /api/v1/bookings/:id
// @access  Private
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate(BOOKING_POPULATE);
  if (!booking) throw ApiError.notFound('Booking not found.');

  if (req.user.role === ROLES.CUSTOMER && booking.customerId?._id !== req.user._id) {
    throw ApiError.forbidden('You can only view your own bookings.');
  }

  ok(res, enrichBooking(booking), 'Booking fetched successfully.');
});

// @desc    Create a booking and reserve seats on a schedule
// @route   POST /api/v1/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const { scheduleId, seatNumbers, passengers: passengerInput, paymentMethod } = req.body;

  const schedule = await Schedule.findById(scheduleId);
  if (!schedule) throw ApiError.badRequest('No schedule was found with that ID.');

  if (NOT_BOOKABLE_STATUSES.includes(schedule.status)) {
    throw ApiError.conflict(`This schedule is ${schedule.status} and is no longer accepting bookings.`);
  }

  let customerId = req.user._id;
  if (req.user.role !== ROLES.CUSTOMER && req.body.customerId) {
    const customerLookup = await User.findOne({ _id: req.body.customerId, role: ROLES.CUSTOMER });
    if (!customerLookup) throw ApiError.badRequest('No customer was found with that ID.');
    customerId = customerLookup._id;
  }
  const customer = await User.findById(customerId);
  if (!customer) throw ApiError.badRequest('No customer was found with that ID.');

  const uniqueSeats = new Set(seatNumbers);
  if (uniqueSeats.size !== seatNumbers.length) {
    throw ApiError.badRequest('Seat numbers must be unique.');
  }

  // Seats held by other pending-payment or confirmed bookings are treated as
  // taken to prevent double-booking.
  const existingBookings = await Booking.find({
    scheduleId,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] },
  }).select('seatNumbers');
  const takenSeats = new Set(existingBookings.flatMap((b) => b.seatNumbers));
  const conflictSeat = seatNumbers.find((seat) => takenSeats.has(seat));
  if (conflictSeat) {
    throw ApiError.conflict(`Seat ${conflictSeat} is already booked for this schedule.`);
  }
  if (seatNumbers.length > schedule.availableSeats) {
    throw ApiError.conflict('Not enough available seats remain for this schedule.');
  }

  const route = await Route.findById(schedule.routeId);
  if (!route) throw ApiError.badRequest('Route for this schedule no longer exists.');
  const totalAmount = route.fare * seatNumbers.length;

  const passengers = passengerInput?.length
    ? passengerInput
    : seatNumbers.map((seatNumber) => ({ name: customer.name, age: 30, gender: 'Other', seatNumber }));

  const _id = await generateId('BK', 'BK-', 100015, 6);

  const booking = await Booking.create({
    _id,
    scheduleId,
    customerId,
    seatNumbers,
    passengers,
    totalAmount,
    paymentMethod: paymentMethod || PAYMENT_METHODS[0],
    status: BOOKING_STATUS.PENDING,
    paymentStatus: BOOKING_PAYMENT_STATUS.PENDING,
  });

  await Schedule.findByIdAndUpdate(scheduleId, { $inc: { bookedSeats: seatNumbers.length } });
  await User.findByIdAndUpdate(customerId, { $inc: { totalBookings: 1 } });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'Booking',
    entityId: booking._id,
    details: { scheduleId, seatNumbers, totalAmount },
    req,
  });

  const populated = await Booking.findById(booking._id).populate(BOOKING_POPULATE);
  created(res, enrichBooking(populated), 'Booking created successfully.');
});

// @desc    Update a booking's status (admin/staff)
// @route   PATCH /api/v1/bookings/:id/status
// @access  Private (admin, staff)
const updateBookingStatus = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found.');

  const { status } = req.body;
  if (status === BOOKING_STATUS.CANCELLED) {
    throw ApiError.badRequest('Use the cancel endpoint to cancel a booking.');
  }

  booking.status = status;
  await booking.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'Booking',
    entityId: booking._id,
    details: { status },
    req,
  });

  const populated = await Booking.findById(booking._id).populate(BOOKING_POPULATE);
  ok(res, enrichBooking(populated), 'Booking status updated successfully.');
});

// @desc    Cancel a booking, freeing its seats and tickets
// @route   PATCH /api/v1/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) throw ApiError.notFound('Booking not found.');

  if (req.user.role === ROLES.CUSTOMER && booking.customerId !== req.user._id) {
    throw ApiError.forbidden('You can only cancel your own bookings.');
  }
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw ApiError.badRequest('This booking is already cancelled.');
  }
  if (booking.status === BOOKING_STATUS.COMPLETED) {
    throw ApiError.badRequest('Completed bookings cannot be cancelled.');
  }

  booking.status = BOOKING_STATUS.CANCELLED;
  if (booking.paymentStatus === BOOKING_PAYMENT_STATUS.PAID) {
    booking.paymentStatus = BOOKING_PAYMENT_STATUS.REFUNDED;
    await Payment.updateMany(
      { bookingId: booking._id, status: PAYMENT_STATUS.COMPLETED },
      { status: PAYMENT_STATUS.REFUNDED }
    );
  }
  await booking.save();

  await Schedule.findByIdAndUpdate(booking.scheduleId, { $inc: { bookedSeats: -booking.seatNumbers.length } });
  await Ticket.updateMany({ bookingId: booking._id }, { status: TICKET_STATUS.CANCELLED });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'Booking',
    entityId: booking._id,
    details: { status: BOOKING_STATUS.CANCELLED },
    req,
  });

  const populated = await Booking.findById(booking._id).populate(BOOKING_POPULATE);
  ok(res, enrichBooking(populated), 'Booking cancelled successfully.');
});

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
};

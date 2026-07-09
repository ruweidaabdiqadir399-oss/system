const crypto = require('crypto');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const generateId = require('../utils/generateId');
const logAudit = require('../utils/auditLog');
const { issueTicketsForBooking } = require('../services/ticketService');
const { Payment, Booking, Ticket, Schedule } = require('../models');
const {
  ROLES,
  BOOKING_STATUS,
  BOOKING_PAYMENT_STATUS,
  PAYMENT_STATUS,
  TICKET_STATUS,
  AUDIT_ACTIONS,
} = require('../constants');

const PAYMENT_POPULATE = [
  { path: 'customerId', select: 'name email phone' },
  {
    path: 'bookingId',
    select: 'scheduleId totalAmount seatNumbers status paymentStatus paymentMethod',
    populate: {
      path: 'scheduleId',
      select: 'routeId date departureTime',
      populate: { path: 'routeId', select: 'name code origin destination' },
    },
  },
];

const enrichPayment = (payment) => {
  const p = typeof payment.toJSON === 'function' ? payment.toJSON() : payment;
  const customer = p.customerId && typeof p.customerId === 'object' ? p.customerId : null;
  const booking = p.bookingId && typeof p.bookingId === 'object' ? p.bookingId : null;
  const schedule = booking?.scheduleId && typeof booking.scheduleId === 'object' ? booking.scheduleId : null;
  const route = schedule?.routeId && typeof schedule.routeId === 'object' ? schedule.routeId : null;

  return {
    ...p,
    customerId: customer?._id ?? p.customerId,
    bookingId: booking?._id ?? p.bookingId,
    customerName: customer?.name ?? '',
    customerEmail: customer?.email ?? '',
    customerPhone: customer?.phone ?? '',
    routeName: route?.name ?? '',
    routeCode: route?.code ?? '',
    routeOrigin: route?.origin ?? '',
    routeDestination: route?.destination ?? '',
    tripDate: schedule?.date ?? '',
    departureTime: schedule?.departureTime ?? '',
  };
};

const generateTransactionRef = () => `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

// @desc    List payments (own payments for customers, all for admin/staff)
// @route   GET /api/v1/payments
// @access  Private
const getPayments = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', method = 'all', bookingId = 'all', customerId, page, pageSize } = req.query;

  const filter = { ...buildSearchFilter(search, ['_id', 'transactionRef']) };
  if (status !== 'all') filter.status = status;
  if (method !== 'all') filter.method = method;
  if (bookingId !== 'all') filter.bookingId = bookingId;

  if (req.user.role === ROLES.CUSTOMER) {
    filter.customerId = req.user._id;
  } else if (customerId) {
    filter.customerId = customerId;
  }

  const result = await paginate(Payment, filter, { page, pageSize, sort: '-date', populate: PAYMENT_POPULATE });
  const enriched = result.items.map(enrichPayment);
  paginated(res, { ...result, items: enriched }, 'Payments fetched successfully.');
});

// @desc    Get a single payment by ID
// @route   GET /api/v1/payments/:id
// @access  Private
const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate(PAYMENT_POPULATE);
  if (!payment) throw ApiError.notFound('Payment not found.');

  const enriched = enrichPayment(payment);
  if (req.user.role === ROLES.CUSTOMER && enriched.customerId !== req.user._id) {
    throw ApiError.forbidden('You can only view your own payments.');
  }

  ok(res, enriched, 'Payment fetched successfully.');
});

// @desc    Process a payment for a booking, confirming it and issuing tickets
// @route   POST /api/v1/payments
// @access  Private
const createPayment = asyncHandler(async (req, res) => {
  const { bookingId, amount, method } = req.body;

  const booking = await Booking.findById(bookingId);
  if (!booking) throw ApiError.badRequest('No booking was found with that ID.');

  if (req.user.role === ROLES.CUSTOMER && booking.customerId !== req.user._id) {
    throw ApiError.forbidden('You can only pay for your own bookings.');
  }
  if (booking.status === BOOKING_STATUS.CANCELLED) {
    throw ApiError.conflict('Cannot pay for a cancelled booking.');
  }
  if (booking.paymentStatus === BOOKING_PAYMENT_STATUS.PAID) {
    throw ApiError.conflict('This booking has already been paid for.');
  }
  if (Math.abs(amount - booking.totalAmount) > 0.01) {
    throw ApiError.badRequest(`Payment amount must equal the booking total of ${booking.totalAmount}.`);
  }

  const status = PAYMENT_STATUS.COMPLETED;

  const _id = await generateId('PAY', 'PAY-', 500016, 6);
  const payment = await Payment.create({
    _id,
    bookingId,
    customerId: booking.customerId,
    amount,
    method,
    status,
    transactionRef: generateTransactionRef(),
  });

  booking.paymentMethod = method;
  booking.paymentStatus = status === PAYMENT_STATUS.COMPLETED ? BOOKING_PAYMENT_STATUS.PAID : BOOKING_PAYMENT_STATUS.PENDING;
  if (booking.status === BOOKING_STATUS.PENDING) {
    booking.status = BOOKING_STATUS.CONFIRMED;
  }
  await booking.save();

  let tickets = [];
  if (booking.status === BOOKING_STATUS.CONFIRMED) {
    tickets = await issueTicketsForBooking(booking);
  }

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'Payment',
    entityId: payment._id,
    details: { bookingId, amount, method, status },
    req,
  });

  created(res, { payment, booking, tickets }, 'Payment processed successfully.');
});

// @desc    Refund a completed payment
// @route   PATCH /api/v1/payments/:id/refund
// @access  Private (admin, staff)
const refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw ApiError.notFound('Payment not found.');

  if (payment.status === PAYMENT_STATUS.REFUNDED) {
    throw ApiError.badRequest('This payment has already been refunded.');
  }
  if (payment.status !== PAYMENT_STATUS.COMPLETED) {
    throw ApiError.conflict('Only completed payments can be refunded.');
  }

  payment.status = PAYMENT_STATUS.REFUNDED;
  await payment.save();

  const booking = await Booking.findById(payment.bookingId);
  if (booking) {
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.paymentStatus = BOOKING_PAYMENT_STATUS.REFUNDED;
    await booking.save();

    await Ticket.updateMany({ bookingId: booking._id }, { status: TICKET_STATUS.CANCELLED });
    await Schedule.findByIdAndUpdate(booking.scheduleId, {
      $inc: { bookedSeats: -booking.seatNumbers.length },
    });
  }

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'Payment',
    entityId: payment._id,
    details: { status: PAYMENT_STATUS.REFUNDED },
    req,
  });

  ok(res, payment, 'Payment refunded successfully.');
});

// @desc    Get payment aggregate statistics
// @route   GET /api/v1/payments/summary
// @access  Private (admin, staff)
const getPaymentSummary = asyncHandler(async (req, res) => {
  const [groups, completedAgg] = await Promise.all([
    Payment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 }, total: { $sum: '$amount' } } }]),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.COMPLETED } },
      { $group: { _id: null, amount: { $sum: '$amount' } } },
    ]),
  ]);

  const summary = { total: 0, completedAmount: completedAgg[0]?.amount ?? 0 };
  groups.forEach((g) => {
    summary[g._id] = g.count;
    summary.total += g.count;
  });

  ok(res, summary, 'Payment summary fetched successfully.');
});

module.exports = {
  getPayments,
  getPaymentById,
  createPayment,
  refundPayment,
  getPaymentSummary,
};

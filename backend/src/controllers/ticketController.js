const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const logAudit = require('../utils/auditLog');
const generateId = require('../utils/generateId');
const { Ticket, Bus, BoardingLog } = require('../models');
const { ROLES, TICKET_STATUS, AUDIT_ACTIONS } = require('../constants');

const TICKET_POPULATE = [
  { path: 'bookingId', select: 'status paymentStatus scheduleId seatNumbers totalAmount paymentMethod' },
  { path: 'scheduleId', populate: { path: 'routeId' } },
  { path: 'customerId', select: 'name email' },
];

const enrichTicket = (ticket) => {
  const t = typeof ticket.toJSON === 'function' ? ticket.toJSON() : ticket;
  const booking = t.bookingId && typeof t.bookingId === 'object' ? t.bookingId : null;
  const schedule = t.scheduleId && typeof t.scheduleId === 'object' ? t.scheduleId : null;
  const route = schedule?.routeId && typeof schedule.routeId === 'object' ? schedule.routeId : null;
  const customer = t.customerId && typeof t.customerId === 'object' ? t.customerId : null;

  return {
    ...t,
    bookingId: booking?._id ?? t.bookingId,
    scheduleId: schedule?._id ?? t.scheduleId,
    customerId: customer?._id ?? t.customerId,
    booking: booking
      ? { id: booking._id, status: booking.status, paymentStatus: booking.paymentStatus, scheduleId: booking.scheduleId, seatNumbers: booking.seatNumbers }
      : null,
    schedule: schedule
      ? { id: schedule._id, date: schedule.date, departureTime: schedule.departureTime, arrivalTime: schedule.arrivalTime, gate: schedule.gate, status: schedule.status }
      : null,
    route: route
      ? { id: route._id, code: route.code, name: route.name, origin: route.origin, destination: route.destination }
      : null,
    customerName: customer?.name ?? 'Unknown',
  };
};

// @desc    List tickets (own tickets for customers, all for admin/staff/driver)
// @route   GET /api/v1/tickets
// @access  Private
const getTickets = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', bookingId = 'all', scheduleId = 'all', customerId, page, pageSize } = req.query;

  const filter = { ...buildSearchFilter(search, ['_id', 'passengerName', 'seatNumber']) };
  if (status !== 'all') filter.status = status;
  if (bookingId !== 'all') filter.bookingId = bookingId;
  if (scheduleId !== 'all') filter.scheduleId = scheduleId;

  if (req.user.role === ROLES.CUSTOMER) {
    filter.customerId = req.user._id;
  } else if (customerId) {
    filter.customerId = customerId;
  }

  const result = await paginate(Ticket, filter, {
    page,
    pageSize,
    sort: '-issuedAt',
    populate: TICKET_POPULATE,
  });

  const enriched = result.items.map(enrichTicket);
  paginated(res, { ...result, items: enriched }, 'Tickets fetched successfully.');
});

// @desc    Get a single ticket by ID
// @route   GET /api/v1/tickets/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id).populate(TICKET_POPULATE);
  if (!ticket) throw ApiError.notFound('Ticket not found.');

  if (req.user.role === ROLES.CUSTOMER && ticket.customerId?._id !== req.user._id) {
    throw ApiError.forbidden('You can only view your own tickets.');
  }

  ok(res, enrichTicket(ticket), 'Ticket fetched successfully.');
});

// @desc    Verify a ticket by its QR payload or ID and mark it as used
// @route   POST /api/v1/tickets/verify
// @access  Private (admin, staff, driver)
const verifyTicket = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const ticket = await Ticket.findOne({ $or: [{ _id: code }, { qrPayload: code }] }).populate(TICKET_POPULATE);
  if (!ticket) throw ApiError.notFound('No ticket matches this code.');

  if (ticket.status === TICKET_STATUS.CANCELLED) {
    throw ApiError.conflict('This ticket has been cancelled and is not valid for travel.');
  }
  if (ticket.status === TICKET_STATUS.USED) {
    return ok(res, enrichTicket(ticket), 'This ticket has already been used.');
  }

  ticket.status = TICKET_STATUS.USED;
  await ticket.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'Ticket',
    entityId: ticket._id,
    details: { status: TICKET_STATUS.USED },
    req,
  });

  ok(res, enrichTicket(ticket), 'Ticket verified successfully.');
});

// @desc    Manually update a ticket's status
// @route   PATCH /api/v1/tickets/:id/status
// @access  Private (admin, staff)
const updateTicketStatus = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw ApiError.notFound('Ticket not found.');

  ticket.status = req.body.status;
  await ticket.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'Ticket',
    entityId: ticket._id,
    details: { status: ticket.status },
    req,
  });

  const populated = await Ticket.findById(ticket._id).populate(TICKET_POPULATE);
  ok(res, enrichTicket(populated), 'Ticket status updated successfully.');
});

// @desc    Board a passenger by scanning QR code – validates and marks ticket as Boarded
// @route   POST /api/v1/tickets/board
// @access  Private (admin, staff, driver)
const boardTicket = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const ticket = await Ticket.findOne({ $or: [{ _id: code }, { qrPayload: code }] }).populate(TICKET_POPULATE);
  if (!ticket) throw ApiError.notFound('No ticket matches this QR code.');

  if (ticket.status === TICKET_STATUS.CANCELLED) {
    throw ApiError.conflict('This ticket has been cancelled and is not valid for travel.');
  }
  if (ticket.status === TICKET_STATUS.BOARDED) {
    throw ApiError.conflict('This ticket has already been used for boarding. Duplicate scan prevented.');
  }
  if (ticket.status === TICKET_STATUS.USED) {
    throw ApiError.conflict('This ticket was already checked in via another method.');
  }

  const schedule = ticket.scheduleId && typeof ticket.scheduleId === 'object' ? ticket.scheduleId : null;
  if (schedule?.date) {
    const scheduleDay = new Date(schedule.date).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (scheduleDay !== today) {
      throw ApiError.conflict(`This ticket is for ${scheduleDay}. Travel date does not match today (${today}).`);
    }
  }

  ticket.status = TICKET_STATUS.BOARDED;
  await ticket.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'Ticket',
    entityId: ticket._id,
    details: { status: TICKET_STATUS.BOARDED },
    req,
  });

  // Write boarding log — non-blocking, never fails the main response.
  try {
    const sch = ticket.scheduleId && typeof ticket.scheduleId === 'object' ? ticket.scheduleId : null;
    const route = sch?.routeId && typeof sch.routeId === 'object' ? sch.routeId : null;
    const bus = sch?.busId ? await Bus.findById(sch.busId).select('busNumber') : null;
    const logId = await generateId('BRD', 'BRD-', 5001, 5);
    await BoardingLog.create({
      _id: logId,
      ticketId: ticket._id,
      passengerName: ticket.passengerName,
      seatNumber: ticket.seatNumber,
      scheduleId: sch?._id ?? (typeof ticket.scheduleId === 'string' ? ticket.scheduleId : ''),
      routeName: route?.name ?? '',
      routeCode: route?.code ?? '',
      routeOrigin: route?.origin ?? '',
      routeDestination: route?.destination ?? '',
      busId: sch?.busId ?? '',
      busNumber: bus?.busNumber ?? '',
      staffId: req.user._id,
      staffName: req.user.name,
      boardedAt: new Date(),
      status: TICKET_STATUS.BOARDED,
    });
  } catch (logErr) {
    console.error('BoardingLog write failed (non-fatal):', logErr.message);
  }

  ok(res, enrichTicket(ticket), 'Passenger boarded successfully.');
});

module.exports = {
  getTickets,
  getTicketById,
  verifyTicket,
  updateTicketStatus,
  boardTicket,
};

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const generateId = require('../utils/generateId');
const logAudit = require('../utils/auditLog');
const { Schedule, Route, Bus, Booking, User } = require('../models');
const { ROLES, BOOKING_STATUS, AUDIT_ACTIONS, SCHEDULE_STATUS } = require('../constants');

const SCHEDULE_POPULATE = [
  { path: 'routeId' },
  { path: 'busId', select: 'busNumber model capacity acType seatType' },
  { path: 'driverId', select: 'name' },
];

const enrichSchedule = (schedule) => {
  const s = typeof schedule.toJSON === 'function' ? schedule.toJSON() : schedule;
  const route = s.routeId && typeof s.routeId === 'object' ? s.routeId : null;
  const bus = s.busId && typeof s.busId === 'object' ? s.busId : null;
  const driver = s.driverId && typeof s.driverId === 'object' ? s.driverId : null;

  return {
    ...s,
    routeId: route?._id ?? s.routeId,
    busId: bus?._id ?? s.busId,
    driverId: driver?._id ?? s.driverId,
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
    bus: bus
      ? {
          id: bus._id,
          busNumber: bus.busNumber,
          model: bus.model,
          capacity: bus.capacity,
          acType: bus.acType,
          seatType: bus.seatType,
        }
      : null,
    driverName: driver?.name ?? 'Unassigned',
  };
};

// @desc    List schedules with search and filters
// @route   GET /api/v1/schedules
// @access  Public
const getSchedules = asyncHandler(async (req, res) => {
  const {
    search = '',
    status = 'all',
    routeId = 'all',
    busId = 'all',
    driverId = 'all',
    date,
    page,
    pageSize,
  } = req.query;

  const filter = { ...buildSearchFilter(search, ['_id', 'gate']) };
  if (status !== 'all') filter.status = status;
  if (routeId !== 'all') filter.routeId = routeId;
  if (busId !== 'all') filter.busId = busId;
  if (driverId !== 'all') filter.driverId = driverId;
  if (date) filter.date = date;

  const result = await paginate(Schedule, filter, {
    page,
    pageSize,
    sort: 'date departureTime',
    populate: SCHEDULE_POPULATE,
  });

  const enriched = result.items.map(enrichSchedule);
  paginated(res, { ...result, items: enriched }, 'Schedules fetched successfully.');
});

// @desc    Get a single schedule by ID
// @route   GET /api/v1/schedules/:id
// @access  Public
const getScheduleById = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id).populate(SCHEDULE_POPULATE);
  if (!schedule) throw ApiError.notFound('Schedule not found.');
  ok(res, enrichSchedule(schedule), 'Schedule fetched successfully.');
});

// @desc    Get the seat map (booked seat numbers) for a schedule
// @route   GET /api/v1/schedules/:id/seats
// @access  Public
const getScheduleSeatMap = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw ApiError.notFound('Schedule not found.');

  const bookings = await Booking.find({
    scheduleId: schedule._id,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] },
  }).select('seatNumbers');

  const bookedSeatNumbers = bookings.flatMap((b) => b.seatNumbers);

  ok(res, {
    scheduleId: schedule._id,
    totalSeats: schedule.totalSeats,
    bookedSeats: schedule.bookedSeats,
    availableSeats: schedule.availableSeats,
    bookedSeatNumbers,
  }, 'Seat map fetched successfully.');
});

// @desc    Create a new trip schedule
// @route   POST /api/v1/schedules
// @access  Private (admin, staff)
const createSchedule = asyncHandler(async (req, res) => {
  const { routeId, busId, driverId } = req.body;

  const route = await Route.findById(routeId);
  if (!route) throw ApiError.badRequest('No route was found with that ID.');

  const bus = await Bus.findById(busId);
  if (!bus) throw ApiError.badRequest('No bus was found with that ID.');

  const _id = await generateId('SCH', 'SCH-', 1901, 4);
  const schedule = await Schedule.create({
    _id,
    ...req.body,
    driverId: driverId || bus.driverId || null,
    totalSeats: bus.capacity,
  });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'Schedule',
    entityId: schedule._id,
    details: { routeId, busId },
    req,
  });

  const populated = await Schedule.findById(schedule._id).populate(SCHEDULE_POPULATE);
  created(res, enrichSchedule(populated), 'Schedule created successfully.');
});

// @desc    Update a schedule's details
// @route   PATCH /api/v1/schedules/:id
// @access  Private (admin, staff)
const updateSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw ApiError.notFound('Schedule not found.');

  const { _id, bookedSeats, ...updates } = req.body;

  if (updates.busId && updates.busId !== schedule.busId) {
    const bus = await Bus.findById(updates.busId);
    if (!bus) throw ApiError.badRequest('No bus was found with that ID.');
    updates.totalSeats = bus.capacity;
  }

  Object.assign(schedule, updates);
  await schedule.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'Schedule',
    entityId: schedule._id,
    details: updates,
    req,
  });

  const populated = await Schedule.findById(schedule._id).populate(SCHEDULE_POPULATE);
  ok(res, enrichSchedule(populated), 'Schedule updated successfully.');
});

// @desc    Update a schedule's status (boarding, departed, delayed, etc.)
// @route   PATCH /api/v1/schedules/:id/status
// @access  Private (admin, staff, driver - own schedule only)
const updateScheduleStatus = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw ApiError.notFound('Schedule not found.');

  if (req.user.role === ROLES.DRIVER && schedule.driverId !== req.user._id) {
    throw ApiError.forbidden('You can only update schedules assigned to you.');
  }

  const { status } = req.body;
  schedule.status = status;
  await schedule.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'Schedule',
    entityId: schedule._id,
    details: { status },
    req,
  });

  const populated = await Schedule.findById(schedule._id).populate(SCHEDULE_POPULATE);
  ok(res, enrichSchedule(populated), 'Schedule status updated successfully.');
});

// @desc    Driver starts an assigned trip (Boarding → On Trip)
// @route   POST /api/v1/schedules/:id/start
// @access  Private (driver — own schedule only)
const startTrip = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw ApiError.notFound('Schedule not found.');

  if (schedule.driverId !== req.user._id) {
    throw ApiError.forbidden('You can only start trips assigned to you.');
  }

  if (schedule.status !== SCHEDULE_STATUS.BOARDING) {
    throw ApiError.badRequest('Trip can only be started when status is Boarding.');
  }

  if (schedule.actualStartTime) {
    throw ApiError.badRequest('This trip has already been started.');
  }

  const now = new Date();
  schedule.status = SCHEDULE_STATUS.ON_TRIP;
  schedule.actualStartTime = now;
  schedule.startedBy = req.user._id;
  schedule.startedDate = now.toISOString().slice(0, 10);
  await schedule.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'Schedule',
    entityId: schedule._id,
    details: {
      status: SCHEDULE_STATUS.ON_TRIP,
      actualStartTime: now,
      startedBy: req.user._id,
    },
    req,
  });

  const populated = await Schedule.findById(schedule._id).populate(SCHEDULE_POPULATE);
  ok(res, enrichSchedule(populated), 'Trip started successfully.');
});

// @desc    Driver completes an assigned trip (On Trip → Completed)
// @route   POST /api/v1/schedules/:id/complete
// @access  Private (driver — own schedule only)
const completeTrip = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw ApiError.notFound('Schedule not found.');

  if (schedule.driverId !== req.user._id) {
    throw ApiError.forbidden('You can only complete trips assigned to you.');
  }

  if (schedule.status !== SCHEDULE_STATUS.ON_TRIP) {
    throw ApiError.badRequest('Trip can only be completed when status is On Trip.');
  }

  if (schedule.actualFinishTime) {
    throw ApiError.badRequest('This trip has already been completed.');
  }

  const now = new Date();
  schedule.status = SCHEDULE_STATUS.COMPLETED;
  schedule.actualFinishTime = now;
  schedule.completedBy = req.user._id;
  schedule.completedDate = now.toISOString().slice(0, 10);
  await schedule.save();

  // Mark all confirmed bookings for this schedule as Completed so customers
  // can rate the driver and the booking history reflects the trip outcome.
  await Booking.updateMany(
    { scheduleId: schedule._id, status: BOOKING_STATUS.CONFIRMED },
    { status: BOOKING_STATUS.COMPLETED }
  );

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.STATUS_CHANGE,
    entity: 'Schedule',
    entityId: schedule._id,
    details: {
      status: SCHEDULE_STATUS.COMPLETED,
      actualFinishTime: now,
      completedBy: req.user._id,
    },
    req,
  });

  const populated = await Schedule.findById(schedule._id).populate(SCHEDULE_POPULATE);
  ok(res, enrichSchedule(populated), 'Trip completed successfully.');
});

// @desc    Delete a schedule
// @route   DELETE /api/v1/schedules/:id
// @access  Private (admin)
const deleteSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id);
  if (!schedule) throw ApiError.notFound('Schedule not found.');

  const activeBooking = await Booking.findOne({
    scheduleId: schedule._id,
    status: { $in: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.PENDING] },
  });
  if (activeBooking) {
    throw ApiError.conflict('Cannot delete a schedule that has active bookings.');
  }

  await schedule.deleteOne();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.DELETE,
    entity: 'Schedule',
    entityId: schedule._id,
    req,
  });

  ok(res, { id: schedule._id }, 'Schedule deleted successfully.');
});

module.exports = {
  getSchedules,
  getScheduleById,
  getScheduleSeatMap,
  createSchedule,
  updateSchedule,
  updateScheduleStatus,
  startTrip,
  completeTrip,
  deleteSchedule,
};

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const generateId = require('../utils/generateId');
const logAudit = require('../utils/auditLog');
const { Bus, User, Driver, Schedule, Route } = require('../models');
const { ROLES, BUS_STATUS, SCHEDULE_STATUS, AUDIT_ACTIONS } = require('../constants');

const BUS_POPULATE = [
  { path: 'driverId', select: 'name phone' },
  { path: 'currentRouteId', select: 'name code origin destination' },
];

const enrichBus = (bus) => {
  const b = typeof bus.toJSON === 'function' ? bus.toJSON() : bus;
  const driver = b.driverId && typeof b.driverId === 'object' ? b.driverId : null;
  const route = b.currentRouteId && typeof b.currentRouteId === 'object' ? b.currentRouteId : null;

  return {
    ...b,
    driverId: driver?._id ?? b.driverId,
    currentRouteId: route?._id ?? b.currentRouteId,
    driverName: driver?.name ?? 'Unassigned',
    driverPhone: driver?.phone ?? '',
    currentRoute: route?.name ?? 'Unassigned',
    routeOrigin: route?.origin ?? '',
    routeDestination: route?.destination ?? '',
  };
};

// @desc    List buses with search and filters
// @route   GET /api/v1/buses
// @access  Private (admin, staff)
const getBuses = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', acType = 'all', seatType = 'all', page, pageSize } = req.query;

  const filter = { ...buildSearchFilter(search, ['busNumber', 'model', 'type', '_id']) };
  if (status !== 'all') filter.status = status;
  if (acType !== 'all') filter.acType = acType;
  if (seatType !== 'all') filter.seatType = seatType;

  const result = await paginate(Bus, filter, { page, pageSize, sort: '_id', populate: BUS_POPULATE });
  const enriched = result.items.map(enrichBus);
  paginated(res, { ...result, items: enriched }, 'Buses fetched successfully.');
});

// @desc    Get fleet counts grouped by status
// @route   GET /api/v1/buses/stats
// @access  Private (admin, staff)
const getBusStats = asyncHandler(async (req, res) => {
  const stats = { [BUS_STATUS.ACTIVE]: 0, [BUS_STATUS.MAINTENANCE]: 0, [BUS_STATUS.INACTIVE]: 0, total: 0 };
  const aggregation = await Bus.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  aggregation.forEach((group) => {
    stats[group._id] = group.count;
    stats.total += group.count;
  });
  ok(res, stats, 'Bus stats fetched successfully.');
});

// @desc    Get a single bus by ID
// @route   GET /api/v1/buses/:id
// @access  Private (admin, staff)
const getBusById = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id).populate(BUS_POPULATE);
  if (!bus) throw ApiError.notFound('Bus not found.');
  ok(res, enrichBus(bus), 'Bus fetched successfully.');
});

// @desc    Add a new bus to the fleet
// @route   POST /api/v1/buses
// @access  Private (admin)
const createBus = asyncHandler(async (req, res) => {
  const { busNumber } = req.body;

  const existing = await Bus.findOne({ busNumber: busNumber.toUpperCase() });
  if (existing) throw ApiError.conflict('A bus with this bus number already exists.');

  const _id = await generateId('BUS', 'BUS-', 13, 3);
  const bus = await Bus.create({ _id, ...req.body });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'Bus',
    entityId: bus._id,
    details: { busNumber: bus.busNumber },
    req,
  });

  created(res, enrichBus(bus), 'Bus created successfully.');
});

// @desc    Update a bus
// @route   PATCH /api/v1/buses/:id
// @access  Private (admin)
const updateBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) throw ApiError.notFound('Bus not found.');

  const { _id, ...updates } = req.body;
  Object.assign(bus, updates);
  await bus.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'Bus',
    entityId: bus._id,
    details: updates,
    req,
  });

  const populated = await Bus.findById(bus._id).populate(BUS_POPULATE);
  ok(res, enrichBus(populated), 'Bus updated successfully.');
});

// @desc    Remove a bus from the fleet
// @route   DELETE /api/v1/buses/:id
// @access  Private (admin)
const deleteBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) throw ApiError.notFound('Bus not found.');

  const activeSchedule = await Schedule.findOne({
    busId: bus._id,
    status: { $nin: [SCHEDULE_STATUS.COMPLETED, SCHEDULE_STATUS.CANCELLED] },
  });
  if (activeSchedule) {
    throw ApiError.conflict('Cannot delete a bus that has active or upcoming schedules.');
  }

  await bus.deleteOne();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.DELETE,
    entity: 'Bus',
    entityId: bus._id,
    req,
  });

  ok(res, { id: bus._id }, 'Bus deleted successfully.');
});

// @desc    Assign a driver to a bus
// @route   PATCH /api/v1/buses/:id/assign-driver
// @access  Private (admin, staff)
const assignDriver = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.id);
  if (!bus) throw ApiError.notFound('Bus not found.');

  const { driverId } = req.body;
  const driverUser = await User.findOne({ _id: driverId, role: ROLES.DRIVER });
  if (!driverUser) throw ApiError.badRequest('No driver was found with that ID.');

  // Free up any other bus this driver was previously assigned to.
  await Bus.updateMany({ _id: { $ne: bus._id }, driverId }, { $set: { driverId: null } });

  bus.driverId = driverId;
  await bus.save();
  await Driver.findOneAndUpdate({ userId: driverId }, { assignedBusId: bus._id });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'Bus',
    entityId: bus._id,
    details: { driverId },
    req,
  });

  const populated = await Bus.findById(bus._id).populate(BUS_POPULATE);
  ok(res, enrichBus(populated), 'Driver assigned successfully.');
});

module.exports = {
  getBuses,
  getBusStats,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  assignDriver,
};

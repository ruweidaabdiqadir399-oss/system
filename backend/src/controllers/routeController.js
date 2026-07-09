const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const generateId = require('../utils/generateId');
const logAudit = require('../utils/auditLog');
const { Route, Schedule, Bus } = require('../models');
const { SCHEDULE_STATUS, AUDIT_ACTIONS } = require('../constants');

// @desc    List routes with search, status and region filters
// @route   GET /api/v1/routes
// @access  Public
const getRoutes = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', region = 'all', page, pageSize } = req.query;

  const filter = { ...buildSearchFilter(search, ['code', 'name', 'origin', 'destination', '_id']) };
  if (status !== 'all') filter.status = status;
  if (region !== 'all') filter.region = region;

  const result = await paginate(Route, filter, { page, pageSize, sort: 'name' });

  const routeIds = result.items.map((r) => r._id);
  const busCounts = await Bus.aggregate([
    { $match: { currentRouteId: { $in: routeIds } } },
    { $group: { _id: '$currentRouteId', count: { $sum: 1 } } },
  ]);
  const busCountMap = new Map(busCounts.map((b) => [b._id, b.count]));
  const items = result.items.map((r) => ({ ...r.toJSON(), assignedBuses: busCountMap.get(r._id) ?? 0 }));

  paginated(res, { ...result, items }, 'Routes fetched successfully.');
});

// @desc    Get a single route by ID
// @route   GET /api/v1/routes/:id
// @access  Public
const getRouteById = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw ApiError.notFound('Route not found.');
  ok(res, route, 'Route fetched successfully.');
});

// @desc    Create a new route
// @route   POST /api/v1/routes
// @access  Private (admin)
const createRoute = asyncHandler(async (req, res) => {
  const { code } = req.body;

  const existing = await Route.findOne({ code: code.toUpperCase() });
  if (existing) throw ApiError.conflict('A route with this code already exists.');

  const _id = await generateId('RT', 'RT-', 11, 3);
  const route = await Route.create({ _id, ...req.body });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'Route',
    entityId: route._id,
    details: { code: route.code, name: route.name },
    req,
  });

  created(res, route, 'Route created successfully.');
});

// @desc    Update a route
// @route   PATCH /api/v1/routes/:id
// @access  Private (admin)
const updateRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw ApiError.notFound('Route not found.');

  const { _id, ...updates } = req.body;
  Object.assign(route, updates);
  await route.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'Route',
    entityId: route._id,
    details: updates,
    req,
  });

  ok(res, route, 'Route updated successfully.');
});

// @desc    Delete a route
// @route   DELETE /api/v1/routes/:id
// @access  Private (admin)
const deleteRoute = asyncHandler(async (req, res) => {
  const route = await Route.findById(req.params.id);
  if (!route) throw ApiError.notFound('Route not found.');

  const activeSchedule = await Schedule.findOne({
    routeId: route._id,
    status: { $nin: [SCHEDULE_STATUS.COMPLETED, SCHEDULE_STATUS.CANCELLED] },
  });
  if (activeSchedule) {
    throw ApiError.conflict('Cannot delete a route that has active or upcoming schedules.');
  }

  await route.deleteOne();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.DELETE,
    entity: 'Route',
    entityId: route._id,
    req,
  });

  ok(res, { id: route._id }, 'Route deleted successfully.');
});

module.exports = {
  getRoutes,
  getRouteById,
  createRoute,
  updateRoute,
  deleteRoute,
};

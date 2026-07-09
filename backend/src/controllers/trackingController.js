const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok } = require('../utils/ApiResponse');
const { buildSearchFilter } = require('../utils/searchFilter');
const { Tracking, Bus } = require('../models');
const { ROLES } = require('../constants');

const TRACKING_POPULATE = [
  { path: 'busId', select: 'busNumber model capacity status' },
  { path: 'routeId', select: 'name code origin destination' },
  { path: 'driverId', select: 'name phone' },
];

const enrichTracking = (t) => {
  const item = typeof t.toJSON === 'function' ? t.toJSON() : t;
  const bus = item.busId && typeof item.busId === 'object' ? item.busId : null;
  const route = item.routeId && typeof item.routeId === 'object' ? item.routeId : null;
  const driver = item.driverId && typeof item.driverId === 'object' ? item.driverId : null;

  return {
    ...item,
    busId: bus?._id ?? item.busId,
    routeId: route?._id ?? item.routeId,
    driverId: driver?._id ?? item.driverId,
    bus: bus ? { busNumber: bus.busNumber, model: bus.model, capacity: bus.capacity, status: bus.status } : null,
    route: route ? { name: route.name, code: route.code, origin: route.origin, destination: route.destination } : null,
    driverName: driver?.name ?? '',
    driverPhone: driver?.phone ?? '',
  };
};

// @desc    List live tracking data for the fleet
// @route   GET /api/v1/tracking
// @access  Private
const getTrackingList = asyncHandler(async (req, res) => {
  const { status = 'all', routeId = 'all', search = '' } = req.query;

  const filter = {};
  if (status !== 'all') filter.status = status;
  if (routeId !== 'all') filter.routeId = routeId;
  if (search) {
    Object.assign(filter, buildSearchFilter(search, ['currentLocation', 'nextStop']));
  }

  const items = await Tracking.find(filter).sort('busId').populate(TRACKING_POPULATE);
  const enriched = items.map(enrichTracking);
  ok(res, enriched, 'Live tracking data fetched successfully.');
});

// @desc    Get live tracking data for a single bus
// @route   GET /api/v1/tracking/:busId
// @access  Private
const getTrackingByBus = asyncHandler(async (req, res) => {
  const tracking = await Tracking.findOne({ busId: req.params.busId }).populate(TRACKING_POPULATE);
  if (!tracking) throw ApiError.notFound('No tracking data found for this bus.');
  ok(res, enrichTracking(tracking), 'Tracking data fetched successfully.');
});

// @desc    Update (or create) live tracking data for a bus
// @route   PATCH /api/v1/tracking/:busId
// @access  Private (admin, staff, driver - own bus only)
const updateTracking = asyncHandler(async (req, res) => {
  const bus = await Bus.findById(req.params.busId);
  if (!bus) throw ApiError.notFound('Bus not found.');

  if (req.user.role === ROLES.DRIVER && bus.driverId !== req.user._id) {
    throw ApiError.forbidden('You can only update tracking data for your assigned bus.');
  }

  const tracking = await Tracking.findOneAndUpdate(
    { busId: req.params.busId },
    { ...req.body, busId: req.params.busId, lastUpdated: new Date() },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  ok(res, tracking, 'Tracking data updated successfully.');
});

module.exports = {
  getTrackingList,
  getTrackingByBus,
  updateTracking,
};

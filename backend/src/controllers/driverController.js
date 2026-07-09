const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const { User, Driver, Bus } = require('../models');
const { ROLES } = require('../constants');

const attachProfiles = async (users) => {
  const profiles = await Driver.find({ userId: { $in: users.map((u) => u._id) } });
  const profileMap = new Map(profiles.map((p) => [p.userId, p]));
  return users.map((user) => ({ ...user.toObject(), driverProfile: profileMap.get(user._id) || null }));
};

// @desc    List driver users with their operational profile
// @route   GET /api/v1/drivers
// @access  Private (admin, staff)
const getDrivers = asyncHandler(async (req, res) => {
  const { search = '', status = 'all', page, pageSize } = req.query;

  const filter = { role: ROLES.DRIVER, ...buildSearchFilter(search, ['name', 'email', '_id', 'phone']) };
  if (status !== 'all') filter.status = status;

  const result = await paginate(User, filter, { page, pageSize, sort: 'name' });
  const items = await attachProfiles(result.items);
  paginated(res, { ...result, items }, 'Drivers fetched successfully.');
});

// @desc    Get the authenticated driver's own profile
// @route   GET /api/v1/drivers/me
// @access  Private (driver)
const getMyProfile = asyncHandler(async (req, res) => {
  const profile = await Driver.findOne({ userId: req.user._id });
  ok(res, { ...req.user.toObject(), driverProfile: profile }, 'Driver profile fetched successfully.');
});

// @desc    Get a single driver by user ID
// @route   GET /api/v1/drivers/:userId
// @access  Private (admin, staff)
const getDriverById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.userId, role: ROLES.DRIVER });
  if (!user) throw ApiError.notFound('Driver not found.');

  const profile = await Driver.findOne({ userId: user._id });
  ok(res, { ...user.toObject(), driverProfile: profile }, 'Driver fetched successfully.');
});

// @desc    Create an operational profile for an existing driver user
// @route   POST /api/v1/drivers
// @access  Private (admin)
const createDriverProfile = asyncHandler(async (req, res) => {
  const { userId, licenseNumber, licenseExpiry, rating, totalTrips, assignedBusId } = req.body;

  const user = await User.findOne({ _id: userId, role: ROLES.DRIVER });
  if (!user) throw ApiError.badRequest('No driver user was found with that ID.');

  const existing = await Driver.findOne({ userId });
  if (existing) throw ApiError.conflict('A driver profile already exists for this user.');

  const profile = await Driver.create({ userId, licenseNumber, licenseExpiry, rating, totalTrips, assignedBusId });
  created(res, { ...user.toObject(), driverProfile: profile }, 'Driver profile created successfully.');
});

// @desc    Update a driver's operational profile
// @route   PATCH /api/v1/drivers/:userId
// @access  Private (admin)
const updateDriver = asyncHandler(async (req, res) => {
  const profile = await Driver.findOne({ userId: req.params.userId });
  if (!profile) throw ApiError.notFound('Driver profile not found.');

  Object.assign(profile, req.body);
  await profile.save();

  ok(res, profile, 'Driver profile updated successfully.');
});

// @desc    Update the authenticated driver's own operational profile (license, etc.)
// @route   PATCH /api/v1/drivers/me
// @access  Private (driver)
const updateMyProfile = asyncHandler(async (req, res) => {
  const profile = await Driver.findOne({ userId: req.user._id });
  if (!profile) throw ApiError.notFound('Driver profile not found.');

  const { licenseNumber, licenseExpiry } = req.body;
  if (licenseNumber !== undefined) profile.licenseNumber = licenseNumber;
  if (licenseExpiry !== undefined) profile.licenseExpiry = licenseExpiry;
  await profile.save();

  ok(res, { ...req.user.toObject(), driverProfile: profile }, 'Driver profile updated successfully.');
});

// @desc    Get the authenticated driver's assigned bus details
// @route   GET /api/v1/drivers/me/bus
// @access  Private (driver)
// Bus.driverId is the canonical source — no Driver profile required.
const getMyBus = asyncHandler(async (req, res) => {
  const bus = await Bus.findOne({ driverId: req.user._id });
  ok(res, bus ? bus.toJSON() : null, bus ? 'Assigned bus fetched successfully.' : 'No bus assigned.');
});

// @desc    Assign a bus to a driver (validates uniqueness)
// @route   PATCH /api/v1/drivers/:userId/assign-bus
// @access  Private (admin)
const assignBus = asyncHandler(async (req, res) => {
  const { busId } = req.body;

  // Validate driver user — a Driver profile is NOT required; Bus.driverId is the source of truth.
  const driverUser = await User.findOne({ _id: req.params.userId, role: ROLES.DRIVER });
  if (!driverUser) throw ApiError.notFound('Driver not found.');

  const bus = await Bus.findById(busId);
  if (!bus) throw ApiError.notFound('Bus not found.');

  if (bus.driverId && bus.driverId !== req.params.userId) {
    throw ApiError.conflict('This bus is already assigned to another driver.');
  }

  // Clear any other buses this driver is currently assigned to (uses Bus collection directly)
  await Bus.updateMany({ driverId: req.params.userId, _id: { $ne: busId } }, { $set: { driverId: null } });

  bus.driverId = req.params.userId;
  await bus.save();

  // Sync to Driver profile if one exists — optional, not required for assignment to work
  await Driver.findOneAndUpdate({ userId: req.params.userId }, { assignedBusId: busId });

  ok(res, { driverId: req.params.userId, busId: bus._id, busNumber: bus.busNumber }, 'Bus assigned to driver successfully.');
});

module.exports = {
  getDrivers,
  getMyProfile,
  getDriverById,
  createDriverProfile,
  updateDriver,
  updateMyProfile,
  getMyBus,
  assignBus,
};

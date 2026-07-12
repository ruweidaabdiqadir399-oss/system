const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const { buildSearchFilter } = require('../utils/searchFilter');
const generateId = require('../utils/generateId');
const logAudit = require('../utils/auditLog');
const { User, Driver, Staff } = require('../models');
const { AUDIT_ACTIONS, ROLES, DEPARTMENTS } = require('../constants');

// Department is informational and only meaningful for Staff users — every
// write path funnels through here so non-staff records can never end up
// with a stale department value (e.g. after a role change).
const assertValidStaffDepartment = (department) => {
  if (!department || !DEPARTMENTS.includes(department)) {
    throw ApiError.badRequest('Department is required for staff users.');
  }
};

// @desc    List users with search, role and status filters
// @route   GET /api/v1/users
// @access  Private (admin, staff)
const getUsers = asyncHandler(async (req, res) => {
  const { search = '', role = 'all', status = 'all', page, pageSize } = req.query;

  const filter = { ...buildSearchFilter(search, ['name', 'email', '_id', 'phone']) };
  if (role !== 'all') filter.role = role;
  if (status !== 'all') filter.status = status;

  const result = await paginate(User, filter, { page, pageSize, sort: 'name' });
  paginated(res, result, 'Users fetched successfully.');
});

// @desc    Get user counts grouped by role
// @route   GET /api/v1/users/counts
// @access  Private (admin, staff)
const getUserCounts = asyncHandler(async (req, res) => {
  const counts = { admin: 0, staff: 0, driver: 0, customer: 0, total: 0 };
  const aggregation = await User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]);
  aggregation.forEach((group) => {
    counts[group._id] = group.count;
    counts.total += group.count;
  });
  ok(res, counts, 'User counts fetched successfully.');
});

// @desc    Get a single user by ID
// @route   GET /api/v1/users/:id
// @access  Private (admin, staff)
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');
  ok(res, user, 'User fetched successfully.');
});

// @desc    Create a new user (any role)
// @route   POST /api/v1/users
// @access  Private (admin)
const createUser = asyncHandler(async (req, res) => {
  const { email, role = ROLES.CUSTOMER, department } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw ApiError.conflict('A user with this email already exists.');

  if (role === ROLES.STAFF) assertValidStaffDepartment(department);

  const _id = await generateId('USR', 'USR-', 9001);
  const user = await User.create({
    _id,
    password: 'Welcome@123',
    ...req.body,
    department: role === ROLES.STAFF ? department : '',
  });

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.CREATE,
    entity: 'User',
    entityId: user._id,
    details: { role: user.role, email: user.email },
    req,
  });

  created(res, user, 'User created successfully.');
});

// @desc    Update a user's profile/role/status
// @route   PATCH /api/v1/users/:id
// @access  Private (admin)
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  const { password, _id, ...updates } = req.body;
  const effectiveRole = updates.role || user.role;

  if (effectiveRole === ROLES.STAFF) {
    const department = updates.department ?? user.department;
    assertValidStaffDepartment(department);
    updates.department = department;
  } else {
    updates.department = '';
  }

  Object.assign(user, updates);
  await user.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'User',
    entityId: user._id,
    details: updates,
    req,
  });

  ok(res, user, 'User updated successfully.');
});

// @desc    Delete a user
// @route   DELETE /api/v1/users/:id
// @access  Private (admin)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound('User not found.');

  if (user._id === req.user._id) {
    throw ApiError.badRequest('You cannot delete your own account.');
  }

  await user.deleteOne();
  await Promise.all([
    Driver.deleteOne({ userId: user._id }),
    Staff.deleteOne({ userId: user._id }),
  ]);

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.DELETE,
    entity: 'User',
    entityId: user._id,
    req,
  });

  ok(res, { id: user._id }, 'User deleted successfully.');
});

// @desc    Update the authenticated user's own profile
// @route   PATCH /api/v1/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const updates = { ...req.body };

  if (user.role === ROLES.STAFF) {
    if (updates.department !== undefined && updates.department !== '') {
      assertValidStaffDepartment(updates.department);
    }
  } else {
    delete updates.department;
  }

  Object.assign(user, updates);
  await user.save();
  ok(res, user, 'Profile updated successfully.');
});

// @desc    Upload/replace the authenticated user's avatar
// @route   POST /api/v1/users/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file was uploaded.');

  const user = await User.findById(req.user._id);
  user.avatar = `/uploads/${req.file.filename}`;
  await user.save();

  ok(res, { avatar: user.avatar }, 'Avatar uploaded successfully.');
});

module.exports = {
  getUsers,
  getUserCounts,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
  uploadAvatar,
};

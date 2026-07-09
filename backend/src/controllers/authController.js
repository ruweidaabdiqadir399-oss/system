const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created } = require('../utils/ApiResponse');
const generateId = require('../utils/generateId');
const logAudit = require('../utils/auditLog');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/generateToken');
const { User } = require('../models');
const { ROLES, USER_STATUS, AUDIT_ACTIONS } = require('../constants');

const MAX_REFRESH_TOKENS_PER_USER = 5;

const addRefreshToken = async (user, token) => {
  const decoded = jwt.decode(token);
  const expiresAt = new Date(decoded.exp * 1000);
  const active = user.refreshTokens.filter((rt) => rt.expiresAt > new Date());
  active.push({ token, expiresAt });
  user.refreshTokens = active.slice(-MAX_REFRESH_TOKENS_PER_USER);
  await user.save({ validateBeforeSave: false });
};

const buildAuthPayload = (user, accessToken, refreshToken) => ({
  user,
  accessToken,
  refreshToken,
});

// @desc    Register a new customer account
// @route   POST /api/v1/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const _id = await generateId('USR', 'USR-', 9001);
  const user = await User.create({
    _id,
    name,
    email,
    password,
    phone: phone || '',
    role: ROLES.CUSTOMER,
  });

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await addRefreshToken(user, refreshToken);

  await logAudit({
    userId: user._id,
    userName: user.name,
    action: AUDIT_ACTIONS.REGISTER,
    entity: 'User',
    entityId: user._id,
    req,
  });

  created(res, buildAuthPayload(user, accessToken, refreshToken), 'Registration successful.');
});

// @desc    Log in with email and password
// @route   POST /api/v1/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshTokens');
  if (!user) {
    throw ApiError.unauthorized('User not found. Please check your email address.');
  }

  if (!(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect password. Please try again.');
  }

  if (role && user.role !== role) {
    throw ApiError.unauthorized('Invalid role selected.');
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('This account has been suspended. Contact an administrator.');
  }

  if (user.status === USER_STATUS.INACTIVE) {
    throw ApiError.forbidden('This account is disabled. Contact an administrator.');
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  await addRefreshToken(user, refreshToken);

  await logAudit({
    userId: user._id,
    userName: user.name,
    action: AUDIT_ACTIONS.LOGIN,
    entity: 'User',
    entityId: user._id,
    req,
  });

  ok(res, buildAuthPayload(user, accessToken, refreshToken), 'Login successful.');
});

// @desc    Exchange a valid refresh token for a new access/refresh token pair
// @route   POST /api/v1/auth/refresh
// @access  Public
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    throw ApiError.unauthorized('Refresh token is invalid or has expired.');
  }

  const user = await User.findById(decoded.id).select('+refreshTokens');
  if (!user) {
    throw ApiError.unauthorized('User no longer exists.');
  }

  const isKnown = user.refreshTokens.some(
    (rt) => rt.token === refreshToken && rt.expiresAt > new Date()
  );
  if (!isKnown) {
    throw ApiError.unauthorized('Refresh token is no longer valid.');
  }

  // Rotate: drop the used token before issuing a new pair.
  user.refreshTokens = user.refreshTokens.filter((rt) => rt.token !== refreshToken);

  const accessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);
  await addRefreshToken(user, newRefreshToken);

  ok(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed successfully.');
});

// @desc    Log out by invalidating a refresh token
// @route   POST /api/v1/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    await User.findByIdAndUpdate(req.user._id, { $pull: { refreshTokens: { token: refreshToken } } });
  }

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.LOGOUT,
    entity: 'User',
    entityId: req.user._id,
    req,
  });

  ok(res, null, 'Logged out successfully.');
});

// @desc    Get the currently authenticated user's profile
// @route   GET /api/v1/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  ok(res, req.user, 'Profile fetched successfully.');
});

// @desc    Request a password reset token
// @route   POST /api/v1/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return ok(res, null, 'If an account with that email exists, a password reset token has been generated.');
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  // NOTE: no email provider is configured in this project. In production the
  // reset token should be emailed to the user instead of being returned here.
  ok(res, { resetToken }, 'Password reset token generated.');
});

// @desc    Reset a password using a valid reset token
// @route   POST /api/v1/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw ApiError.badRequest('Password reset token is invalid or has expired.');
  }

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokens = [];
  await user.save();

  await logAudit({
    userId: user._id,
    userName: user.name,
    action: AUDIT_ACTIONS.PASSWORD_RESET,
    entity: 'User',
    entityId: user._id,
    req,
  });

  ok(res, null, 'Password has been reset successfully. Please log in again.');
});

// @desc    Change the authenticated user's password
// @route   PATCH /api/v1/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password +refreshTokens');
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.unauthorized('Current password is incorrect.');
  }

  user.password = newPassword;
  user.refreshTokens = [];
  await user.save();

  await logAudit({
    userId: user._id,
    userName: user.name,
    action: AUDIT_ACTIONS.PASSWORD_CHANGE,
    entity: 'User',
    entityId: user._id,
    req,
  });

  ok(res, null, 'Password changed successfully. Please log in again.');
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
};

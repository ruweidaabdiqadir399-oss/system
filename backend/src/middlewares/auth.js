const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/generateToken');
const { User } = require('../models');
const { USER_STATUS } = require('../constants');

/**
 * Verifies the `Authorization: Bearer <token>` header, loads the
 * corresponding user and attaches it to `req.user`.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw ApiError.unauthorized('Not authorized. No access token provided.');
  }

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw ApiError.unauthorized('Not authorized. Token is invalid or has expired.');
  }

  const user = await User.findById(decoded.id).select('+passwordChangedAt');
  if (!user) {
    throw ApiError.unauthorized('Not authorized. User no longer exists.');
  }

  if (user.status === USER_STATUS.SUSPENDED) {
    throw ApiError.forbidden('This account has been suspended. Contact an administrator.');
  }

  if (user.changedPasswordAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password was changed recently. Please log in again.');
  }

  req.user = user;
  next();
});

/**
 * Restricts a route to the given roles. Must run after `protect`.
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authorized.');
  }
  if (!roles.includes(req.user.role)) {
    throw ApiError.forbidden(`Role '${req.user.role}' is not permitted to access this resource.`);
  }
  next();
};

module.exports = { protect, authorize };

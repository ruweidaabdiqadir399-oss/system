const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Run after express-validator chains to convert collected errors into a
// single ApiError handled by the global error handler.
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const details = errors.array().map((e) => ({ field: e.path, message: e.msg }));
  next(ApiError.unprocessable('Validation failed', details));
};

module.exports = validate;

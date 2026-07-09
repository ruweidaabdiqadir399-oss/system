const { body } = require('express-validator');

const createDriverValidator = [
  body('userId').trim().notEmpty().withMessage('userId is required.'),
  body('licenseNumber').trim().notEmpty().withMessage('licenseNumber is required.'),
  body('licenseExpiry').isISO8601().withMessage('licenseExpiry must be a valid date.'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5.'),
  body('totalTrips').optional().isInt({ min: 0 }).withMessage('totalTrips must be a positive integer.'),
  body('assignedBusId').optional({ nullable: true }).isString(),
];

const updateDriverValidator = [
  body('licenseNumber').optional().trim().notEmpty().withMessage('licenseNumber cannot be empty.'),
  body('licenseExpiry').optional().isISO8601().withMessage('licenseExpiry must be a valid date.'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5.'),
  body('totalTrips').optional().isInt({ min: 0 }).withMessage('totalTrips must be a positive integer.'),
  body('assignedBusId').optional({ nullable: true }).isString(),
];

module.exports = { createDriverValidator, updateDriverValidator };

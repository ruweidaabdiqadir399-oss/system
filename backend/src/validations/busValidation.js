const { body } = require('express-validator');
const { BUS_STATUS, AC_TYPES, SEAT_TYPES } = require('../constants');

const createBusValidator = [
  body('busNumber').trim().notEmpty().withMessage('Bus number is required.'),
  body('model').trim().notEmpty().withMessage('Model is required.'),
  body('type').trim().notEmpty().withMessage('Type is required.'),
  body('acType').isIn(AC_TYPES).withMessage(`acType must be one of: ${AC_TYPES.join(', ')}.`),
  body('seatType').isIn(SEAT_TYPES).withMessage(`seatType must be one of: ${SEAT_TYPES.join(', ')}.`),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be a positive integer.'),
  body('year').optional().isInt({ min: 1990 }).withMessage('Year must be a valid year.'),
  body('status').optional().isIn(Object.values(BUS_STATUS)).withMessage('Invalid status.'),
];

const updateBusValidator = [
  body('busNumber').optional().trim().notEmpty().withMessage('Bus number cannot be empty.'),
  body('model').optional().trim().notEmpty().withMessage('Model cannot be empty.'),
  body('type').optional().trim().notEmpty().withMessage('Type cannot be empty.'),
  body('acType').optional().isIn(AC_TYPES).withMessage(`acType must be one of: ${AC_TYPES.join(', ')}.`),
  body('seatType').optional().isIn(SEAT_TYPES).withMessage(`seatType must be one of: ${SEAT_TYPES.join(', ')}.`),
  body('capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be a positive integer.'),
  body('status').optional().isIn(Object.values(BUS_STATUS)).withMessage('Invalid status.'),
  body('fuelLevel').optional().isFloat({ min: 0, max: 100 }).withMessage('fuelLevel must be between 0 and 100.'),
  body('mileage').optional().isFloat({ min: 0 }).withMessage('mileage must be a positive number.'),
  body('currentRouteId').optional({ nullable: true }).isString(),
  body('driverId').optional({ nullable: true }).isString(),
];

const assignDriverValidator = [
  body('driverId').notEmpty().withMessage('driverId is required.'),
];

module.exports = { createBusValidator, updateBusValidator, assignDriverValidator };

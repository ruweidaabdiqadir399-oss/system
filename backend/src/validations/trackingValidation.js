const { body } = require('express-validator');
const { TRACKING_STATUS } = require('../constants');

const updateTrackingValidator = [
  body('status').optional().isIn(Object.values(TRACKING_STATUS)).withMessage('Invalid tracking status.'),
  body('scheduleId').optional({ nullable: true }).isString(),
  body('routeId').optional({ nullable: true }).isString(),
  body('driverId').optional({ nullable: true }).isString(),
  body('speedKmh').optional().isFloat({ min: 0 }).withMessage('speedKmh must be a positive number.'),
  body('heading').optional().isFloat({ min: 0, max: 360 }).withMessage('heading must be between 0 and 360.'),
  body('position.x').optional().isFloat().withMessage('position.x must be a number.'),
  body('position.y').optional().isFloat().withMessage('position.y must be a number.'),
  body('currentLocation').optional().isString(),
  body('nextStop').optional().isString(),
  body('etaMinutes').optional({ nullable: true }).isInt({ min: 0 }).withMessage('etaMinutes must be a positive integer.'),
  body('fuelLevel').optional().isFloat({ min: 0, max: 100 }).withMessage('fuelLevel must be between 0 and 100.'),
  body('passengerCount').optional().isInt({ min: 0 }).withMessage('passengerCount must be a positive integer.'),
];

module.exports = { updateTrackingValidator };

const { body } = require('express-validator');
const { BOOKING_STATUS, PAYMENT_METHODS } = require('../constants');

const createBookingValidator = [
  body('scheduleId').trim().notEmpty().withMessage('scheduleId is required.'),
  body('seatNumbers').isArray({ min: 1 }).withMessage('Select at least one seat.'),
  body('seatNumbers.*').isString().withMessage('Each seat number must be a string.'),
  body('passengers').optional().isArray().withMessage('passengers must be an array.'),
  body('passengers.*.name').optional().isString().notEmpty().withMessage('Passenger name is required.'),
  body('passengers.*.age').optional().isInt({ min: 0, max: 120 }).withMessage('Passenger age must be valid.'),
  body('passengers.*.gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid passenger gender.'),
  body('passengers.*.seatNumber').optional().isString().notEmpty(),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}.`),
  body('customerId').optional().isString(),
];

const updateBookingStatusValidator = [
  body('status').isIn(Object.values(BOOKING_STATUS)).withMessage('Invalid booking status.'),
];

module.exports = { createBookingValidator, updateBookingStatusValidator };

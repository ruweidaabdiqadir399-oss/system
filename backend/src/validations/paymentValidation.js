const { body } = require('express-validator');
const { PAYMENT_METHODS } = require('../constants');

const createPaymentValidator = [
  body('bookingId').trim().notEmpty().withMessage('bookingId is required.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount must be a positive number.'),
  body('method').isIn(PAYMENT_METHODS).withMessage(`method must be one of: ${PAYMENT_METHODS.join(', ')}.`),
];

module.exports = { createPaymentValidator };

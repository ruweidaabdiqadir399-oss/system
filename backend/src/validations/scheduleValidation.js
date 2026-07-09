const { body } = require('express-validator');
const { SCHEDULE_STATUS } = require('../constants');

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const createScheduleValidator = [
  body('routeId').trim().notEmpty().withMessage('routeId is required.'),
  body('busId').trim().notEmpty().withMessage('busId is required.'),
  body('driverId').optional({ nullable: true }).isString(),
  body('date').matches(DATE_REGEX).withMessage('date must be in YYYY-MM-DD format.'),
  body('departureTime').matches(TIME_REGEX).withMessage('departureTime must be in HH:mm format.'),
  body('arrivalTime').matches(TIME_REGEX).withMessage('arrivalTime must be in HH:mm format.'),
  body('gate').optional().isString(),
  body('status').optional().isIn(Object.values(SCHEDULE_STATUS)).withMessage('Invalid status.'),
];

const updateScheduleValidator = [
  body('routeId').optional().trim().notEmpty().withMessage('routeId cannot be empty.'),
  body('busId').optional().trim().notEmpty().withMessage('busId cannot be empty.'),
  body('driverId').optional({ nullable: true }).isString(),
  body('date').optional().matches(DATE_REGEX).withMessage('date must be in YYYY-MM-DD format.'),
  body('departureTime').optional().matches(TIME_REGEX).withMessage('departureTime must be in HH:mm format.'),
  body('arrivalTime').optional().matches(TIME_REGEX).withMessage('arrivalTime must be in HH:mm format.'),
  body('gate').optional().isString(),
];

const updateScheduleStatusValidator = [
  body('status').isIn(Object.values(SCHEDULE_STATUS)).withMessage('Invalid schedule status.'),
];

module.exports = { createScheduleValidator, updateScheduleValidator, updateScheduleStatusValidator };

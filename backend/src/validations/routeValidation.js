const { body } = require('express-validator');
const { ROUTE_STATUS } = require('../constants');

const createRouteValidator = [
  body('code').trim().notEmpty().withMessage('Route code is required.'),
  body('name').trim().notEmpty().withMessage('Route name is required.'),
  body('origin').trim().notEmpty().withMessage('Origin is required.'),
  body('destination').trim().notEmpty().withMessage('Destination is required.'),
  body('distanceMiles').isFloat({ min: 0 }).withMessage('distanceMiles must be a positive number.'),
  body('durationMinutes').isInt({ min: 0 }).withMessage('durationMinutes must be a positive integer.'),
  body('fare').isFloat({ min: 0 }).withMessage('fare must be a positive number.'),
  body('region').trim().notEmpty().withMessage('Region is required.'),
  body('stops').optional().isArray().withMessage('stops must be an array of strings.'),
  body('status').optional().isIn(Object.values(ROUTE_STATUS)).withMessage('Invalid status.'),
];

const updateRouteValidator = [
  body('code').optional().trim().notEmpty().withMessage('Route code cannot be empty.'),
  body('name').optional().trim().notEmpty().withMessage('Route name cannot be empty.'),
  body('origin').optional().trim().notEmpty().withMessage('Origin cannot be empty.'),
  body('destination').optional().trim().notEmpty().withMessage('Destination cannot be empty.'),
  body('distanceMiles').optional().isFloat({ min: 0 }).withMessage('distanceMiles must be a positive number.'),
  body('durationMinutes').optional().isInt({ min: 0 }).withMessage('durationMinutes must be a positive integer.'),
  body('fare').optional().isFloat({ min: 0 }).withMessage('fare must be a positive number.'),
  body('stops').optional().isArray().withMessage('stops must be an array of strings.'),
  body('status').optional().isIn(Object.values(ROUTE_STATUS)).withMessage('Invalid status.'),
];

module.exports = { createRouteValidator, updateRouteValidator };

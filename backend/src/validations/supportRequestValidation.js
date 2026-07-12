const { body, query } = require('express-validator');
const { SUPPORT_CATEGORIES, SUPPORT_STATUS } = require('../constants');

const createSupportRequestValidator = [
  body('subject').trim().notEmpty().withMessage('Subject is required.'),
  body('category').isIn(SUPPORT_CATEGORIES).withMessage(`category must be one of: ${SUPPORT_CATEGORIES.join(', ')}.`),
  body('message').trim().notEmpty().withMessage('Message is required.'),
];

const updateSupportRequestValidator = [
  body('reply').optional({ checkFalsy: true }).isString(),
  body('status').optional().isIn(Object.values(SUPPORT_STATUS)).withMessage('Invalid status.'),
];

const listSupportRequestsValidator = [
  query('status').optional().isIn(['all', ...Object.values(SUPPORT_STATUS)]).withMessage('Invalid status filter.'),
  query('category').optional().isIn(['all', ...SUPPORT_CATEGORIES]).withMessage('Invalid category filter.'),
];

module.exports = {
  createSupportRequestValidator,
  updateSupportRequestValidator,
  listSupportRequestsValidator,
};

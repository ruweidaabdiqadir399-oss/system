const { body, query } = require('express-validator');
const { REPORT_TYPES, REPORT_STATUS, DEPARTMENTS } = require('../constants');

const createReportValidator = [
  body('title').trim().notEmpty().withMessage('Report title is required.'),
  body('type').isIn(REPORT_TYPES).withMessage(`type must be one of: ${REPORT_TYPES.join(', ')}.`),
  body('description').trim().notEmpty().withMessage('Description is required.'),
];

const updateReportValidator = [
  body('title').optional().trim().notEmpty().withMessage('Report title cannot be empty.'),
  body('type').optional().isIn(REPORT_TYPES).withMessage('Invalid report type.'),
  body('description').optional().trim().notEmpty().withMessage('Description cannot be empty.'),
];

const updateReportStatusValidator = [
  body('status').optional().isIn(Object.values(REPORT_STATUS)).withMessage('Invalid report status.'),
  body('adminRemarks').optional({ checkFalsy: true }).isString(),
];

const listReportsValidator = [
  query('status').optional().isIn(['all', ...Object.values(REPORT_STATUS)]).withMessage('Invalid status filter.'),
  query('type').optional().isIn(['all', ...REPORT_TYPES]).withMessage('Invalid type filter.'),
  query('department').optional().isIn(['all', ...DEPARTMENTS]).withMessage('Invalid department filter.'),
  query('from').optional().isISO8601().withMessage('from must be a valid date.'),
  query('to').optional().isISO8601().withMessage('to must be a valid date.'),
];

module.exports = {
  createReportValidator,
  updateReportValidator,
  updateReportStatusValidator,
  listReportsValidator,
};

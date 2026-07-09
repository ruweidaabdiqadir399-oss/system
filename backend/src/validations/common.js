const { param, query } = require('express-validator');

const idParam = (name = 'id') => param(name).trim().notEmpty().withMessage(`${name} is required.`);

const paginationQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer.'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('pageSize must be between 1 and 100.'),
];

module.exports = { idParam, paginationQuery };

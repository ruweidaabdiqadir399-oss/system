const { body, query } = require('express-validator');
const { ROLES, USER_STATUS } = require('../constants');

const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Provide a valid email address.'),
  body('password').optional({ checkFalsy: true }).isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role.'),
  body('phone').optional().isString(),
  body('status').optional().isIn(Object.values(USER_STATUS)).withMessage('Invalid status.'),
];

const updateUserValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('email').optional().trim().isEmail().withMessage('Provide a valid email address.'),
  body('role').optional().isIn(Object.values(ROLES)).withMessage('Invalid role.'),
  body('status').optional().isIn(Object.values(USER_STATUS)).withMessage('Invalid status.'),
  body('phone').optional().isString(),
];

const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty.'),
  body('phone').optional().isString(),
  body('email').not().exists().withMessage('Email cannot be changed here.'),
  body('role').not().exists().withMessage('Role cannot be changed here.'),
];

const listUsersValidator = [
  query('role').optional().isIn(['all', ...Object.values(ROLES)]).withMessage('Invalid role filter.'),
  query('status').optional().isIn(['all', ...Object.values(USER_STATUS)]).withMessage('Invalid status filter.'),
];

module.exports = {
  createUserValidator,
  updateUserValidator,
  updateProfileValidator,
  listUsersValidator,
};

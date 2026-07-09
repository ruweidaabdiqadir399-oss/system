const { body } = require('express-validator');

const PASSWORD_MIN_LENGTH = 6;

const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required.'),
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Provide a valid email address.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: PASSWORD_MIN_LENGTH }).withMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`),
  body('phone').optional().isString(),
];

const loginValidator = [
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Provide a valid email address.'),
  body('password').notEmpty().withMessage('Password is required.'),
];

const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('refreshToken is required.'),
];

const forgotPasswordValidator = [
  body('email').trim().notEmpty().withMessage('Email is required.').isEmail().withMessage('Provide a valid email address.'),
];

const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required.'),
  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: PASSWORD_MIN_LENGTH }).withMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters.`),
];

const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required.'),
  body('newPassword')
    .notEmpty().withMessage('New password is required.')
    .isLength({ min: PASSWORD_MIN_LENGTH }).withMessage(`New password must be at least ${PASSWORD_MIN_LENGTH} characters.`),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
};

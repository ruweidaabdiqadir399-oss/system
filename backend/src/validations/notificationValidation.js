const { body } = require('express-validator');
const { NOTIFICATION_TYPE, NOTIFICATION_AUDIENCE } = require('../constants');

const createNotificationValidator = [
  body('audience').isIn(NOTIFICATION_AUDIENCE).withMessage(`audience must be one of: ${NOTIFICATION_AUDIENCE.join(', ')}.`),
  body('userId').optional({ nullable: true }).isString(),
  body('title').trim().notEmpty().withMessage('title is required.'),
  body('message').trim().notEmpty().withMessage('message is required.'),
  body('type').optional().isIn(Object.values(NOTIFICATION_TYPE)).withMessage('Invalid notification type.'),
];

module.exports = { createNotificationValidator };

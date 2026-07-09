const { body, param } = require('express-validator');
const { TICKET_STATUS } = require('../constants');

const verifyTicketValidator = [
  body('code').trim().notEmpty().withMessage('code is required.'),
];

const updateTicketStatusValidator = [
  param('id').trim().notEmpty(),
  body('status').isIn(Object.values(TICKET_STATUS)).withMessage('Invalid ticket status.'),
];

module.exports = { verifyTicketValidator, updateTicketStatusValidator };

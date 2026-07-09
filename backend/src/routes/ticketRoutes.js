const express = require('express');
const ticketController = require('../controllers/ticketController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const {
  verifyTicketValidator,
  updateTicketStatusValidator,
} = require('../validations/ticketValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /tickets:
 *   get:
 *     summary: List tickets (own tickets for customers, all for admin/staff/driver)
 *     tags: [Tickets]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, Valid, Used, Cancelled] }
 *       - in: query
 *         name: bookingId
 *         schema: { type: string }
 *       - in: query
 *         name: scheduleId
 *         schema: { type: string }
 *       - in: query
 *         name: customerId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated list of tickets }
 */
router.get('/', paginationQuery, validate, ticketController.getTickets);

/**
 * @swagger
 * /tickets/verify:
 *   post:
 *     summary: Verify a ticket by its QR payload or ID and mark it as used
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, description: 'Ticket ID or QR payload' }
 *     responses:
 *       200: { description: Ticket verified }
 *       404: { description: No ticket matches this code }
 *       409: { description: Ticket cancelled }
 */
router.post(
  '/verify',
  authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.DRIVER),
  verifyTicketValidator,
  validate,
  ticketController.verifyTicket
);

/**
 * @swagger
 * /tickets/board:
 *   post:
 *     summary: Validate a QR code and mark the ticket as Boarded
 *     tags: [Tickets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, description: 'Ticket ID or QR payload from scanned QR code' }
 *     responses:
 *       200: { description: Passenger boarded }
 *       404: { description: Ticket not found }
 *       409: { description: Already boarded, cancelled, or wrong travel date }
 */
router.post(
  '/board',
  authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.DRIVER),
  verifyTicketValidator,
  validate,
  ticketController.boardTicket
);

/**
 * @swagger
 * /tickets/{id}:
 *   get:
 *     summary: Get a ticket by ID
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Ticket found }
 *       404: { description: Ticket not found }
 */
router.get('/:id', idParam(), validate, ticketController.getTicketById);

/**
 * @swagger
 * /tickets/{id}/status:
 *   patch:
 *     summary: Manually update a ticket's status
 *     tags: [Tickets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [Valid, Used, Cancelled] }
 *     responses:
 *       200: { description: Ticket status updated }
 */
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN, ROLES.STAFF),
  updateTicketStatusValidator,
  validate,
  ticketController.updateTicketStatus
);

module.exports = router;

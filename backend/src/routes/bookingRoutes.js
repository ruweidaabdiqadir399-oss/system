const express = require('express');
const bookingController = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const {
  createBookingValidator,
  updateBookingStatusValidator,
} = require('../validations/bookingValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /bookings:
 *   get:
 *     summary: List bookings (own bookings for customers, all for admin/staff)
 *     tags: [Bookings]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, Confirmed, Pending, Cancelled, Completed] }
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
 *       200: { description: Paginated list of bookings }
 *   post:
 *     summary: Create a booking and reserve seats on a schedule
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scheduleId, seatNumbers]
 *             properties:
 *               scheduleId: { type: string, example: 'SCH-0842' }
 *               seatNumbers: { type: array, items: { type: string }, example: ['A1', 'A2'] }
 *               passengers: { type: array, items: { $ref: '#/components/schemas/Passenger' } }
 *               paymentMethod: { type: string, enum: [Card, Mobile Money, Cash] }
 *               customerId: { type: string, description: 'Admin/staff only - book on behalf of a customer' }
 *     responses:
 *       201: { description: Booking created }
 *       409: { description: Seat conflict or schedule not bookable }
 */
router
  .route('/')
  .get(paginationQuery, validate, bookingController.getBookings)
  .post(createBookingValidator, validate, bookingController.createBooking);

/**
 * @swagger
 * /bookings/{id}:
 *   get:
 *     summary: Get a booking by ID
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking found }
 *       404: { description: Booking not found }
 */
router.get('/:id', idParam(), validate, bookingController.getBookingById);

/**
 * @swagger
 * /bookings/{id}/status:
 *   patch:
 *     summary: Update a booking's status
 *     tags: [Bookings]
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
 *               status: { type: string, enum: [Confirmed, Pending, Completed] }
 *     responses:
 *       200: { description: Booking status updated }
 */
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN, ROLES.STAFF),
  idParam(),
  updateBookingStatusValidator,
  validate,
  bookingController.updateBookingStatus
);

/**
 * @swagger
 * /bookings/{id}/cancel:
 *   patch:
 *     summary: Cancel a booking, freeing its seats and tickets
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking cancelled }
 *       400: { description: Booking cannot be cancelled }
 */
router.patch('/:id/cancel', idParam(), validate, bookingController.cancelBooking);

module.exports = router;

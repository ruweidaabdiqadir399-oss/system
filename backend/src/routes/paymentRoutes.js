const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const { createPaymentValidator } = require('../validations/paymentValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: List payments (own payments for customers, all for admin/staff)
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, Completed, Pending, Failed, Refunded] }
 *       - in: query
 *         name: method
 *         schema: { type: string, enum: [all, Card, Mobile Money, Cash] }
 *       - in: query
 *         name: bookingId
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
 *       200: { description: Paginated list of payments }
 *   post:
 *     summary: Process a payment for a booking, confirming it and issuing tickets
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, amount, method]
 *             properties:
 *               bookingId: { type: string, example: 'BK-100001' }
 *               amount: { type: number }
 *               method: { type: string, enum: [Card, Mobile Money, Cash] }
 *     responses:
 *       201: { description: Payment processed }
 *       409: { description: Booking already paid or cancelled }
 */
router.get('/summary', authorize(ROLES.ADMIN, ROLES.STAFF), paymentController.getPaymentSummary);

router
  .route('/')
  .get(paginationQuery, validate, paymentController.getPayments)
  .post(createPaymentValidator, validate, paymentController.createPayment);

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Get a payment by ID
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Payment found }
 *       404: { description: Payment not found }
 */
router.get('/:id', idParam(), validate, paymentController.getPaymentById);

/**
 * @swagger
 * /payments/{id}/refund:
 *   patch:
 *     summary: Refund a completed payment
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Payment refunded }
 *       409: { description: Only completed payments can be refunded }
 */
router.patch('/:id/refund', authorize(ROLES.ADMIN, ROLES.STAFF), idParam(), validate, paymentController.refundPayment);

module.exports = router;

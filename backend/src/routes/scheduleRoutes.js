const express = require('express');
const scheduleController = require('../controllers/scheduleController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const {
  createScheduleValidator,
  updateScheduleValidator,
  updateScheduleStatusValidator,
} = require('../validations/scheduleValidation');
const { ROLES } = require('../constants');

const router = express.Router();

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: List trip schedules
 *     tags: [Schedules]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *       - in: query
 *         name: routeId
 *         schema: { type: string }
 *       - in: query
 *         name: busId
 *         schema: { type: string }
 *       - in: query
 *         name: driverId
 *         schema: { type: string }
 *       - in: query
 *         name: date
 *         schema: { type: string, example: '2026-06-14' }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated list of schedules }
 *   post:
 *     summary: Create a new trip schedule
 *     tags: [Schedules]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Schedule' }
 *     responses:
 *       201: { description: Schedule created }
 *       400: { description: Invalid route or bus ID }
 */
router
  .route('/')
  .get(paginationQuery, validate, scheduleController.getSchedules)
  .post(
    protect,
    authorize(ROLES.ADMIN, ROLES.STAFF),
    createScheduleValidator,
    validate,
    scheduleController.createSchedule
  );

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     summary: Get a schedule by ID
 *     tags: [Schedules]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Schedule found }
 *       404: { description: Schedule not found }
 *   patch:
 *     summary: Update a schedule's details
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Schedule' }
 *     responses:
 *       200: { description: Schedule updated }
 *   delete:
 *     summary: Delete a schedule
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Schedule deleted }
 *       409: { description: Schedule has active bookings }
 */
/**
 * @swagger
 * /schedules/{id}/seats:
 *   get:
 *     summary: Get the seat map (booked seat numbers) for a schedule
 *     tags: [Schedules]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Seat map }
 *       404: { description: Schedule not found }
 */
router.get('/:id/seats', idParam(), validate, scheduleController.getScheduleSeatMap);

router
  .route('/:id')
  .get(idParam(), validate, scheduleController.getScheduleById)
  .patch(
    protect,
    authorize(ROLES.ADMIN, ROLES.STAFF),
    idParam(),
    updateScheduleValidator,
    validate,
    scheduleController.updateSchedule
  )
  .delete(protect, authorize(ROLES.ADMIN), idParam(), validate, scheduleController.deleteSchedule);

/**
 * @swagger
 * /schedules/{id}/status:
 *   patch:
 *     summary: Update a schedule's status
 *     tags: [Schedules]
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
 *               status:
 *                 type: string
 *                 enum: [Scheduled, Boarding, Departed, In Transit, Delayed, Arrived, Completed, Cancelled]
 *     responses:
 *       200: { description: Schedule status updated }
 *       403: { description: Not your assigned schedule }
 */
router.patch(
  '/:id/status',
  protect,
  authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.DRIVER),
  idParam(),
  updateScheduleStatusValidator,
  validate,
  scheduleController.updateScheduleStatus
);

/**
 * @swagger
 * /schedules/{id}/start:
 *   post:
 *     summary: Driver starts an assigned trip (Boarding → On Trip)
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Trip started }
 *       400: { description: Not in Boarding status or already started }
 *       403: { description: Not your assigned schedule }
 */
router.post(
  '/:id/start',
  protect,
  authorize(ROLES.DRIVER),
  idParam(),
  validate,
  scheduleController.startTrip
);

/**
 * @swagger
 * /schedules/{id}/complete:
 *   post:
 *     summary: Driver completes an assigned trip (On Trip → Completed)
 *     tags: [Schedules]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Trip completed }
 *       400: { description: Not in On Trip status or already completed }
 *       403: { description: Not your assigned schedule }
 */
router.post(
  '/:id/complete',
  protect,
  authorize(ROLES.DRIVER),
  idParam(),
  validate,
  scheduleController.completeTrip
);

module.exports = router;

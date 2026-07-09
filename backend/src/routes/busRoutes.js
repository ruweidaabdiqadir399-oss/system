const express = require('express');
const busController = require('../controllers/busController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const {
  createBusValidator,
  updateBusValidator,
  assignDriverValidator,
} = require('../validations/busValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN, ROLES.STAFF));

/**
 * @swagger
 * /buses/stats:
 *   get:
 *     summary: Get fleet counts grouped by status
 *     tags: [Buses]
 *     responses:
 *       200: { description: Bus status counts }
 */
router.get('/stats', busController.getBusStats);

/**
 * @swagger
 * /buses:
 *   get:
 *     summary: List buses
 *     tags: [Buses]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, Active, Maintenance, Inactive] }
 *       - in: query
 *         name: acType
 *         schema: { type: string, enum: [all, AC, Non-AC] }
 *       - in: query
 *         name: seatType
 *         schema: { type: string, enum: [all, Sleeper, Seater] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated list of buses }
 *   post:
 *     summary: Add a new bus to the fleet
 *     tags: [Buses]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Bus' }
 *     responses:
 *       201: { description: Bus created }
 *       409: { description: Bus number already in use }
 */
router
  .route('/')
  .get(paginationQuery, validate, busController.getBuses)
  .post(authorize(ROLES.ADMIN), createBusValidator, validate, busController.createBus);

/**
 * @swagger
 * /buses/{id}:
 *   get:
 *     summary: Get a bus by ID
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Bus found }
 *       404: { description: Bus not found }
 *   patch:
 *     summary: Update a bus
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Bus' }
 *     responses:
 *       200: { description: Bus updated }
 *   delete:
 *     summary: Remove a bus from the fleet
 *     tags: [Buses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Bus deleted }
 *       409: { description: Bus has active schedules }
 */
router
  .route('/:id')
  .get(idParam(), validate, busController.getBusById)
  .put(authorize(ROLES.ADMIN), idParam(), updateBusValidator, validate, busController.updateBus)
  .patch(authorize(ROLES.ADMIN), idParam(), updateBusValidator, validate, busController.updateBus)
  .delete(authorize(ROLES.ADMIN), idParam(), validate, busController.deleteBus);

/**
 * @swagger
 * /buses/{id}/assign-driver:
 *   patch:
 *     summary: Assign a driver to a bus
 *     tags: [Buses]
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
 *             required: [driverId]
 *             properties:
 *               driverId: { type: string, example: 'USR-3001' }
 *     responses:
 *       200: { description: Driver assigned }
 *       400: { description: No driver found with that ID }
 */
router.patch('/:id/assign-driver', idParam(), assignDriverValidator, validate, busController.assignDriver);

module.exports = router;

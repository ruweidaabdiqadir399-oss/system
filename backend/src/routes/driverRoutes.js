const express = require('express');
const driverController = require('../controllers/driverController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const { createDriverValidator, updateDriverValidator } = require('../validations/driverValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /drivers/me:
 *   get:
 *     summary: Get the authenticated driver's own profile
 *     tags: [Drivers]
 *     responses:
 *       200: { description: Driver profile }
 */
router.get('/me', authorize(ROLES.DRIVER), driverController.getMyProfile);
router.patch('/me', authorize(ROLES.DRIVER), driverController.updateMyProfile);
router.get('/me/bus', authorize(ROLES.DRIVER), driverController.getMyBus);

/**
 * @swagger
 * /drivers:
 *   get:
 *     summary: List driver users with their operational profile
 *     tags: [Drivers]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, Active, Inactive, Suspended, On Leave] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated list of drivers }
 *   post:
 *     summary: Create an operational profile for an existing driver user
 *     tags: [Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId, licenseNumber, licenseExpiry]
 *             properties:
 *               userId: { type: string, example: 'USR-3001' }
 *               licenseNumber: { type: string }
 *               licenseExpiry: { type: string, format: date }
 *               assignedBusId: { type: string, nullable: true }
 *     responses:
 *       201: { description: Driver profile created }
 *       409: { description: Driver profile already exists }
 */
router
  .route('/')
  .get(authorize(ROLES.ADMIN, ROLES.STAFF), paginationQuery, validate, driverController.getDrivers)
  .post(authorize(ROLES.ADMIN), createDriverValidator, validate, driverController.createDriverProfile);

/**
 * @swagger
 * /drivers/{userId}:
 *   get:
 *     summary: Get a driver by user ID
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Driver found }
 *       404: { description: Driver not found }
 *   patch:
 *     summary: Update a driver's operational profile
 *     tags: [Drivers]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licenseNumber: { type: string }
 *               licenseExpiry: { type: string, format: date }
 *               rating: { type: number }
 *               totalTrips: { type: number }
 *               assignedBusId: { type: string, nullable: true }
 *     responses:
 *       200: { description: Driver profile updated }
 *       404: { description: Driver profile not found }
 */
router
  .route('/:userId')
  .get(authorize(ROLES.ADMIN, ROLES.STAFF), idParam('userId'), validate, driverController.getDriverById)
  .patch(authorize(ROLES.ADMIN), idParam('userId'), updateDriverValidator, validate, driverController.updateDriver);

router.patch('/:userId/assign-bus', authorize(ROLES.ADMIN), idParam('userId'), validate, driverController.assignBus);

module.exports = router;

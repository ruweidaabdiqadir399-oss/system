const express = require('express');
const trackingController = require('../controllers/trackingController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam } = require('../validations/common');
const { updateTrackingValidator } = require('../validations/trackingValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /tracking:
 *   get:
 *     summary: List live tracking data for the fleet
 *     tags: [Tracking]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, On Time, Delayed, Offline] }
 *       - in: query
 *         name: routeId
 *         schema: { type: string }
 *     responses:
 *       200: { description: Live tracking data }
 */
router.get('/', trackingController.getTrackingList);

/**
 * @swagger
 * /tracking/{busId}:
 *   get:
 *     summary: Get live tracking data for a single bus
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: busId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Tracking data found }
 *       404: { description: No tracking data for this bus }
 *   patch:
 *     summary: Update (or create) live tracking data for a bus
 *     tags: [Tracking]
 *     parameters:
 *       - in: path
 *         name: busId
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [On Time, Delayed, Offline] }
 *               speedKmh: { type: number }
 *               heading: { type: number }
 *               currentLocation: { type: string }
 *               nextStop: { type: string }
 *               etaMinutes: { type: number, nullable: true }
 *               fuelLevel: { type: number }
 *               passengerCount: { type: number }
 *     responses:
 *       200: { description: Tracking data updated }
 *       403: { description: Not your assigned bus }
 */
router
  .route('/:busId')
  .get(idParam('busId'), validate, trackingController.getTrackingByBus)
  .patch(
    authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.DRIVER),
    idParam('busId'),
    updateTrackingValidator,
    validate,
    trackingController.updateTracking
  );

module.exports = router;

const express = require('express');
const settingsController = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { updateSettingsValidator } = require('../validations/settingsValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN, ROLES.STAFF));

/**
 * @swagger
 * /settings:
 *   get:
 *     summary: Get application settings
 *     tags: [Settings]
 *     responses:
 *       200: { description: Application settings }
 */
router.get('/', settingsController.getSettings);

/**
 * @swagger
 * /settings/{section}:
 *   patch:
 *     summary: Update a section of the application settings
 *     tags: [Settings]
 *     parameters:
 *       - in: path
 *         name: section
 *         required: true
 *         schema: { type: string, enum: [general, booking, notifications, payments, system] }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { type: object }
 *     responses:
 *       200: { description: Settings updated }
 *       400: { description: Invalid section }
 */
router.patch('/:section', authorize(ROLES.ADMIN), updateSettingsValidator, validate, settingsController.updateSettingsSection);

module.exports = router;

const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const { createNotificationValidator } = require('../validations/notificationValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: List notifications for the authenticated user
 *     tags: [Notifications]
 *     parameters:
 *       - in: query
 *         name: read
 *         schema: { type: string, enum: ['true', 'false'] }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated list of notifications }
 *   post:
 *     summary: Create a notification for an audience or a specific user
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [audience, title, message]
 *             properties:
 *               audience: { type: string, enum: [admin, staff, driver, customer] }
 *               userId: { type: string, nullable: true, description: 'Target a specific user instead of the whole audience' }
 *               title: { type: string }
 *               message: { type: string }
 *               type: { type: string, enum: [info, success, warning, error] }
 *     responses:
 *       201: { description: Notification created }
 */
router
  .route('/')
  .get(paginationQuery, validate, notificationController.getNotifications)
  .post(authorize(ROLES.ADMIN, ROLES.STAFF), createNotificationValidator, validate, notificationController.createNotification);

/**
 * @swagger
 * /notifications/unread-count:
 *   get:
 *     summary: Get the count of unread notifications for the authenticated user
 *     tags: [Notifications]
 *     responses:
 *       200: { description: Unread count }
 */
router.get('/unread-count', notificationController.getUnreadCount);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all of the authenticated user's notifications as read
 *     tags: [Notifications]
 *     responses:
 *       200: { description: All notifications marked as read }
 */
router.patch('/read-all', notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{id}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification marked as read }
 *       403: { description: Notification not addressed to you }
 */
router.patch('/:id/read', idParam(), validate, notificationController.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Notifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Notification deleted }
 */
router.delete('/:id', authorize(ROLES.ADMIN, ROLES.STAFF), idParam(), validate, notificationController.deleteNotification);

module.exports = router;

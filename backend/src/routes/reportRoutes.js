const express = require('express');
const reportController = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { paginationQuery } = require('../validations/common');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN, ROLES.STAFF));

/**
 * @swagger
 * /reports/dashboard:
 *   get:
 *     summary: Get aggregate statistics for the admin/staff dashboard
 *     tags: [Reports]
 *     responses:
 *       200: { description: Dashboard statistics }
 */
router.get('/dashboard', reportController.getDashboardStats);

/**
 * @swagger
 * /reports/revenue:
 *   get:
 *     summary: Get daily revenue totals for completed payments
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200: { description: Revenue report }
 */
router.get('/revenue', reportController.getRevenueReport);

/**
 * @swagger
 * /reports/routes:
 *   get:
 *     summary: Get booking and revenue performance per route
 *     tags: [Reports]
 *     responses:
 *       200: { description: Route performance report }
 */
router.get('/routes', reportController.getRoutePerformance);

/**
 * @swagger
 * /reports/audit-logs:
 *   get:
 *     summary: List audit log entries
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *       - in: query
 *         name: entity
 *         schema: { type: string }
 *       - in: query
 *         name: userId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated audit log entries }
 */
router.get('/audit-logs', authorize(ROLES.ADMIN), paginationQuery, validate, reportController.getAuditLogs);

module.exports = router;

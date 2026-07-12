const express = require('express');
const staffReportController = require('../controllers/staffReportController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const {
  createReportValidator,
  updateReportValidator,
  updateReportStatusValidator,
  listReportsValidator,
} = require('../validations/staffReportValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect, authorize(ROLES.ADMIN, ROLES.STAFF));

/**
 * @swagger
 * /staff-reports:
 *   get:
 *     summary: List reports (own reports for staff, all reports for admin)
 *     tags: [StaffReports]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, Pending, In Review, Resolved, Closed] }
 *       - in: query
 *         name: department
 *         schema: { type: string }
 *       - in: query
 *         name: type
 *         schema: { type: string }
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated list of reports }
 *   post:
 *     summary: Submit a new report (staff only)
 *     tags: [StaffReports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, type, description]
 *             properties:
 *               title: { type: string }
 *               type: { type: string }
 *               description: { type: string }
 *     responses:
 *       201: { description: Report submitted }
 */
router
  .route('/')
  .get(listReportsValidator, paginationQuery, validate, staffReportController.getReports)
  .post(authorize(ROLES.STAFF), createReportValidator, validate, staffReportController.createReport);

/**
 * @swagger
 * /staff-reports/{id}:
 *   get:
 *     summary: Get a report by ID
 *     tags: [StaffReports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Report found }
 *       404: { description: Report not found }
 *   patch:
 *     summary: Update a report's content (author only, Pending reports only)
 *     tags: [StaffReports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Report updated }
 *   delete:
 *     summary: Delete a report (admin can delete any; staff only their own Pending reports)
 *     tags: [StaffReports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Report deleted }
 */
router
  .route('/:id')
  .get(idParam(), validate, staffReportController.getReportById)
  .patch(authorize(ROLES.STAFF), idParam(), updateReportValidator, validate, staffReportController.updateReport)
  .delete(idParam(), validate, staffReportController.deleteReport);

/**
 * @swagger
 * /staff-reports/{id}/status:
 *   patch:
 *     summary: Update a report's status and/or admin remarks (admin only)
 *     tags: [StaffReports]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [Pending, In Review, Resolved, Closed] }
 *               adminRemarks: { type: string }
 *     responses:
 *       200: { description: Report status updated }
 */
router.patch(
  '/:id/status',
  authorize(ROLES.ADMIN),
  idParam(),
  updateReportStatusValidator,
  validate,
  staffReportController.updateReportStatus
);

module.exports = router;

const express = require('express');
const ApiError = require('../utils/ApiError');
const supportRequestController = require('../controllers/supportRequestController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const {
  createSupportRequestValidator,
  updateSupportRequestValidator,
  listSupportRequestsValidator,
} = require('../validations/supportRequestValidation');
const { ROLES, SUPPORT_DEPARTMENT } = require('../constants');

const router = express.Router();

// Only admins (full access) or Staff users in the Customer Service
// department may reply to / update the status of a support request.
const requireAdminOrSupportStaff = (req, res, next) => {
  if (req.user.role === ROLES.ADMIN) return next();
  if (req.user.role === ROLES.STAFF && req.user.department === SUPPORT_DEPARTMENT) return next();
  throw ApiError.forbidden('Only admins or Customer Service staff can perform this action.');
};

router.use(protect);

/**
 * @swagger
 * /support-requests:
 *   get:
 *     summary: List support requests (own for customers, all for admin/Customer Service staff)
 *     tags: [SupportRequests]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, Open, In Progress, Resolved, Closed] }
 *       - in: query
 *         name: category
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated list of support requests }
 *   post:
 *     summary: Submit a new support request (customer only)
 *     tags: [SupportRequests]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subject, category, message]
 *             properties:
 *               subject: { type: string }
 *               category: { type: string }
 *               message: { type: string }
 *     responses:
 *       201: { description: Support request submitted }
 */
router
  .route('/')
  .get(
    authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER),
    listSupportRequestsValidator,
    paginationQuery,
    validate,
    supportRequestController.getSupportRequests
  )
  .post(authorize(ROLES.CUSTOMER), createSupportRequestValidator, validate, supportRequestController.createSupportRequest);

/**
 * @swagger
 * /support-requests/{id}:
 *   get:
 *     summary: Get a support request by ID
 *     tags: [SupportRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Support request found }
 *       404: { description: Support request not found }
 *   patch:
 *     summary: Reply to and/or update the status of a support request (admin, Customer Service staff)
 *     tags: [SupportRequests]
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
 *               reply: { type: string }
 *               status: { type: string, enum: [Open, In Progress, Resolved, Closed] }
 *     responses:
 *       200: { description: Support request updated }
 *   delete:
 *     summary: Delete a support request (admin only)
 *     tags: [SupportRequests]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Support request deleted }
 */
router
  .route('/:id')
  .get(authorize(ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER), idParam(), validate, supportRequestController.getSupportRequestById)
  .patch(requireAdminOrSupportStaff, idParam(), updateSupportRequestValidator, validate, supportRequestController.updateSupportRequest)
  .delete(authorize(ROLES.ADMIN), idParam(), validate, supportRequestController.deleteSupportRequest);

module.exports = router;

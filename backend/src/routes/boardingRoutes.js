const express = require('express');
const { getBoardingHistory } = require('../controllers/boardingController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { paginationQuery } = require('../validations/common');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /boarding:
 *   get:
 *     summary: List boarding history (searchable and date-filterable)
 *     tags: [Boarding]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Search by ticket ID, passenger name, or bus number
 *       - in: query
 *         name: dateFilter
 *         schema: { type: string, enum: [all, today, yesterday, this-week, custom] }
 *       - in: query
 *         name: date
 *         schema: { type: string, example: '2026-06-28' }
 *         description: Required when dateFilter=custom
 *       - in: query
 *         name: busId
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated boarding history }
 */
router.get(
  '/',
  authorize(ROLES.ADMIN, ROLES.STAFF),
  paginationQuery,
  validate,
  getBoardingHistory
);

module.exports = router;

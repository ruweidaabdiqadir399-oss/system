const express = require('express');
const routeController = require('../controllers/routeController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const { idParam, paginationQuery } = require('../validations/common');
const { createRouteValidator, updateRouteValidator } = require('../validations/routeValidation');
const { ROLES } = require('../constants');

const router = express.Router();

/**
 * @swagger
 * /routes:
 *   get:
 *     summary: List routes
 *     tags: [Routes]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [all, Active, Suspended] }
 *       - in: query
 *         name: region
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer }
 *     responses:
 *       200: { description: Paginated list of routes }
 *   post:
 *     summary: Create a new route
 *     tags: [Routes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Route' }
 *     responses:
 *       201: { description: Route created }
 *       409: { description: Route code already in use }
 */
router
  .route('/')
  .get(paginationQuery, validate, routeController.getRoutes)
  .post(protect, authorize(ROLES.ADMIN), createRouteValidator, validate, routeController.createRoute);

/**
 * @swagger
 * /routes/{id}:
 *   get:
 *     summary: Get a route by ID
 *     tags: [Routes]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Route found }
 *       404: { description: Route not found }
 *   patch:
 *     summary: Update a route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/Route' }
 *     responses:
 *       200: { description: Route updated }
 *   delete:
 *     summary: Delete a route
 *     tags: [Routes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Route deleted }
 *       409: { description: Route has active schedules }
 */
router
  .route('/:id')
  .get(idParam(), validate, routeController.getRouteById)
  .patch(protect, authorize(ROLES.ADMIN), idParam(), updateRouteValidator, validate, routeController.updateRoute)
  .delete(protect, authorize(ROLES.ADMIN), idParam(), validate, routeController.deleteRoute);

module.exports = router;

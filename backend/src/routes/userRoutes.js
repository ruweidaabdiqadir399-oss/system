const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');
const upload = require('../middlewares/upload');
const { idParam, paginationQuery } = require('../validations/common');
const {
  createUserValidator,
  updateUserValidator,
  updateProfileValidator,
  listUsersValidator,
} = require('../validations/userValidation');
const { ROLES } = require('../constants');

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * /users/profile:
 *   patch:
 *     summary: Update the authenticated user's own profile
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200: { description: Profile updated }
 */
router.patch('/profile', updateProfileValidator, validate, userController.updateProfile);

/**
 * @swagger
 * /users/avatar:
 *   post:
 *     summary: Upload the authenticated user's avatar image
 *     tags: [Users]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar: { type: string, format: binary }
 *     responses:
 *       200: { description: Avatar uploaded }
 */
router.post('/avatar', upload.single('avatar'), userController.uploadAvatar);

/**
 * @swagger
 * /users/counts:
 *   get:
 *     summary: Get user counts grouped by role
 *     tags: [Users]
 *     responses:
 *       200: { description: User counts }
 */
router.get('/counts', authorize(ROLES.ADMIN, ROLES.STAFF), userController.getUserCounts);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List users
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [all, admin, staff, driver, customer] }
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
 *       200: { description: Paginated list of users }
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/User' }
 *     responses:
 *       201: { description: User created }
 *       409: { description: Email already in use }
 */
router
  .route('/')
  .get(authorize(ROLES.ADMIN, ROLES.STAFF), listUsersValidator, paginationQuery, validate, userController.getUsers)
  .post(authorize(ROLES.ADMIN), createUserValidator, validate, userController.createUser);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User found }
 *       404: { description: User not found }
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/User' }
 *     responses:
 *       200: { description: User updated }
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: User deleted }
 */
router
  .route('/:id')
  .get(authorize(ROLES.ADMIN, ROLES.STAFF), idParam(), validate, userController.getUserById)
  .patch(authorize(ROLES.ADMIN), idParam(), updateUserValidator, validate, userController.updateUser)
  .delete(authorize(ROLES.ADMIN), idParam(), validate, userController.deleteUser);

module.exports = router;

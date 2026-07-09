const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ok, created, paginated } = require('../utils/ApiResponse');
const paginate = require('../utils/paginate');
const generateId = require('../utils/generateId');
const { Notification } = require('../models');

const ownNotificationFilter = (user) => ({
  $or: [
    { audience: user.role, userId: null },
    { userId: user._id },
  ],
});

// @desc    List notifications for the authenticated user
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const { read, page, pageSize } = req.query;

  const filter = ownNotificationFilter(req.user);
  if (read === 'true') filter.read = true;
  if (read === 'false') filter.read = false;

  const result = await paginate(Notification, filter, { page, pageSize, sort: '-timestamp' });
  paginated(res, result, 'Notifications fetched successfully.');
});

// @desc    Get the count of unread notifications for the authenticated user
// @route   GET /api/v1/notifications/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ ...ownNotificationFilter(req.user), read: false });
  ok(res, { count }, 'Unread notification count fetched successfully.');
});

// @desc    Create a notification for an audience or a specific user
// @route   POST /api/v1/notifications
// @access  Private (admin, staff)
const createNotification = asyncHandler(async (req, res) => {
  const _id = await generateId('NTF', 'NTF-', 33, 3);
  const notification = await Notification.create({ _id, ...req.body });
  created(res, notification, 'Notification created successfully.');
});

// @desc    Mark a notification as read
// @route   PATCH /api/v1/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found.');

  const isAddressedToUser =
    notification.userId === req.user._id ||
    (notification.userId === null && notification.audience === req.user.role);
  if (!isAddressedToUser) {
    throw ApiError.forbidden('This notification was not addressed to you.');
  }

  notification.read = true;
  await notification.save();

  ok(res, notification, 'Notification marked as read.');
});

// @desc    Mark all of the authenticated user's notifications as read
// @route   PATCH /api/v1/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ ...ownNotificationFilter(req.user), read: false }, { read: true });
  ok(res, null, 'All notifications marked as read.');
});

// @desc    Delete a notification
// @route   DELETE /api/v1/notifications/:id
// @access  Private (admin, staff)
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw ApiError.notFound('Notification not found.');

  await notification.deleteOne();
  ok(res, { id: notification._id }, 'Notification deleted successfully.');
});

module.exports = {
  getNotifications,
  getUnreadCount,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};

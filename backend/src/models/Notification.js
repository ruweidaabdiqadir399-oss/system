const mongoose = require('mongoose');
const { NOTIFICATION_TYPE, NOTIFICATION_AUDIENCE } = require('../constants');

const notificationSchema = new mongoose.Schema(
  {
    _id: { type: String },
    audience: { type: String, enum: NOTIFICATION_AUDIENCE, required: true },
    userId: { type: String, ref: 'User', default: null },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: Object.values(NOTIFICATION_TYPE),
      default: NOTIFICATION_TYPE.INFO,
    },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

notificationSchema.index({ audience: 1, userId: 1 });
notificationSchema.index({ read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

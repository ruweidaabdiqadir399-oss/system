const mongoose = require('mongoose');
const { SUPPORT_CATEGORIES, SUPPORT_STATUS } = require('../constants');

const supportRequestSchema = new mongoose.Schema(
  {
    _id: { type: String },
    customer: { type: String, ref: 'User', required: true },
    subject: { type: String, required: [true, 'Subject is required.'], trim: true },
    category: { type: String, enum: SUPPORT_CATEGORIES, required: [true, 'Category is required.'] },
    message: { type: String, required: [true, 'Message is required.'], trim: true },
    reply: { type: String, default: '', trim: true },
    // First Customer Service staff member to act on the request.
    assignedStaff: { type: String, ref: 'User', default: null },
    // Most recent Customer Service staff member to reply/update the request.
    handledBy: { type: String, ref: 'User', default: null },
    // Staff member (or admin) who set the request's status to Resolved.
    resolvedBy: { type: String, ref: 'User', default: null },
    // Timestamp of the most recent staff reply/update.
    responseDate: { type: Date, default: null },
    status: {
      type: String,
      enum: Object.values(SUPPORT_STATUS),
      default: SUPPORT_STATUS.OPEN,
    },
  },
  { timestamps: true }
);

supportRequestSchema.index({ customer: 1 });
supportRequestSchema.index({ status: 1 });
supportRequestSchema.index({ category: 1 });
supportRequestSchema.index({ assignedStaff: 1 });
supportRequestSchema.index({ handledBy: 1 });

module.exports = mongoose.model('SupportRequest', supportRequestSchema);

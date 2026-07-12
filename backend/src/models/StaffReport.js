const mongoose = require('mongoose');
const { REPORT_TYPES, REPORT_STATUS } = require('../constants');

const staffReportSchema = new mongoose.Schema(
  {
    _id: { type: String },
    title: { type: String, required: [true, 'Report title is required.'], trim: true },
    type: { type: String, enum: REPORT_TYPES, required: [true, 'Report type is required.'] },
    description: { type: String, required: [true, 'Description is required.'], trim: true },
    submittedBy: { type: String, ref: 'User', required: true },
    // Snapshot of the submitting staff member's department at submission time.
    // Not enum-restricted: some existing staff accounts predate the fixed
    // department list, or have no department set at all.
    department: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.PENDING,
    },
    adminRemarks: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

staffReportSchema.index({ submittedBy: 1 });
staffReportSchema.index({ status: 1 });
staffReportSchema.index({ department: 1 });
staffReportSchema.index({ type: 1 });

module.exports = mongoose.model('StaffReport', staffReportSchema);

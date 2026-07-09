const mongoose = require('mongoose');
const { AUDIT_ACTIONS } = require('../constants');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User', default: null },
    userName: { type: String, default: 'System' },
    action: { type: String, enum: Object.values(AUDIT_ACTIONS), required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);

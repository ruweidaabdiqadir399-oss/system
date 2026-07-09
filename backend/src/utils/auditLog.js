const { AuditLog } = require('../models');

/**
 * Records an audit trail entry. Failures are logged but never thrown -
 * auditing must not break the primary request flow.
 */
const logAudit = async ({ userId = null, userName = 'System', action, entity, entityId = null, details = {}, req = null }) => {
  try {
    await AuditLog.create({
      userId,
      userName,
      action,
      entity,
      entityId,
      details,
      ipAddress: req?.ip || '',
      userAgent: req?.headers?.['user-agent'] || '',
    });
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
};

module.exports = logAudit;

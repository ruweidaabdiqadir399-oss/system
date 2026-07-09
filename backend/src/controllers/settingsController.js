const asyncHandler = require('../utils/asyncHandler');
const { ok } = require('../utils/ApiResponse');
const logAudit = require('../utils/auditLog');
const { Settings } = require('../models');
const { AUDIT_ACTIONS } = require('../constants');

const SETTINGS_ID = 'app_settings';

const getOrCreateSettings = () =>
  Settings.findOneAndUpdate({ _id: SETTINGS_ID }, {}, { upsert: true, new: true, setDefaultsOnInsert: true });

// @desc    Get application settings
// @route   GET /api/v1/settings
// @access  Private (admin, staff)
const getSettings = asyncHandler(async (req, res) => {
  const settings = await getOrCreateSettings();
  ok(res, settings, 'Settings fetched successfully.');
});

// @desc    Update a section of the application settings
// @route   PATCH /api/v1/settings/:section
// @access  Private (admin)
const updateSettingsSection = asyncHandler(async (req, res) => {
  const { section } = req.params;
  const settings = await getOrCreateSettings();

  Object.assign(settings[section], req.body);
  await settings.save();

  await logAudit({
    userId: req.user._id,
    userName: req.user.name,
    action: AUDIT_ACTIONS.UPDATE,
    entity: 'Settings',
    entityId: section,
    details: req.body,
    req,
  });

  ok(res, settings, 'Settings updated successfully.');
});

module.exports = {
  getSettings,
  updateSettingsSection,
};

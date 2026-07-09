const { param, body } = require('express-validator');

const SETTINGS_SECTIONS = ['general', 'booking', 'notifications', 'payments', 'system'];

const updateSettingsValidator = [
  param('section').isIn(SETTINGS_SECTIONS).withMessage(`section must be one of: ${SETTINGS_SECTIONS.join(', ')}.`),
  body().isObject().withMessage('Request body must be an object.'),
];

module.exports = { updateSettingsValidator, SETTINGS_SECTIONS };

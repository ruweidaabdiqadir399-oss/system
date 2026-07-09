const mongoose = require('mongoose');

// Singleton document (fixed _id) holding application-wide configuration,
// mirroring the sections used by the BTMS frontend Settings page.
const settingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'app_settings' },
    general: {
      siteName: { type: String, default: 'BTMS - Bus Terminal Management System' },
      terminalName: { type: String, default: 'Central Terminal A' },
      supportEmail: { type: String, default: 'support@btms.so' },
      supportPhone: { type: String, default: '+252 61 000 0000' },
      timezone: { type: String, default: 'Africa/Mogadishu' },
      currency: { type: String, default: 'USD' },
    },
    booking: {
      advanceBookingDays: { type: Number, default: 30 },
      seatHoldMinutes: { type: Number, default: 15 },
      cancellationWindowHours: { type: Number, default: 4 },
      maxSeatsPerBooking: { type: Number, default: 6 },
      allowGuestBooking: { type: Boolean, default: true },
    },
    notifications: {
      emailBookingConfirmation: { type: Boolean, default: true },
      emailPaymentReceipt: { type: Boolean, default: true },
      smsDepartureReminder: { type: Boolean, default: true },
      driverDispatchAlerts: { type: Boolean, default: true },
    },
    payments: {
      enableCard: { type: Boolean, default: true },
      enableMobileMoney: { type: Boolean, default: true },
      enableCash: { type: Boolean, default: true },
      taxRatePercent: { type: Number, default: 0 },
      refundProcessingDays: { type: Number, default: 5 },
    },
    system: {
      maintenanceMode: { type: Boolean, default: false },
      appVersion: { type: String, default: '1.0.0' },
      lastBackup: { type: Date, default: Date.now },
    },
  },
  { timestamps: true, minimize: false }
);

module.exports = mongoose.model('Settings', settingsSchema);

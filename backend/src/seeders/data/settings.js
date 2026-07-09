// Seed data mirroring bus-terminal-management-system/src/mock/data/settings.js
module.exports = {
  _id: 'app_settings',
  general: {
    siteName: 'BTMS - Bus Terminal Management System',
    terminalName: 'Central Terminal A',
    supportEmail: 'support@btms.so',
    supportPhone: '+252 61 000 0000',
    timezone: 'Africa/Mogadishu',
    currency: 'SOS',
  },
  booking: {
    advanceBookingDays: 30,
    seatHoldMinutes: 15,
    cancellationWindowHours: 4,
    maxSeatsPerBooking: 6,
    allowGuestBooking: true,
  },
  notifications: {
    emailBookingConfirmation: true,
    emailPaymentReceipt: true,
    smsDepartureReminder: true,
    driverDispatchAlerts: true,
  },
  payments: {
    enableCard: true,
    enableMobileMoney: true,
    enableCash: true,
    taxRatePercent: 0,
    refundProcessingDays: 5,
  },
  system: {
    maintenanceMode: false,
    appVersion: '1.4.2',
    lastBackup: new Date().toISOString(),
  },
};

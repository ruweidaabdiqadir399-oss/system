export const settings = {
  general: {
    siteName: 'BTMS - Bus Terminal Management System',
    terminalName: 'Central Terminal A',
    supportEmail: 'support@btms.com',
    supportPhone: '+1 (800) 555-0199',
    timezone: 'America/New_York',
    currency: 'USD',
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

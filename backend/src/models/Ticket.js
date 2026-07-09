const mongoose = require('mongoose');
const { TICKET_STATUS } = require('../constants');

const ticketSchema = new mongoose.Schema(
  {
    _id: { type: String },
    bookingId: { type: String, ref: 'Booking', required: true },
    scheduleId: { type: String, ref: 'Schedule', required: true },
    customerId: { type: String, ref: 'User', required: true },
    passengerName: { type: String, required: true },
    seatNumber: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(TICKET_STATUS),
      default: TICKET_STATUS.VALID,
    },
    issuedAt: { type: Date, default: Date.now },
    qrPayload: { type: String, required: true },
    qrCode: { type: String, default: '' },
  },
  { timestamps: true }
);

ticketSchema.index({ bookingId: 1 });
ticketSchema.index({ customerId: 1 });
ticketSchema.index({ status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);

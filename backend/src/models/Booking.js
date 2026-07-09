const mongoose = require('mongoose');
const { BOOKING_STATUS, BOOKING_PAYMENT_STATUS, PAYMENT_METHODS } = require('../constants');

const passengerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0, max: 120 },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    seatNumber: { type: String, required: true },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    _id: { type: String },
    scheduleId: { type: String, ref: 'Schedule', required: true },
    customerId: { type: String, ref: 'User', required: true },
    seatNumbers: { type: [String], required: true, validate: (v) => Array.isArray(v) && v.length > 0 },
    passengers: { type: [passengerSchema], required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: Object.values(BOOKING_STATUS),
      default: BOOKING_STATUS.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(BOOKING_PAYMENT_STATUS),
      default: BOOKING_PAYMENT_STATUS.PENDING,
    },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, required: true },
  },
  { timestamps: true }
);

bookingSchema.index({ customerId: 1 });
bookingSchema.index({ scheduleId: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

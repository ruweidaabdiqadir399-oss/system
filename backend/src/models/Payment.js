const mongoose = require('mongoose');
const { PAYMENT_STATUS, PAYMENT_METHODS } = require('../constants');

const paymentSchema = new mongoose.Schema(
  {
    _id: { type: String },
    bookingId: { type: String, ref: 'Booking', required: true },
    customerId: { type: String, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: PAYMENT_METHODS, required: true },
    status: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
    },
    transactionRef: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

paymentSchema.index({ customerId: 1 });
paymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', paymentSchema);

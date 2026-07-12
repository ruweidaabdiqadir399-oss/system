const mongoose = require('mongoose');

const driverRatingSchema = new mongoose.Schema(
  {
    _id: { type: String },
    driverId: { type: String, ref: 'User', required: true },
    busId: { type: String, ref: 'Bus', required: true },
    customerId: { type: String, ref: 'User', required: true },
    bookingId: { type: String, ref: 'Booking', required: true, unique: true },
    scheduleId: { type: String, ref: 'Schedule', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '', trim: true, maxlength: 500 },
    reviewDate: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

driverRatingSchema.index({ driverId: 1 });
driverRatingSchema.index({ customerId: 1 });
driverRatingSchema.index({ busId: 1 });

module.exports = mongoose.model('DriverRating', driverRatingSchema);

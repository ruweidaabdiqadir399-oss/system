const mongoose = require('mongoose');
const { SCHEDULE_STATUS } = require('../constants');

const scheduleSchema = new mongoose.Schema(
  {
    _id: { type: String },
    routeId: { type: String, ref: 'Route', required: true },
    busId: { type: String, ref: 'Bus', required: true },
    driverId: { type: String, ref: 'User', default: null },
    date: { type: String, required: true }, // YYYY-MM-DD
    departureTime: { type: String, required: true }, // HH:mm
    arrivalTime: { type: String, required: true }, // HH:mm
    status: {
      type: String,
      enum: Object.values(SCHEDULE_STATUS),
      default: SCHEDULE_STATUS.SCHEDULED,
    },
    gate: { type: String, default: 'TBD' },
    totalSeats: { type: Number, required: true, min: 1 },
    bookedSeats: { type: Number, default: 0, min: 0 },
    actualStartTime: { type: Date, default: null },
    startedBy: { type: String, ref: 'User', default: null },
    startedDate: { type: String, default: null },
    actualFinishTime: { type: Date, default: null },
    completedBy: { type: String, ref: 'User', default: null },
    completedDate: { type: String, default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

scheduleSchema.virtual('availableSeats').get(function getAvailableSeats() {
  return this.totalSeats - this.bookedSeats;
});

scheduleSchema.index({ status: 1 });
scheduleSchema.index({ date: 1 });
scheduleSchema.index({ routeId: 1 });

module.exports = mongoose.model('Schedule', scheduleSchema);

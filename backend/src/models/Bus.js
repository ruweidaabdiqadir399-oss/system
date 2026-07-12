const mongoose = require('mongoose');
const { BUS_STATUS, AC_TYPES, SEAT_TYPES } = require('../constants');

const busSchema = new mongoose.Schema(
  {
    _id: { type: String },
    busNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
    model: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    acType: { type: String, enum: AC_TYPES, required: true },
    seatType: { type: String, enum: SEAT_TYPES, required: true },
    capacity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: Object.values(BUS_STATUS), default: BUS_STATUS.ACTIVE },
    currentRouteId: { type: String, ref: 'Route', default: null },
    driverId: { type: String, ref: 'User', default: null },
    fuelLevel: { type: Number, default: 100, min: 0, max: 100 },
    mileage: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    year: { type: Number },
    lastServiceDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

busSchema.index({ status: 1 });

module.exports = mongoose.model('Bus', busSchema);

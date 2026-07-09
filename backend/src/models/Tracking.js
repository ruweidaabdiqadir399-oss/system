const mongoose = require('mongoose');
const { TRACKING_STATUS } = require('../constants');

const positionSchema = new mongoose.Schema(
  {
    lat: { type: Number, default: 2.0469 },
    lng: { type: Number, default: 45.3182 },
  },
  { _id: false }
);

const trackingSchema = new mongoose.Schema(
  {
    busId: { type: String, ref: 'Bus', required: true, unique: true },
    scheduleId: { type: String, ref: 'Schedule', default: null },
    routeId: { type: String, ref: 'Route', default: null },
    driverId: { type: String, ref: 'User', default: null },
    status: {
      type: String,
      enum: Object.values(TRACKING_STATUS),
      default: TRACKING_STATUS.OFFLINE,
    },
    speedKmh: { type: Number, default: 0, min: 0 },
    heading: { type: Number, default: 0 },
    position: { type: positionSchema, default: () => ({ lat: 2.0469, lng: 45.3182 }) },
    currentLocation: { type: String, default: '' },
    nextStop: { type: String, default: '' },
    etaMinutes: { type: Number, default: null },
    fuelLevel: { type: Number, default: 100, min: 0, max: 100 },
    passengerCount: { type: Number, default: 0, min: 0 },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tracking', trackingSchema);

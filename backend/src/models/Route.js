const mongoose = require('mongoose');
const { ROUTE_STATUS } = require('../constants');

const routeSchema = new mongoose.Schema(
  {
    _id: { type: String },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    distanceMiles: { type: Number, required: true, min: 0 },
    durationMinutes: { type: Number, required: true, min: 0 },
    fare: { type: Number, required: true, min: 0 },
    stops: { type: [String], default: [] },
    status: { type: String, enum: Object.values(ROUTE_STATUS), default: ROUTE_STATUS.ACTIVE },
    region: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

routeSchema.index({ status: 1 });
routeSchema.index({ region: 1 });

module.exports = mongoose.model('Route', routeSchema);

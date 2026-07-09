const mongoose = require('mongoose');

// Operational profile for users with role === 'driver'. Kept separate from
// User so license/performance data doesn't bloat the core auth document.
const driverSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User', required: true, unique: true },
    licenseNumber: { type: String, required: true, unique: true, trim: true },
    licenseExpiry: { type: Date, required: true },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    totalTrips: { type: Number, default: 0, min: 0 },
    assignedBusId: { type: String, ref: 'Bus', default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);

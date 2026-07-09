const mongoose = require('mongoose');

// Denormalized snapshot — data is captured at boarding time so the history
// remains accurate even if tickets, schedules, or buses change later.
const boardingLogSchema = new mongoose.Schema(
  {
    _id:              { type: String },
    ticketId:         { type: String, required: true },
    passengerName:    { type: String, required: true },
    seatNumber:       { type: String, required: true },
    scheduleId:       { type: String, default: '' },
    routeName:        { type: String, default: '' },
    routeCode:        { type: String, default: '' },
    routeOrigin:      { type: String, default: '' },
    routeDestination: { type: String, default: '' },
    busId:            { type: String, default: '' },
    busNumber:        { type: String, default: '' },
    staffId:          { type: String, default: '' },
    staffName:        { type: String, default: '' },
    boardedAt:        { type: Date, default: Date.now },
    status:           { type: String, default: 'Boarded' },
  },
  { timestamps: false }
);

boardingLogSchema.index({ boardedAt: -1 });
boardingLogSchema.index({ ticketId: 1 });
boardingLogSchema.index({ busId: 1 });

module.exports = mongoose.model('BoardingLog', boardingLogSchema);

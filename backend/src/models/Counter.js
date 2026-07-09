const mongoose = require('mongoose');

// Backs `generateId()` - keeps a running sequence per ID prefix so we can
// produce human-friendly IDs (USR-1009, BUS-013, BK-100015, ...) that match
// the format already used throughout the BTMS frontend.
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('Counter', counterSchema);

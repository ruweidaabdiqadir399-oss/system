const mongoose = require('mongoose');

// Operational profile for users with role === 'staff'.
const staffSchema = new mongoose.Schema(
  {
    userId: { type: String, ref: 'User', required: true, unique: true },
    desk: { type: String, default: '' },
    department: { type: String, default: '' },
    shift: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Staff', staffSchema);

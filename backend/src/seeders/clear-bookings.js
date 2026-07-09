/**
 * One-shot script: deletes all documents from the bookings collection.
 *
 * Usage:  node src/seeders/clear-bookings.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { Booking } = require('../models');

const run = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected: ${env.MONGODB_URI}`);

  const before = await Booking.countDocuments();
  console.log(`Bookings before: ${before}`);

  await Booking.deleteMany({});

  const after = await Booking.countDocuments();
  console.log(`Bookings after:  ${after}`);
  console.log('All booking records deleted.');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

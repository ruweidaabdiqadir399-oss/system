/**
 * One-shot script: deletes all documents from the schedules collection.
 *
 * Usage:  node src/seeders/clear-schedules.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { Schedule } = require('../models');

const run = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected: ${env.MONGODB_URI}`);

  const before = await Schedule.countDocuments();
  console.log(`Schedules before: ${before}`);

  await Schedule.deleteMany({});

  const after = await Schedule.countDocuments();
  console.log(`Schedules after:  ${after}`);
  console.log('All schedule records deleted.');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

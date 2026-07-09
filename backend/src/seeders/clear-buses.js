/**
 * One-shot script: deletes all documents from the buses collection.
 *
 * Usage:  node src/seeders/clear-buses.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { Bus } = require('../models');

const run = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected: ${env.MONGODB_URI}`);

  const before = await Bus.countDocuments();
  console.log(`Buses before: ${before}`);

  await Bus.deleteMany({});

  const after = await Bus.countDocuments();
  console.log(`Buses after:  ${after}`);
  console.log('All bus records deleted.');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

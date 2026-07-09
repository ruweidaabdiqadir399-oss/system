/**
 * One-shot script: deletes all documents from the payments collection.
 *
 * Usage:  node src/seeders/clear-payments.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { Payment } = require('../models');

const run = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected: ${env.MONGODB_URI}`);

  const before = await Payment.countDocuments();
  console.log(`Payments before: ${before}`);

  await Payment.deleteMany({});

  const after = await Payment.countDocuments();
  console.log(`Payments after:  ${after}`);
  console.log('All payment records deleted.');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

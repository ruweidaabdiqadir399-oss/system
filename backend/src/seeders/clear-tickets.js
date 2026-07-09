/**
 * One-shot script: deletes all documents from the tickets collection.
 *
 * Usage:  node src/seeders/clear-tickets.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { Ticket } = require('../models');

const run = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected: ${env.MONGODB_URI}`);

  const before = await Ticket.countDocuments();
  console.log(`Tickets before: ${before}`);

  await Ticket.deleteMany({});

  const after = await Ticket.countDocuments();
  console.log(`Tickets after:  ${after}`);
  console.log('All ticket records deleted.');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

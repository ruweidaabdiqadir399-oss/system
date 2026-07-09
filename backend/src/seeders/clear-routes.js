/**
 * One-shot script: deletes all documents from the routes collection.
 *
 * Usage:  node src/seeders/clear-routes.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { Route } = require('../models');

const run = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected: ${env.MONGODB_URI}`);

  const before = await Route.countDocuments();
  console.log(`Routes before: ${before}`);

  await Route.deleteMany({});

  const after = await Route.countDocuments();
  console.log(`Routes after:  ${after}`);
  console.log('All route records deleted.');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

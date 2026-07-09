/* eslint-disable no-console */
/**
 * Database cleanup script — wipes all transactional and seed data, then
 * re-creates the singleton Settings document with schema-default values.
 *
 * Usage:
 *   node src/seeders/clean.js
 *   npm run db:clean
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const {
  User,
  Driver,
  Staff,
  Bus,
  Route,
  Schedule,
  Booking,
  Ticket,
  Payment,
  Notification,
  Tracking,
  Settings,
  AuditLog,
  Counter,
} = require('../models');

const TRANSACTIONAL_MODELS = [
  { model: AuditLog,      label: 'AuditLog' },
  { model: Notification,  label: 'Notification' },
  { model: Tracking,      label: 'Tracking' },
  { model: Payment,       label: 'Payment' },
  { model: Ticket,        label: 'Ticket' },
  { model: Booking,       label: 'Booking' },
  { model: Schedule,      label: 'Schedule' },
  { model: Bus,           label: 'Bus' },
  { model: Route,         label: 'Route' },
  { model: Staff,         label: 'Staff' },
  { model: Driver,        label: 'Driver' },
  { model: User,          label: 'User' },
  { model: Counter,       label: 'Counter' },
  { model: Settings,      label: 'Settings' },
];

const run = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected: ${env.MONGODB_URI}\n`);

  let total = 0;
  for (const { model, label } of TRANSACTIONAL_MODELS) {
    const { deletedCount } = await model.deleteMany({});
    console.log(`  ${label.padEnd(14)} — deleted ${deletedCount} document(s)`);
    total += deletedCount;
  }

  // Re-create the singleton Settings document using schema defaults.
  // All fields pick up their Mongoose-defined defaults — no hardcoded demo values.
  await Settings.create({ _id: 'app_settings' });
  console.log('\n  Settings      — initialized with schema defaults');

  console.log(`\nClean complete. ${total} seed/demo document(s) removed.`);
  console.log('Database is now empty and ready for production data.\n');

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Clean failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

/**
 * One-shot script: clears tracking, notifications, audit logs,
 * and non-admin users/drivers/staff from MongoDB.
 *
 * Admin accounts are preserved so login remains functional.
 *
 * Usage:  node src/seeders/clear-tracking-reports-users.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const { Tracking, Notification, AuditLog, User, Driver, Staff } = require('../models');

const count = (model) => model.countDocuments();

const run = async () => {
  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected: ${env.MONGODB_URI}\n`);

  // Tracking
  const trackBefore = await count(Tracking);
  await Tracking.deleteMany({});
  console.log(`Tracking:      ${trackBefore} → ${await count(Tracking)}`);

  // Notifications
  const notifBefore = await count(Notification);
  await Notification.deleteMany({});
  console.log(`Notifications: ${notifBefore} → ${await count(Notification)}`);

  // Audit logs
  const auditBefore = await count(AuditLog);
  await AuditLog.deleteMany({});
  console.log(`Audit logs:    ${auditBefore} → ${await count(AuditLog)}`);

  // Driver & Staff profiles for non-admin users
  const nonAdminUsers = await User.find({ role: { $ne: 'admin' } }, '_id');
  const nonAdminIds = nonAdminUsers.map((u) => u._id);

  const driverBefore = await count(Driver);
  await Driver.deleteMany({ userId: { $in: nonAdminIds } });
  console.log(`Drivers:       ${driverBefore} → ${await count(Driver)}`);

  const staffBefore = await count(Staff);
  await Staff.deleteMany({ userId: { $in: nonAdminIds } });
  console.log(`Staff:         ${staffBefore} → ${await count(Staff)}`);

  // Users — keep admins
  const userBefore = await count(User);
  await User.deleteMany({ role: { $ne: 'admin' } });
  const userAfter = await count(User);
  console.log(`Users:         ${userBefore} → ${userAfter} (admin accounts preserved)`);

  console.log('\nDone. Admin login remains functional.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

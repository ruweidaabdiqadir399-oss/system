/* eslint-disable no-console */
/**
 * BTMS small production seed — Mogadishu, Somalia.
 *
 * Counts after seeding:
 *   Users      : 1 admin · 3 staff · 3 drivers · 10 customers = 17
 *   Buses      : 3   (all Active)
 *   Routes     : 3   (all Active)
 *   Schedules  : 10  (6 past-Completed · 1 today · 3 future-Scheduled)
 *   Bookings   : 10  (4 Completed · 3 Confirmed · 2 Pending · 1 Cancelled)
 *   Tickets    : ~12 (1 per passenger on every non-cancelled booking)
 *   Payments   : 10  (4 Completed · 3 Completed · 2 Pending · 1 Refunded)
 *
 * Usage:
 *   npm run seed           – clear + seed everything
 *   npm run seed:destroy   – clear only
 */
require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');
const {
  User, Driver, Staff, Bus, Route, Schedule,
  Booking, Ticket, Payment, Notification, Tracking,
  Settings, AuditLog, Counter,
} = require('../models');
const { generateQrCode } = require('../utils/qrCode');
const { ROLES, TICKET_STATUS, SCHEDULE_STATUS, PAYMENT_STATUS } = require('../constants');

const users         = require('./data/users');
const buses         = require('./data/buses');
const routes        = require('./data/routes');
const notifications = require('./data/notifications');
const trackingData  = require('./data/tracking');

// ─── Helpers ────────────────────────────────────────────────────────────────

const SEED_BASE = new Date('2026-06-18T12:00:00.000Z');

const relDay = (n) => {
  const d = new Date(SEED_BASE);
  d.setUTCDate(d.getUTCDate() + n);
  return d;
};

const fmt = (d) => d.toISOString().slice(0, 10);

const SEAT_LETTERS = ['A', 'B', 'C', 'D'];
const genSeats = (count, from) =>
  Array.from({ length: count }, (_, i) => {
    const idx = from - 1 + i;
    return `${String(Math.floor(idx / 4) + 1).padStart(2, '0')}${SEAT_LETTERS[idx % 4]}`;
  });

// ─── Schedule templates ─────────────────────────────────────────────────────
// [idx, routeId, busId, driverId, dep, arr, gate, seats]

const TEMPLATES = [
  [0, 'RT-001', 'BUS-001', 'USR-3001', '06:00', '06:45', 'Albaab-A1', 45],
  [1, 'RT-002', 'BUS-002', 'USR-3002', '07:00', '07:50', 'Albaab-A2', 48],
  [2, 'RT-003', 'BUS-003', 'USR-3003', '08:00', '10:00', 'Albaab-B1', 48],
];

// ─── Schedule plan ──────────────────────────────────────────────────────────
// 10 entries: [templateIdx, daysOffset from SEED_BASE]
// Indices 0-5  → past  (Completed)
// Index   6    → today (In Transit)
// Indices 7-9  → future (Scheduled)

const SCHEDULE_PLAN = [
  [0, -30], [1, -25], [2, -20],
  [0, -15], [1, -10], [2,  -5],
  [0,   0],
  [1,   3], [2,   7], [0,  14],
];

// ─── Booking plan ───────────────────────────────────────────────────────────
// 10 entries:
//   [scheduleIdx, customerIdx (0→USR-4001), numPassengers, status, payMethod, daysBefore]
// Payment methods: 'EVC Plus', 'Sahal', 'Bank Transfer'

const BOOKING_PLAN = [
  // Past (Completed schedules)
  [0, 0, 1, 'Completed',  'EVC Plus',       5],   // BK-100001
  [1, 1, 2, 'Completed',  'Sahal',          4],   // BK-100002
  [2, 2, 1, 'Completed',  'Bank Transfer',  6],   // BK-100003
  [3, 3, 1, 'Completed',  'EVC Plus',       3],   // BK-100004
  [4, 4, 2, 'Cancelled',  'Sahal',          5],   // BK-100005
  [5, 5, 1, 'Completed',  'EVC Plus',       4],   // BK-100006 (extra completed for past)
  // Today
  [6, 6, 1, 'Confirmed',  'EVC Plus',       2],   // BK-100007
  // Future
  [7, 7, 2, 'Confirmed',  'Sahal',          3],   // BK-100008
  [8, 8, 1, 'Pending',    'Bank Transfer',  1],   // BK-100009
  [9, 9, 1, 'Pending',    'EVC Plus',       2],   // BK-100010
];

// Somali passenger pool
const PASSENGERS = [
  { name: 'Mohamed Axmed Hassan',     age: 34, gender: 'Male'   },
  { name: 'Hodan Cali Warsame',       age: 28, gender: 'Female' },
  { name: 'Cabdullahi Ibrahim Farah', age: 40, gender: 'Male'   },
  { name: 'Filsan Yuusuf Dirie',      age: 24, gender: 'Female' },
  { name: 'Omar Hassan Ahmed',        age: 45, gender: 'Male'   },
  { name: 'Maryam Osman Nur',         age: 26, gender: 'Female' },
  { name: 'Ibrahim Abdi Jama',        age: 31, gender: 'Male'   },
  { name: 'Nimo Maxamed Hirsi',       age: 37, gender: 'Female' },
  { name: 'Daud Faarax Garaad',       age: 52, gender: 'Male'   },
  { name: 'Khadija Ali Hassan',       age: 29, gender: 'Female' },
  { name: 'Abdinur Cumar Warsame',    age: 38, gender: 'Male'   },
  { name: 'Sagal Ibrahim Madar',      age: 33, gender: 'Female' },
];

// ─── Pre-computation ─────────────────────────────────────────────────────────

const scheduleBoooked = new Array(10).fill(0);
BOOKING_PLAN.forEach(([sIdx, , n, status]) => {
  if (status !== 'Cancelled') scheduleBoooked[sIdx] += n;
});

// ─── Seeding functions ───────────────────────────────────────────────────────

const clearCollections = async () => {
  const models = [AuditLog, Notification, Tracking, Payment, Ticket, Booking,
                  Schedule, Bus, Route, Staff, Driver, User, Counter, Settings];
  for (const m of models) await m.deleteMany({});
};

const seedUsers = async () => {
  for (const u of users) {
    const { licenseNumber, licenseExpiry, rating, totalTrips, assignedBusId,
            desk, shift, ...userFields } = u;
    await User.create(userFields);

    if (u.role === ROLES.DRIVER) {
      await Driver.create({ userId: u._id, licenseNumber, licenseExpiry, rating, totalTrips, assignedBusId });
    }
    if (u.role === ROLES.STAFF) {
      await Staff.create({ userId: u._id, desk: desk ?? '', shift: shift ?? '' });
    }
  }
};

const seedBusesAndRoutes = async () => {
  await Route.insertMany(routes);
  await Bus.insertMany(buses);
};

const seedSchedules = async () => {
  const docs = SCHEDULE_PLAN.map(([tIdx, daysOff], i) => {
    const [, routeId, busId, driverId, dep, arr, gate, seats] = TEMPLATES[tIdx];
    const schDate = relDay(daysOff);
    const isPast   = daysOff < 0;
    const isToday  = daysOff === 0;

    let status;
    if (isPast)        status = SCHEDULE_STATUS.COMPLETED;
    else if (isToday)  status = SCHEDULE_STATUS.IN_TRANSIT;
    else               status = SCHEDULE_STATUS.SCHEDULED;

    return {
      _id: `SCH-${1001 + i}`,
      routeId,
      busId,
      driverId,
      date: fmt(schDate),
      departureTime: dep,
      arrivalTime:   arr,
      status,
      gate,
      totalSeats:   seats,
      bookedSeats:  scheduleBoooked[i],
    };
  });
  await Schedule.insertMany(docs);
  return docs;
};

const seedBookingsTicketsPayments = async (scheduleDocs, routeFareMap) => {
  const seatNext = {};

  let ticketSeq  = 200001;
  let paymentSeq = 500001;

  for (let bIdx = 0; bIdx < BOOKING_PLAN.length; bIdx++) {
    const [sIdx, cIdx, numPax, status, method, daysBefore] = BOOKING_PLAN[bIdx];

    const sch      = scheduleDocs[sIdx];
    const fare     = routeFareMap[sch.routeId] ?? 0;
    const bkId     = `BK-${100001 + bIdx}`;
    const custId   = `USR-${4001 + cIdx}`;
    const isCancelled = status === 'Cancelled';

    if (!seatNext[sch._id]) seatNext[sch._id] = 1;
    const startSeat = seatNext[sch._id];
    seatNext[sch._id] += numPax;
    const seats = genSeats(numPax, startSeat);

    const passengers = seats.map((seat, i) => {
      const p = PASSENGERS[(bIdx * 2 + i) % PASSENGERS.length];
      return { name: p.name, age: p.age, gender: p.gender, seatNumber: seat };
    });

    const totalAmount = Math.round(fare * numPax * 100) / 100;
    const bookingCreatedAt = relDay(SCHEDULE_PLAN[sIdx][1] - daysBefore);

    let payStatus;
    if (isCancelled)                payStatus = PAYMENT_STATUS.REFUNDED;
    else if (status === 'Pending')  payStatus = PAYMENT_STATUS.PENDING;
    else                            payStatus = PAYMENT_STATUS.COMPLETED;

    const bkPayStatus =
      payStatus === PAYMENT_STATUS.COMPLETED ? 'Paid'
      : payStatus === PAYMENT_STATUS.REFUNDED ? 'Refunded'
      : 'Pending';

    await Booking.create({
      _id:           bkId,
      scheduleId:    sch._id,
      customerId:    custId,
      seatNumbers:   seats,
      passengers,
      totalAmount,
      status,
      paymentStatus: bkPayStatus,
      paymentMethod: method,
      createdAt:     bookingCreatedAt,
      updatedAt:     bookingCreatedAt,
    });

    if (!isCancelled) {
      for (const pax of passengers) {
        const tktId   = `TKT-${ticketSeq++}`;
        const payload = `BTMS|${tktId}|${bkId}|${sch._id}|${pax.seatNumber}`;
        const tktStatus =
          status === 'Completed' ? TICKET_STATUS.USED : TICKET_STATUS.VALID;

        await Ticket.create({
          _id:          tktId,
          bookingId:    bkId,
          scheduleId:   sch._id,
          customerId:   custId,
          passengerName: pax.name,
          seatNumber:   pax.seatNumber,
          status:       tktStatus,
          issuedAt:     bookingCreatedAt,
          qrPayload:    payload,
          qrCode:       await generateQrCode(payload),
        });
      }
    }

    const hashBase = bkId.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
    const txRef = `TXN-${Math.abs(hashBase).toString(16).toUpperCase().padStart(8, '0')}`;

    await Payment.create({
      _id:            `PAY-${paymentSeq++}`,
      bookingId:      bkId,
      customerId:     custId,
      amount:         totalAmount,
      method,
      status:         payStatus,
      transactionRef: txRef,
      date:           bookingCreatedAt,
      note:           '',
    });
  }

  return { lastTicketSeq: ticketSeq, lastPaymentSeq: paymentSeq };
};

const backfillCustomerStats = async () => {
  const bookings = await Booking.find({ status: { $ne: 'Cancelled' } }, 'customerId totalAmount');
  const stats = {};
  for (const b of bookings) {
    if (!stats[b.customerId]) stats[b.customerId] = { totalBookings: 0, loyaltyPoints: 0 };
    stats[b.customerId].totalBookings++;
    stats[b.customerId].loyaltyPoints += Math.floor(b.totalAmount);
  }
  for (const [id, s] of Object.entries(stats)) {
    await User.findByIdAndUpdate(id, s);
  }
};

const seedNotificationsAndTracking = async () => {
  if (notifications.length) await Notification.insertMany(notifications);
  if (trackingData.length)  await Tracking.insertMany(trackingData);
};

const seedCounters = async (lastTicketSeq, lastPaymentSeq) => {
  const entries = [
    { _id: 'USR', seq: 5000  },
    { _id: 'BUS', seq: 3     },
    { _id: 'RT',  seq: 3     },
    { _id: 'SCH', seq: 1010  },
    { _id: 'BK',  seq: 100010 },
    { _id: 'TKT', seq: lastTicketSeq  - 1 },
    { _id: 'PAY', seq: lastPaymentSeq - 1 },
    { _id: 'NTF', seq: 3     },
  ];
  await Counter.insertMany(entries);
};

// ─── Main ────────────────────────────────────────────────────────────────────

const run = async () => {
  const destroyOnly = process.argv.includes('--destroy');

  await mongoose.connect(env.MONGODB_URI);
  console.log(`Connected: ${env.MONGODB_URI}\n`);

  await clearCollections();
  console.log('Cleared all collections.');

  if (destroyOnly) {
    console.log('Destroy-only mode – done.');
    await mongoose.disconnect();
    return;
  }

  const routeFareMap = Object.fromEntries(routes.map((r) => [r._id, r.fare]));

  await seedUsers();
  console.log(`Seeded ${users.length} users (with driver/staff profiles).`);

  await seedBusesAndRoutes();
  console.log(`Seeded ${routes.length} routes and ${buses.length} buses.`);

  const scheduleDocs = await seedSchedules();
  console.log(`Seeded ${scheduleDocs.length} schedules.`);

  const { lastTicketSeq, lastPaymentSeq } =
    await seedBookingsTicketsPayments(scheduleDocs, routeFareMap);
  console.log(
    `Seeded ${BOOKING_PLAN.length} bookings, ` +
    `${lastTicketSeq - 200001} tickets, ` +
    `${lastPaymentSeq - 500001} payments.`
  );

  await backfillCustomerStats();
  console.log('Back-filled customer totalBookings and loyaltyPoints.');

  await seedNotificationsAndTracking();
  console.log(`Seeded ${notifications.length} notifications and ${trackingData.length} tracking entries.`);

  await seedCounters(lastTicketSeq, lastPaymentSeq);
  console.log('Set ID sequence counters.');

  await Settings.create({ _id: 'app_settings' });
  console.log('Initialized application settings with defaults.\n');

  console.log('Seeding complete. System is ready.');
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seeding failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});

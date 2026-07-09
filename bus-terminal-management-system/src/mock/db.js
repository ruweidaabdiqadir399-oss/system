// In-memory mutable "database" seeded from the static mock data.
// Services mutate these arrays so create/update/delete operations persist
// for the lifetime of the browser session, mimicking a real backend.
import { clone } from './utils';
import {
  users,
  buses,
  routes,
  schedules,
  bookings,
  tickets,
  payments,
  liveTracking,
  notifications,
  settings,
} from './data';

export const db = {
  users: clone(users),
  buses: clone(buses),
  routes: clone(routes),
  schedules: clone(schedules),
  bookings: clone(bookings),
  tickets: clone(tickets),
  payments: clone(payments),
  tracking: clone(liveTracking),
  notifications: clone(notifications),
  settings: clone(settings),
};

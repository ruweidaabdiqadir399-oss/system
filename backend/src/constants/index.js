// Centralised enums shared across models, validations and controllers.
// These mirror the values used by the BTMS React frontend mock data so the
// API contract stays compatible with the existing UI.

const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  DRIVER: 'driver',
  CUSTOMER: 'customer',
};

const USER_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
  ON_LEAVE: 'On Leave',
};

const BUS_STATUS = {
  ACTIVE: 'Active',
  MAINTENANCE: 'Maintenance',
  INACTIVE: 'Inactive',
};

const AC_TYPES = ['AC', 'Non-AC'];
const SEAT_TYPES = ['Sleeper', 'Seater'];

const ROUTE_STATUS = {
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
};

const SCHEDULE_STATUS = {
  SCHEDULED: 'Scheduled',
  BOARDING: 'Boarding',
  ON_TRIP: 'On Trip',
  DEPARTED: 'Departed',
  IN_TRANSIT: 'In Transit',
  DELAYED: 'Delayed',
  ARRIVED: 'Arrived',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const BOOKING_STATUS = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  CANCELLED: 'Cancelled',
  COMPLETED: 'Completed',
};

const PAYMENT_STATUS = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

const BOOKING_PAYMENT_STATUS = {
  PAID: 'Paid',
  PENDING: 'Pending',
  REFUNDED: 'Refunded',
  FAILED: 'Failed',
};

const PAYMENT_METHODS = ['EVC Plus', 'Sahal', 'Zaad', 'eDahab', 'Bank Card'];

const TICKET_STATUS = {
  VALID: 'Valid',
  USED: 'Used',
  CANCELLED: 'Cancelled',
  BOARDED: 'Boarded',
};

const TRACKING_STATUS = {
  ON_TIME: 'On Time',
  DELAYED: 'Delayed',
  OFFLINE: 'Offline',
};

const NOTIFICATION_TYPE = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

const NOTIFICATION_AUDIENCE = [ROLES.ADMIN, ROLES.STAFF, ROLES.DRIVER, ROLES.CUSTOMER];

const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REGISTER: 'REGISTER',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  STATUS_CHANGE: 'STATUS_CHANGE',
};

const DEFAULT_PAGE_SIZE = 8;

module.exports = {
  ROLES,
  USER_STATUS,
  BUS_STATUS,
  AC_TYPES,
  SEAT_TYPES,
  ROUTE_STATUS,
  SCHEDULE_STATUS,
  BOOKING_STATUS,
  PAYMENT_STATUS,
  BOOKING_PAYMENT_STATUS,
  PAYMENT_METHODS,
  TICKET_STATUS,
  TRACKING_STATUS,
  NOTIFICATION_TYPE,
  NOTIFICATION_AUDIENCE,
  AUDIT_ACTIONS,
  DEFAULT_PAGE_SIZE,
};

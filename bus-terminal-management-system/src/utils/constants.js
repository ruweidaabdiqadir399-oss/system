export const APP_NAME = 'BTMS';
export const APP_FULL_NAME = 'Bus Terminal Management System';

export const ROLES = {
  ADMIN: 'admin',
  STAFF: 'staff',
  DRIVER: 'driver',
  CUSTOMER: 'customer',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.STAFF]: 'Terminal Staff',
  [ROLES.DRIVER]: 'Driver',
  [ROLES.CUSTOMER]: 'Customer',
};

export const ROLE_HOME_ROUTES = {
  [ROLES.ADMIN]: '/admin/dashboard',
  [ROLES.STAFF]: '/staff/dashboard',
  [ROLES.DRIVER]: '/driver/dashboard',
  [ROLES.CUSTOMER]: '/customer/home',
};

export const DEPARTMENTS = [
  'Administration',
  'Ticketing',
  'Boarding',
  'Customer Service',
  'Operations',
  'Finance',
  'Security',
  'IT',
];

export const REPORT_TYPES = [
  'Daily Operations',
  'Bus Delay',
  'Maintenance',
  'Incident',
  'Passenger Complaint',
  'Lost & Found',
  'Other',
];

export const REPORT_STATUS = ['Pending', 'In Review', 'Resolved', 'Closed'];

export const SUPPORT_CATEGORIES = [
  'Booking Problem',
  'Payment Issue',
  'Ticket Issue',
  'Seat Problem',
  'Schedule Question',
  'Bus Information',
  'Technical Issue',
  'Other',
];

export const SUPPORT_STATUS = ['Open', 'In Progress', 'Resolved', 'Closed'];

export const STORAGE_KEYS = {
  TOKEN: 'btms_token',
  REFRESH_TOKEN: 'btms_refresh_token',
  USER: 'btms_user',
};

export const CURRENCY = 'USD';

export const DEFAULT_PAGE_SIZE = 8;

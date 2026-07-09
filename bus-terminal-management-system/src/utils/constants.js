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

export const STORAGE_KEYS = {
  TOKEN: 'btms_token',
  REFRESH_TOKEN: 'btms_refresh_token',
  USER: 'btms_user',
};

export const CURRENCY = 'USD';

export const DEFAULT_PAGE_SIZE = 8;

import { CURRENCY } from './constants';

export const formatCurrency = (amount, currency = CURRENCY) => {
  const value = Number(amount ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatNumber = (value) => new Intl.NumberFormat('en-US').format(Number(value ?? 0));

export const formatPercent = (value, fractionDigits = 0) => `${Number(value ?? 0).toFixed(fractionDigits)}%`;

export const formatDate = (dateStr, options) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
};

// Accepts "HH:MM" 24-hour strings (schedule times) or full ISO timestamps.
export const formatTime = (timeStr) => {
  if (!timeStr) return '-';
  let date;
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    date = new Date(`2000-01-01T${timeStr}:00`);
  } else {
    date = new Date(timeStr);
  }
  if (Number.isNaN(date.getTime())) return timeStr;
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export const formatDateTime = (isoStr) => {
  if (!isoStr) return '-';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return '-';
  return `${formatDate(date)} at ${formatTime(date.toISOString())}`;
};

export const formatDuration = (minutes) => {
  const total = Number(minutes ?? 0);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  if (hours <= 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

export const timeAgo = (isoStr) => {
  if (!isoStr) return '-';
  const date = new Date(isoStr);
  if (Number.isNaN(date.getTime())) return '-';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const truncate = (str = '', length = 60) =>
  str.length > length ? `${str.slice(0, length).trimEnd()}...` : str;

const BADGE_MAP = {
  success: ['Active', 'Confirmed', 'Completed', 'Valid', 'On Time', 'Paid', 'Ready', 'Boarded'],
  warning: ['Pending', 'Boarding', 'Scheduled', 'Maintenance', 'Delayed', 'On Leave', 'Processing'],
  danger: ['Cancelled', 'Inactive', 'Suspended', 'Failed', 'Offline', 'Refunded'],
  info: ['In Transit', 'Departed', 'Arrived', 'Used'],
};

export const statusBadgeClass = (status) => {
  for (const [variant, statuses] of Object.entries(BADGE_MAP)) {
    if (statuses.includes(status)) return `badge-${variant}`;
  }
  return 'badge-neutral';
};

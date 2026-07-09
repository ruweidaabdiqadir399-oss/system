import { bookings } from './bookings';

export const PAYMENT_STATUS = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

const statusMap = {
  Paid: PAYMENT_STATUS.COMPLETED,
  Pending: PAYMENT_STATUS.PENDING,
  Refunded: PAYMENT_STATUS.REFUNDED,
  Failed: PAYMENT_STATUS.FAILED,
};

let seq = 500001;

export const payments = [
  ...bookings.map((booking) => ({
    id: `PAY-${seq++}`,
    bookingId: booking.id,
    customerId: booking.customerId,
    amount: booking.totalAmount,
    method: booking.paymentMethod,
    status: statusMap[booking.paymentStatus] ?? PAYMENT_STATUS.PENDING,
    transactionRef: `TXN-${Math.abs(
      Array.from(booking.id).reduce((acc, c) => acc * 31 + c.charCodeAt(0), 7)
    )
      .toString(16)
      .toUpperCase()
      .padStart(8, '0')}`,
    date: booking.createdAt,
  })),
  {
    id: `PAY-${seq++}`,
    bookingId: 'BK-100002',
    customerId: 'USR-4002',
    amount: 12.0,
    method: 'Card',
    status: PAYMENT_STATUS.FAILED,
    transactionRef: 'TXN-1A2B3C4D',
    date: bookings[1].createdAt,
    note: 'Card declined - insufficient funds on retry',
  },
];

export const findPaymentById = (id) => payments.find((p) => p.id === id);
export const findPaymentsByCustomer = (customerId) =>
  payments.filter((p) => p.customerId === customerId);
export const findPaymentByBooking = (bookingId) =>
  payments.find((p) => p.bookingId === bookingId && p.status !== PAYMENT_STATUS.FAILED);

import { bookings } from './bookings';
import { findScheduleById, SCHEDULE_STATUS } from './schedules';

export const TICKET_STATUS = {
  VALID: 'Valid',
  USED: 'Used',
  CANCELLED: 'Cancelled',
};

const deriveStatus = (booking, schedule) => {
  if (booking.status === 'Cancelled') return TICKET_STATUS.CANCELLED;
  if (schedule?.status === SCHEDULE_STATUS.COMPLETED) return TICKET_STATUS.USED;
  return TICKET_STATUS.VALID;
};

let seq = 200001;

export const tickets = bookings.flatMap((booking) => {
  const schedule = findScheduleById(booking.scheduleId);
  return booking.passengers.map((passenger) => {
    const ticketNumber = `TKT-${seq++}`;
    return {
      id: ticketNumber,
      bookingId: booking.id,
      scheduleId: booking.scheduleId,
      customerId: booking.customerId,
      passengerName: passenger.name,
      seatNumber: passenger.seatNumber,
      status: deriveStatus(booking, schedule),
      issuedAt: booking.createdAt,
      qrPayload: `BTMS|${ticketNumber}|${booking.id}|${booking.scheduleId}|${passenger.seatNumber}`,
    };
  });
});

export const findTicketById = (id) => tickets.find((t) => t.id === id);
export const findTicketsByBooking = (bookingId) =>
  tickets.filter((t) => t.bookingId === bookingId);
export const findTicketsByCustomer = (customerId) =>
  tickets.filter((t) => t.customerId === customerId);

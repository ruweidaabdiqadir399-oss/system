const generateId = require('../utils/generateId');
const { generateQrCode } = require('../utils/qrCode');
const { Ticket } = require('../models');

/**
 * Issues one ticket (with a scannable QR code) per passenger on a confirmed
 * booking. Idempotent - if tickets already exist for the booking they are
 * returned as-is instead of being duplicated.
 */
const issueTicketsForBooking = async (booking) => {
  const existing = await Ticket.find({ bookingId: booking._id });
  if (existing.length) return existing;

  const tickets = [];
  for (const passenger of booking.passengers) {
    const _id = await generateId('TKT', 'TKT-', 200024, 6);
    const qrPayload = `${_id}|${booking._id}|${booking.scheduleId}|${passenger.seatNumber}`;
    const qrCode = await generateQrCode(qrPayload);

    const ticket = await Ticket.create({
      _id,
      bookingId: booking._id,
      scheduleId: booking.scheduleId,
      customerId: booking.customerId,
      passengerName: passenger.name,
      seatNumber: passenger.seatNumber,
      qrPayload,
      qrCode,
    });
    tickets.push(ticket);
  }

  return tickets;
};

module.exports = { issueTicketsForBooking };

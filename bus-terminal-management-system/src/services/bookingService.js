import { apiClient, unwrap, unwrapPaginated } from '../api/axiosClient';

export const BOOKING_STATUS_FILTERS = ['All Statuses', 'Confirmed', 'Pending', 'Cancelled', 'Completed'];

const SEAT_LETTERS = ['A', 'B', 'C', 'D'];

export const generateSeatLayout = (totalSeats) => {
  const rows = Math.ceil(totalSeats / SEAT_LETTERS.length);
  const layout = [];
  let remaining = totalSeats;
  for (let row = 1; row <= rows; row += 1) {
    const seatsInRow = Math.min(SEAT_LETTERS.length, remaining);
    layout.push(
      SEAT_LETTERS.slice(0, seatsInRow).map((letter) => `${String(row).padStart(2, '0')}${letter}`)
    );
    remaining -= seatsInRow;
  }
  return layout;
};

export const getBookings = async ({ search = '', status = 'All Statuses', page = 1, pageSize = 8 } = {}) => {
  const params = { search, page, pageSize };
  if (status !== 'All Statuses') params.status = status;
  const res = await apiClient.get('/bookings', { params });
  return unwrapPaginated(res);
};

export const getBookingById = async (id) => {
  const res = await apiClient.get(`/bookings/${id}`);
  return unwrap(res);
};

export const getBookingsByCustomer = async (customerId, { status = 'All Statuses', page = 1, pageSize = 8 } = {}) => {
  const params = { customerId, page, pageSize };
  if (status !== 'All Statuses') params.status = status;
  const res = await apiClient.get('/bookings', { params });
  return unwrapPaginated(res);
};

export const getSeatMap = async (scheduleId) => {
  const { getScheduleSeatMap, getScheduleById } = await import('./scheduleService');
  const [seatMap, schedule] = await Promise.all([
    getScheduleSeatMap(scheduleId),
    getScheduleById(scheduleId),
  ]);
  return {
    ...seatMap,
    layout: generateSeatLayout(seatMap.totalSeats),
    bookedSeats: seatMap.bookedSeatNumbers ?? [],
    fare: schedule.route?.fare ?? 0,
  };
};

export const createBooking = async ({ scheduleId, seatNumbers, passengers, paymentMethod, customerId }) => {
  const body = { scheduleId, seatNumbers, paymentMethod, passengers };
  if (customerId) body.customerId = customerId;
  const res = await apiClient.post('/bookings', body);
  return unwrap(res);
};

export const updateBookingStatus = async (id, status) => {
  const res = await apiClient.patch(`/bookings/${id}/status`, { status });
  return unwrap(res);
};

export const cancelBooking = async (id) => {
  const res = await apiClient.patch(`/bookings/${id}/cancel`);
  return unwrap(res);
};

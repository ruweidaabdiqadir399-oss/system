const swaggerJSDoc = require('swagger-jsdoc');
const path = require('path');
const env = require('./env');

const definition = {
  openapi: '3.0.3',
  info: {
    title: 'BTMS API',
    version: '1.0.0',
    description:
      'REST API for the Bus Terminal Management System (BTMS) - authentication, fleet, routes, ' +
      'schedules, bookings, ticketing, payments, live tracking, notifications, reports and analytics.',
    contact: { name: 'BTMS Team' },
  },
  servers: [
    { url: `http://localhost:${env.PORT}${env.API_PREFIX}`, description: 'Local development' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication & session management' },
    { name: 'Users', description: 'User management (admin)' },
    { name: 'Buses', description: 'Fleet management' },
    { name: 'Drivers', description: 'Driver profiles & performance' },
    { name: 'Routes', description: 'Route management' },
    { name: 'Schedules', description: 'Trip scheduling' },
    { name: 'Bookings', description: 'Seat booking & reservations' },
    { name: 'Tickets', description: 'Ticketing & QR verification' },
    { name: 'Payments', description: 'Payments & refunds' },
    { name: 'Tracking', description: 'Live bus tracking' },
    { name: 'Notifications', description: 'In-app notifications' },
    { name: 'Reports', description: 'Reports & analytics' },
    { name: 'Settings', description: 'Application settings' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Success' },
          data: { type: 'object' },
        },
      },
      ApiError: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Resource not found.' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: { field: { type: 'string' }, message: { type: 'string' } },
            },
          },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          pageSize: { type: 'integer', example: 8 },
          total: { type: 'integer', example: 42 },
          totalPages: { type: 'integer', example: 6 },
        },
      },
      User: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'USR-1001' },
          name: { type: 'string', example: 'Amara Whitfield' },
          email: { type: 'string', example: 'admin@btms.so' },
          role: { type: 'string', enum: ['admin', 'staff', 'driver', 'customer'] },
          phone: { type: 'string' },
          status: { type: 'string', enum: ['Active', 'Inactive', 'Suspended', 'On Leave'] },
          joinedDate: { type: 'string', format: 'date-time' },
          department: {
            type: 'string',
            enum: ['Administration', 'Ticketing', 'Boarding', 'Customer Service', 'Operations', 'Finance', 'Security', 'IT'],
          },
          loyaltyPoints: { type: 'number' },
          totalBookings: { type: 'number' },
        },
      },
      StaffReport: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'RPT-5001' },
          title: { type: 'string' },
          type: {
            type: 'string',
            enum: ['Daily Operations', 'Bus Delay', 'Maintenance', 'Incident', 'Passenger Complaint', 'Lost & Found', 'Other'],
          },
          description: { type: 'string' },
          submittedBy: { type: 'string', example: 'USR-2001' },
          department: { type: 'string' },
          status: { type: 'string', enum: ['Pending', 'In Review', 'Resolved', 'Closed'] },
          adminRemarks: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      SupportRequest: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'SUP-7001' },
          customer: { type: 'string', example: 'USR-4001' },
          subject: { type: 'string' },
          category: {
            type: 'string',
            enum: ['Booking Problem', 'Payment Issue', 'Ticket Issue', 'Seat Problem', 'Schedule Question', 'Bus Information', 'Technical Issue', 'Other'],
          },
          message: { type: 'string' },
          reply: { type: 'string' },
          assignedStaff: { type: 'string', nullable: true },
          handledBy: { type: 'string', nullable: true, description: 'Most recent Customer Service staff member to act on this request.' },
          resolvedBy: { type: 'string', nullable: true, description: 'User who set the status to Resolved.' },
          responseDate: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['Open', 'In Progress', 'Resolved', 'Closed'] },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Bus: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'BUS-001' },
          busNumber: { type: 'string', example: 'NY-12-HC-1234' },
          model: { type: 'string', example: 'Volvo 9700' },
          type: { type: 'string', example: 'AC Sleeper' },
          acType: { type: 'string', enum: ['AC', 'Non-AC'] },
          seatType: { type: 'string', enum: ['Sleeper', 'Seater'] },
          capacity: { type: 'number', example: 42 },
          status: { type: 'string', enum: ['Active', 'Maintenance', 'Inactive'] },
          currentRouteId: { type: 'string', nullable: true, example: 'RT-001' },
          driverId: { type: 'string', nullable: true, example: 'USR-3002' },
          fuelLevel: { type: 'number', example: 88 },
          mileage: { type: 'number', example: 142500 },
          year: { type: 'number', example: 2022 },
          lastServiceDate: { type: 'string', format: 'date' },
        },
      },
      Route: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'RT-001' },
          code: { type: 'string', example: 'RTE-104' },
          name: { type: 'string', example: 'NY - Boston Express' },
          origin: { type: 'string' },
          destination: { type: 'string' },
          distanceMiles: { type: 'number' },
          durationMinutes: { type: 'number' },
          fare: { type: 'number' },
          stops: { type: 'array', items: { type: 'string' } },
          status: { type: 'string', enum: ['Active', 'Suspended'] },
          region: { type: 'string' },
        },
      },
      Schedule: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'SCH-0842' },
          routeId: { type: 'string', example: 'RT-001' },
          busId: { type: 'string', example: 'BUS-002' },
          driverId: { type: 'string', nullable: true, example: 'USR-3001' },
          date: { type: 'string', example: '2026-06-14' },
          departureTime: { type: 'string', example: '09:30' },
          arrivalTime: { type: 'string', example: '13:30' },
          status: {
            type: 'string',
            enum: ['Scheduled', 'Boarding', 'Departed', 'In Transit', 'Delayed', 'Arrived', 'Completed', 'Cancelled'],
          },
          gate: { type: 'string', example: 'A-12' },
          totalSeats: { type: 'number', example: 48 },
          bookedSeats: { type: 'number', example: 30 },
          availableSeats: { type: 'number', example: 18 },
        },
      },
      Passenger: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
          gender: { type: 'string', enum: ['Male', 'Female', 'Other'] },
          seatNumber: { type: 'string' },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'BK-100001' },
          scheduleId: { type: 'string', example: 'SCH-0842' },
          customerId: { type: 'string', example: 'USR-4001' },
          seatNumbers: { type: 'array', items: { type: 'string' } },
          passengers: { type: 'array', items: { $ref: '#/components/schemas/Passenger' } },
          totalAmount: { type: 'number', example: 90 },
          status: { type: 'string', enum: ['Confirmed', 'Pending', 'Cancelled', 'Completed'] },
          paymentStatus: { type: 'string', enum: ['Paid', 'Pending', 'Refunded', 'Failed'] },
          paymentMethod: { type: 'string', enum: ['Card', 'Mobile Money', 'Cash'] },
        },
      },
      Ticket: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'TKT-200001' },
          bookingId: { type: 'string', example: 'BK-100001' },
          scheduleId: { type: 'string', example: 'SCH-0842' },
          customerId: { type: 'string', example: 'USR-4001' },
          passengerName: { type: 'string' },
          seatNumber: { type: 'string' },
          status: { type: 'string', enum: ['Valid', 'Used', 'Cancelled'] },
          issuedAt: { type: 'string', format: 'date-time' },
          qrPayload: { type: 'string' },
          qrCode: { type: 'string', description: 'Base64 PNG data URL' },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'PAY-500001' },
          bookingId: { type: 'string', example: 'BK-100001' },
          customerId: { type: 'string', example: 'USR-4001' },
          amount: { type: 'number', example: 90 },
          method: { type: 'string', enum: ['Card', 'Mobile Money', 'Cash'] },
          status: { type: 'string', enum: ['Completed', 'Pending', 'Failed', 'Refunded'] },
          transactionRef: { type: 'string' },
          date: { type: 'string', format: 'date-time' },
        },
      },
      Notification: {
        type: 'object',
        properties: {
          _id: { type: 'string', example: 'NTF-001' },
          audience: { type: 'string', enum: ['admin', 'staff', 'driver', 'customer'] },
          userId: { type: 'string', nullable: true },
          title: { type: 'string' },
          message: { type: 'string' },
          type: { type: 'string', enum: ['info', 'success', 'warning', 'error'] },
          timestamp: { type: 'string', format: 'date-time' },
          read: { type: 'boolean' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
};

const options = {
  definition,
  apis: [path.join(__dirname, '..', 'routes', '*.js')],
};

module.exports = swaggerJSDoc(options);

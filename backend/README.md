# BTMS Backend API

Production-ready REST API for the **Bus Terminal Management System (BTMS)** — built with Node.js, Express, and MongoDB/Mongoose. It powers the BTMS React frontend (`bus-terminal-management-system/`) and is contract-compatible with its mock data (IDs, enums, and shapes match exactly).

## Tech Stack

- **Runtime:** Node.js 18+, Express 4
- **Database:** MongoDB with Mongoose ODM
- **Auth:** JWT (access + refresh tokens), bcryptjs password hashing
- **Validation:** express-validator
- **Security:** helmet, cors, express-rate-limit, express-mongo-sanitize
- **Uploads:** multer (avatar images)
- **Docs:** swagger-jsdoc + swagger-ui-express (OpenAPI 3.0.3)
- **QR Codes:** qrcode (ticket QR generation)
- **Logging:** morgan
- **Other:** compression, cookie-parser, dotenv

## Project Structure

```
backend/
├── src/
│   ├── config/        # env, database connection, swagger spec
│   ├── controllers/    # route handler logic
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers (with swagger-jsdoc annotations)
│   ├── middlewares/     # auth, validation, error handling, rate limiting, upload
│   ├── services/        # business logic shared across controllers
│   ├── validations/     # express-validator chains per resource
│   ├── utils/            # ApiError, ApiResponse, pagination, ID generation, QR codes, etc.
│   ├── constants/        # shared enums (roles, statuses, etc.)
│   ├── seeders/          # database seed data and seeding script
│   └── app.js            # Express app (middleware + route wiring)
├── uploads/               # uploaded avatar images (gitignored)
├── server.js              # entry point (connects DB, starts HTTP server)
├── .env.example
└── package.json
```

## Getting Started

### 1. Prerequisites

- Node.js >= 18
- A running MongoDB instance (local or remote)

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Copy `.env.example` to `.env` and adjust as needed:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| --- | --- | --- |
| `NODE_ENV` | `development` / `production` / `test` | `development` |
| `PORT` | HTTP port | `5000` |
| `API_PREFIX` | Base path for all API routes | `/api/v1` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/btms` |
| `JWT_SECRET` | Secret for signing access tokens | — |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_SECRET` | Secret for signing refresh tokens | — |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `BCRYPT_SALT_ROUNDS` | bcrypt cost factor | `10` |
| `CLIENT_ORIGINS` | Comma-separated list of allowed CORS origins | `http://localhost:5173,http://localhost:4173` |
| `RATE_LIMIT_WINDOW_MINUTES` | Rate limit window | `15` |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window per IP | `200` |
| `MAX_UPLOAD_SIZE_MB` | Max avatar upload size | `5` |

### 4. Seed the database

Populates MongoDB with realistic demo data matching the frontend mock (users, buses, routes, schedules, bookings, tickets, payments, notifications, live tracking, and settings):

```bash
npm run seed
```

To wipe all collections without reseeding:

```bash
npm run seed:destroy
```

### 5. Run the server

```bash
# development (auto-reload via nodemon)
npm run dev

# production
npm start
```

On startup, the server prints:

- API base: `http://localhost:5000/api/v1`
- API docs (Swagger UI): `http://localhost:5000/api-docs`
- Health check: `http://localhost:5000/health`

## Authentication

Authentication uses **JWT access + refresh tokens**.

1. `POST /api/v1/auth/login` (or `/register`) returns `{ user, accessToken, refreshToken }`.
2. Send the access token on subsequent requests: `Authorization: Bearer <accessToken>`.
3. When the access token expires, call `POST /api/v1/auth/refresh` with `{ refreshToken }` to get a new token pair. Refresh tokens are rotated (the old one is invalidated) and stored server-side (max 5 active sessions per user).
4. `POST /api/v1/auth/logout` with `{ refreshToken }` invalidates that session.

## Roles & Permissions (RBAC)

| Role | Description |
| --- | --- |
| `admin` | Full access to all resources, user/staff/driver management, settings, audit logs |
| `staff` | Manage buses, routes, schedules, bookings, tickets, payments, notifications, drivers (read) |
| `driver` | View own profile/assigned bus, update assigned schedule status & live tracking, verify tickets |
| `customer` | Manage own profile, browse routes/schedules, create bookings, view own tickets/payments/notifications |

Most endpoints require `Authorization: Bearer <accessToken>`. Public (no-auth) endpoints include `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/forgot-password`, `/auth/reset-password`, and read-only `GET /routes`, `GET /routes/:id`, `GET /schedules`, `GET /schedules/:id`, `GET /schedules/:id/seats`.

## API Documentation

Full interactive OpenAPI 3.0 documentation (with request/response schemas, try-it-out) is available at:

```
http://localhost:5000/api-docs
```

A ready-to-import Postman collection is included at [`postman_collection.json`](./postman_collection.json). It uses two collection variables:

- `baseUrl` — defaults to `http://localhost:5000/api/v1`
- `accessToken` — auto-populated by the "Login" request's response handler

## Demo Accounts

All demo accounts are created by `npm run seed`. Password format matches the role (e.g. `Admin@123`).

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@btms.com` | `Admin@123` |
| Staff | `staff@btms.com` | `Staff@123` |
| Driver | `driver@btms.com` | `Driver@123` |
| Customer | `customer@btms.com` | `Customer@123` |

Additional admins, staff, drivers, and customers are seeded with the same role-based passwords — see `src/seeders/data/users.js` for the full list (18 users total).

## Response Envelope

All responses follow a consistent JSON shape.

**Success:**
```json
{
  "success": true,
  "message": "Buses fetched successfully.",
  "data": [ /* ... */ ]
}
```

**Paginated success:**
```json
{
  "success": true,
  "message": "Buses fetched successfully.",
  "data": [ /* ... */ ],
  "meta": { "page": 1, "pageSize": 8, "total": 12, "totalPages": 2 }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Bus not found.",
  "errors": [ /* optional field-level validation errors */ ]
}
```

## API Modules

All routes are prefixed with `/api/v1` (configurable via `API_PREFIX`).

### Auth (`/auth`)
- `POST /auth/register` — register a new customer account
- `POST /auth/login` — log in, returns `{ user, accessToken, refreshToken }`
- `POST /auth/refresh` — exchange a refresh token for a new token pair
- `POST /auth/logout` — invalidate a refresh token
- `GET /auth/me` — get the authenticated user's profile
- `POST /auth/forgot-password` — request a password reset token
- `POST /auth/reset-password` — reset password using a token
- `PATCH /auth/change-password` — change password (authenticated)

### Users (`/users`)
- `PATCH /users/profile` — update own profile (`name`, `phone`)
- `POST /users/avatar` — upload own avatar (multipart `avatar` field)
- `GET /users/counts` — user counts grouped by role (admin/staff)
- `GET /users` — list users (admin/staff; filters: `search`, `role`, `status`, `page`, `pageSize`)
- `POST /users` — create user (admin)
- `GET /users/:id` — get user by ID (admin/staff)
- `PATCH /users/:id` — update user (admin)
- `DELETE /users/:id` — delete user (admin)

### Buses (`/buses`) — admin/staff
- `GET /buses/stats` — fleet counts by status
- `GET /buses` — list buses (filters: `search`, `status`, `acType`, `seatType`, `page`, `pageSize`)
- `POST /buses` — create bus (admin)
- `GET /buses/:id` — get bus by ID
- `PATCH /buses/:id` — update bus (admin)
- `DELETE /buses/:id` — delete bus (admin)
- `PATCH /buses/:id/assign-driver` — assign a driver to a bus

### Drivers (`/drivers`)
- `GET /drivers/me` — authenticated driver's own profile
- `GET /drivers` — list driver profiles (admin/staff)
- `POST /drivers` — create driver profile for an existing user (admin)
- `GET /drivers/:userId` — get driver profile (admin/staff)
- `PATCH /drivers/:userId` — update driver profile (admin)

### Routes (`/routes`) — public read, admin write
- `GET /routes` — list routes (filters: `search`, `status`, `region`, `page`, `pageSize`)
- `POST /routes` — create route (admin)
- `GET /routes/:id` — get route by ID
- `PATCH /routes/:id` — update route (admin)
- `DELETE /routes/:id` — delete route (admin)

### Schedules (`/schedules`) — public read, admin/staff write
- `GET /schedules` — list schedules (filters: `search`, `status`, `routeId`, `busId`, `driverId`, `date`, `page`, `pageSize`)
- `POST /schedules` — create schedule (admin/staff)
- `GET /schedules/:id` — get schedule by ID
- `GET /schedules/:id/seats` — seat map (booked seat numbers)
- `PATCH /schedules/:id` — update schedule (admin/staff)
- `DELETE /schedules/:id` — delete schedule (admin)
- `PATCH /schedules/:id/status` — update status (admin/staff/assigned driver)

### Bookings (`/bookings`)
- `GET /bookings` — list bookings (own for customers; filters: `search`, `status`, `scheduleId`, `customerId`, `page`, `pageSize`)
- `POST /bookings` — create booking & reserve seats
- `GET /bookings/:id` — get booking by ID
- `PATCH /bookings/:id/status` — update status (admin/staff)
- `PATCH /bookings/:id/cancel` — cancel booking, freeing seats and tickets

### Tickets (`/tickets`)
- `GET /tickets` — list tickets (own for customers; filters: `search`, `status`, `bookingId`, `scheduleId`, `customerId`, `page`, `pageSize`)
- `POST /tickets/verify` — verify a ticket by ID or QR payload, marks it `Used` (admin/staff/driver)
- `GET /tickets/:id` — get ticket by ID
- `PATCH /tickets/:id/status` — manually update ticket status (admin/staff)

### Payments (`/payments`)
- `GET /payments` — list payments (own for customers; filters: `search`, `status`, `method`, `bookingId`, `customerId`, `page`, `pageSize`)
- `POST /payments` — process a payment for a booking (confirms booking & issues tickets)
- `GET /payments/:id` — get payment by ID
- `PATCH /payments/:id/refund` — refund a completed payment (admin/staff)

### Tracking (`/tracking`)
- `GET /tracking` — live fleet tracking (filters: `status`, `routeId`)
- `GET /tracking/:busId` — tracking data for one bus
- `PATCH /tracking/:busId` — update tracking data (admin/staff/assigned driver)

### Notifications (`/notifications`)
- `GET /notifications` — list notifications for the authenticated user (filter: `read`, `page`, `pageSize`)
- `POST /notifications` — create a notification for an audience or specific user (admin/staff)
- `GET /notifications/unread-count` — unread count for authenticated user
- `PATCH /notifications/read-all` — mark all as read
- `PATCH /notifications/:id/read` — mark one as read
- `DELETE /notifications/:id` — delete a notification (admin/staff)

### Reports & Analytics (`/reports`) — admin/staff
- `GET /reports/dashboard` — aggregate dashboard statistics
- `GET /reports/revenue` — daily revenue totals (filters: `from`, `to`)
- `GET /reports/routes` — booking/revenue performance per route
- `GET /reports/audit-logs` — audit log entries (admin only; filters: `action`, `entity`, `userId`, `page`, `pageSize`)

### Settings (`/settings`) — admin/staff
- `GET /settings` — get application settings
- `PATCH /settings/:section` — update a settings section (`general`, `booking`, `notifications`, `payments`, `system`) — admin only

## Example Requests

**Login**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@btms.com","password":"Admin@123"}'
```

**Create a booking**
```bash
curl -X POST http://localhost:5000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "scheduleId": "SCH-0842",
    "seatNumbers": ["A1", "A2"],
    "passengers": [
      { "name": "Jane Doe", "age": 28, "gender": "Female", "seatNumber": "A1" },
      { "name": "John Doe", "age": 34, "gender": "Male", "seatNumber": "A2" }
    ],
    "paymentMethod": "Card"
  }'
```

**Process a payment**
```bash
curl -X POST http://localhost:5000/api/v1/payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{ "bookingId": "BK-100015", "amount": 45.00, "method": "Card" }'
```

## Error Handling

Centralized error handling covers:

- Mongoose validation errors → `422 Unprocessable Entity`
- Duplicate key errors (e.g. unique email) → `409 Conflict`
- Invalid ObjectId / cast errors → `400 Bad Request`
- Invalid/expired JWTs → `401 Unauthorized`
- Unknown routes → `404 Not Found`
- All other errors → `500 Internal Server Error`

## License

MIT

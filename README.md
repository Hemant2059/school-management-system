# Nepal School Management System (SMS)

A comprehensive, Nepal-specific school management system built with NestJS and PostgreSQL. Designed to comply with Nepal Government regulations (MOEST, NEB, District Education Office).

## Features

### Core Management

- Student Information Management (with BS/AD dates, caste/ethnicity tracking)
- Teacher & Staff Management (PAN, SSF, citizenship tracking)
- Parent/Guardian Portal
- Class, Section, and Subject Management

### Academic

- Exam Schedule & Management
- Marks Entry & Grade Calculation
- Report Card Generation
- Attendance Tracking (with biometric device support)
- Timetable Management
- Assignment Management

### Finance

- Fee Structure & Collection
- Multiple Payment Methods (Cash, Bank, eSewa, Khalti, Fonepay, ConnectIPS, IME Pay)
- Expense Management
- Financial Reports

### Library & Transport

- Book Inventory & Issue/Return
- Transport Routes & Vehicle Management
- Student Transport Assignments

### Compliance (Nepal Government)

- DEO Student Reports (caste/ethnicity, free seat, disability)
- Staff Reports
- Tax Compliance (PAN, SSF, TDS)
- Fiscal Year in Bikram Sambat

## Tech Stack

| Component | Technology             |
| --------- | ---------------------- |
| Backend   | NestJS 11.x            |
| Database  | PostgreSQL 15+         |
| API       | REST + Swagger/OpenAPI |
| Auth      | JWT                    |
| Cache     | Redis                  |
| Queue     | BullMQ                 |
| Server    | Fastify                |

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Start infrastructure (Postgres on 5544, Redis on 6379)
docker compose up -d postgres redis

# DB schema + file migrations (src/database/migrations/*.sql) apply automatically on boot

# Seed sample data for every model
npm run seed:full

# Start development server
npm run start:dev
```

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=sms_nepal

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=development
```

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:3001/docs
- **OpenAPI JSON**: http://localhost:3001/docs-json
- **Base URL**: http://localhost:3001/api/v1
- **Health**: http://localhost:3001/api/v1/health

## API Response Format

Every endpoint returns the same envelope:

```json
{
  "data": [],
  "total": 47,
  "page": 1,
  "limit": 12
}
```

- List endpoints honour `?page=` and `?limit=` (max 500). Without them, the full list is returned with `total` set to its length.
- Single objects (login, dashboards, created records) are wrapped as `data: [obj]` with `total: 1`.
- `null` results (e.g. DELETEs) return `data: []` with `total: 0`.
- Errors keep the standard shape (`statusCode`, `message`, `path`) — only success responses are enveloped.

Example:

```bash
curl -H "Authorization: Bearer $TOKEN" -H "X-School-Id: 1" \
  "http://localhost:3001/api/v1/assignments?classId=1&page=1&limit=12"
```

## Admin Catalog Endpoints

These school-level masters are managed through CRUD endpoints (all bilingual EN+NP):

| Group | Endpoints |
| ----- | --------- |
| Fee discount rules | `POST/GET /fee/discount-rules`, `PATCH/DELETE /fee/discount-rules/:id` |
| Fee penalty rules | `POST/GET /fee/penalty-rules`, `PATCH/DELETE /fee/penalty-rules/:id` |
| Leave types | `POST/GET /hr/leave-types`, `PATCH/DELETE /hr/leave-types/:id` |
| Document templates | `POST/GET /documents/templates`, `GET/PATCH/DELETE /documents/templates/:id` |

Deletes are soft (deactivate); leave-type delete is blocked while pending requests reference it.

## Nepal-Specific Features

- **Bikram Sambat (BS) Dates**: Every business date is stored as an AD+BS pair (e.g. `due_date` + `due_date_bs`). `created_at`/`updated_at` are AD-only.
- **Date convention**: the frontend converts and sends both dates; the backend stores them verbatim and never auto-converts. All calculations (overdue, fines, ranges) run on AD dates; BS is kept for legal proof and display.
- **Geographic Structure**: Provinces, Districts, Municipalities, Wards
- **Compliance Fields**: MOEST codes, PAN numbers, SSF tracking
- **Digital Payments**: eSewa, Khalti, Fonepay, ConnectIPS, IME Pay

## Project Structure

```
src/
├── auth/              # Authentication & JWT
├── user/              # User management
├── school/            # School settings
├── student/           # Student management
├── teacher/           # Teacher management
├── guardian/          # Parent/Guardian
├── attendance/        # Attendance
├── fee/               # Fees & Payments
├── exam/              # Exams & Marks
├── library/           # Library
├── transport/         # Transport
├── compliance/        # DEO Reports
├── dashboard/         # Analytics
└── database/          # Database service (raw SQL)
```

## Scripts

```bash
npm run start:dev      # Development server with hot reload
npm run build          # Build for production
npm run start:prod     # Run production build
npm run lint           # Lint code
npm run test           # Run tests
npm run seed:full      # Seed sample data for every model
npm run seed:bs-backfill  # Backfill *_bs twins from AD dates (one-off)
```

## Seed Login Credentials

`npm run seed:full` creates one admin per school (password `Admin123!` for all):

| School ID | School | Username | Password |
| --------- | ------ | -------- | -------- |
| 1 | Shree Nepal Primary School | `admin_1` | `Admin123!` |
| 2 | Little Stars Academy | `admin_2` | `Admin123!` |
| 3 | Garden View School | `admin_3` | `Admin123!` |
| 4 | Everest International School | `admin_4` | `Admin123!` |
| 5 | Bharatpur Model College | `admin_5` | `Admin123!` |

Legacy demo logins (school 1): `principal` / `teacher1` / `accountant`, all with password `password123`.

## Documentation

- [Government Submission Documentation](./docs/GOVERNMENT_SUBMISSION.md) - Full compliance documentation
- [API Documentation](./docs/) - Detailed API endpoints

## License

Private - All rights reserved

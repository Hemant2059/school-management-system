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

# Run database migration
psql -U postgres -d sms_nepal -f src/database/migrations/1706200000000-NepalSchemaEnhancement.sql

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
PORT=3000
NODE_ENV=development
```

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:3000/docs
- **OpenAPI JSON**: http://localhost:3000/docs-json

## Nepal-Specific Features

- **Bikram Sambat (BS) Dates**: Full support throughout the system
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
npm run seed           # Seed database
```

## Documentation

- [Government Submission Documentation](./docs/GOVERNMENT_SUBMISSION.md) - Full compliance documentation
- [API Documentation](./docs/) - Detailed API endpoints

## License

Private - All rights reserved

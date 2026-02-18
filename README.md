# School Management System (Backend)

A comprehensive backend solution for modern schools, built with NestJS and TypeORM. 

## 🚀 Key Features
- **Global Auth & RBAC**: Secure JWT-based authentication with role-based access control (Admin, Teacher, Staff, Student, etc.).
- **Bilingual Support**: Nepali (BS) and English (AD) date system integration with bilingual data entry (Unicode support).
- **Academic Management**: Comprehensive management for Classes, Sections, Subjects, and Enrollments.
- **Attendance**: Bulk and individual attendance tracking with holiday detection.
- **Library & Transport**: Book issue tracking and student transport route/fee management.
- **Exams & Results**: Automated mark calculation, result publishing, and digital report card generation.
- **HR & Payroll**: Staff onboarding, leave management, and automated payslip generation.
- **Notifications**: System alerts with planned SMS integration.

## 📖 Documentation
For a detailed list of all system endpoints, base URL, and authentication methods, please refer to:
👉 **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

## 🛠 Project Setup

```bash
# Install dependencies
$ pnpm install

# Database Setup (PostgreSQL)
# Ensure your .env is configured correctly

# Run migrations
$ pnpm run TypeORM:migrate

# Seed the database (Populates 34+ tables with 10 records each)
$ npx ts-node src/database/seeds/seeder.ts
```

## Running the App

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## 🧪 Testing

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e
```

## 📜 License
Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

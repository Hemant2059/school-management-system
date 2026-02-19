import { NestFactory, Reflector } from '@nestjs/core';
import {
  VersioningType,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import compression from '@fastify/compress';
import helmet from '@fastify/helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TimeoutInterceptor } from './common/interceptors/timeout.interceptor';
import { MultiTenancyInterceptor } from './common/guards/multitenancy.guard';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { bufferLogs: true },
  );

  // Use Pino Logger
  app.useLogger(app.get(Logger));
  const logger = app.get(Logger);

  // Security & Performance
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        scriptSrc: [
          `'self'`,
          `'unsafe-inline'`,
          `cdn.jsdelivr.net`,
          `unpkg.com`,
        ],
        styleSrc: [
          `'self'`,
          `'unsafe-inline'`,
          `cdn.jsdelivr.net`,
          `unpkg.com`,
        ],
        imgSrc: [`'self'`, `data:`, `validator.swagger.io`],
        connectSrc: [`'self'`, `http://localhost:*`, `http://127.0.0.1:*`],
        workerSrc: [`'self'`, `blob:`],
        fontSrc: [`'self'`, `https:`, `data:`],
      },
    },
  });

  await app.register(compression);

  // Enable Graceful Shutdown
  app.enableShutdownHooks();

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global Configs
  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TimeoutInterceptor());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // ============================================================
  // MULTI-TENANCY - Auto-set school_id from authenticated user
  // ============================================================
  app.useGlobalInterceptors(new MultiTenancyInterceptor());

  // ============================================================
  // COMPREHENSIVE SWAGGER DOCUMENTATION
  // ============================================================
  const port = process.env.PORT ?? 3000;
  const swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      // Basic Info
      .setTitle('Nepal School Management System API')
      .setDescription(
        `
# 🇳🇵 School Management System API

## Overview
Comprehensive REST API for managing school operations in Nepal. Designed for Nepali schools with full support for Bikram Sambat dates, local phone numbers, and government compliance requirements.

## 🎯 Key Features

### Core Academic
- 👨‍🎓 **Student Management** - Full student lifecycle from admission to TC
- 👨‍🏫 **Teacher Management** - Staff profiles, subjects, qualifications
- 📝 **Attendance** - Daily marking, reports, SMS alerts
- 📊 **Exams** - Create exams, schedules, grading
- 📋 **Results** - Marks entry with DRAFT→PUBLISHED workflow
- 🎓 **Grade Scales** - Custom grade definitions, GPA calculation

### Financial
- 💰 **Fee Management** - Monthly/annual fees, discounts, scholarships
- 💳 **Payments** - Cash, bank transfer, eSewa, Khalti integration

### Administrative
- 📜 **Certificates** - TC, Bonafide, Character certificates
- 📅 **Academic Calendar** - Holidays, events, exam schedules
- 🏠 **Hostel** - Room allocation, meals, charges
- 🚌 **Transport** - Routes, stops, vehicle management
- 📚 **Library** - Books, issue/return, fines

### Communication
- 📱 **SMS** - Attendance alerts, fee reminders, results
- 🔔 **Notifications** - In-app push notifications
- 📹 **Video Classes** - Live classes, recordings

### Reports & Compliance
- 📈 **Dashboard** - Real-time analytics
- 📤 **Export** - CSV/JSON for external systems
- 📋 **Compliance** - DEO reports, government templates
- 🔒 **Audit Logs** - Track all changes

### Integrations
- 🔗 **Webhooks** - Payment callbacks, real-time events
- 🔄 **Sync API** - Offline-first mobile app support
- 🤖 **AI Assistant** - Automated responses

---

## 🔐 Authentication

### Login Flow
\`\`\`
1. POST /auth/login → Get accessToken, refreshToken
2. Use accessToken in Authorization header
3. When expired, POST /auth/refresh → Get new tokens
\`\`\`

### Required Headers
\`\`\`
Authorization: Bearer <access_token>
schoolId: 1  (required for most endpoints)
Content-Type: application/json
\`\`\`

---

## 📋 Common Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| schoolId | integer | School identifier (required) |
| academicYear | string | BS year (e.g., "2082") |
| page | integer | Page number (default: 1) |
| limit | integer | Items per page (default: 20) |

---

## 📅 Date Formats

| Format | Example | Description |
|--------|---------|-------------|
| AD | 2026-02-19 | Gregorian date |
| BS | 2082-11-08 | Bikram Sambat date |

---

## 📱 Phone Numbers

Nepal mobile numbers (10 digits, starts with 98/97):
- 9841234567
- 9861234567

---

## ⚠️ Error Responses

### 400 - Validation Error
\`\`\`json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "phone", "message": "Phone must be 10 digits" }
  ]
}
\`\`\`

### 401 - Unauthorized
\`\`\`json
{
  "statusCode": 401,
  "message": "Invalid credentials"
}
\`\`\`

### 403 - Forbidden
\`\`\`json
{
  "statusCode": 403,
  "message": "Insufficient permissions"
}
\`\`\`

---

## 🚀 Quick Start

### 1. Login
\`\`\`bash
curl -X POST http://localhost:3001/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"username": "admin", "password": "Admin@123"}'
\`\`\`

### 2. Get Students
\`\`\`bash
curl http://localhost:3001/api/v1/students?schoolId=1 \\
  -H "Authorization: Bearer <token>"
\`\`\`

---

## 📊 Result Publishing Workflow

\`\`\`
DRAFT → SUBMITTED → VERIFIED → APPROVED → PUBLISHED → LOCKED
  ↓        ↓          ↓         ↓          ↓          ↓
Teacher  Admin      HOD      Principal   Admin      System
submit   verify    check     approve    publish   lock
\`\`\`

---

## 🇳🇵 Nepal-Specific Features

1. **Bikram Sambat Dates** - All dates support BS format
2. **Caste/Ethnicity Codes** - Government standard codes
3. **Govt. Free Seat** - Economically disadvantaged tracking
4. **DEO Compliance** - District Education Office reports
5. **SMS in Nepali** - Unicode support for Devanagari

---

## 📞 Support

- **Email**: support@school.edu.np
- **Documentation**: docs.school.edu.np

---
    `,
      )
      .setVersion('1.0.0')
      .setTermsOfService('https://school.edu.np/terms')

      // Tags - All modules
      .addTag(
        'Authentication',
        'User login, registration, password management, token refresh',
      )
      .addTag(
        'Student Management',
        'Student admission, profile, documents, enrollment',
      )
      .addTag(
        'Teacher Management',
        'Teacher profiles, subjects, qualifications',
      )
      .addTag(
        'Guardian Management',
        'Parent/guardian profiles, contact details',
      )
      .addTag(
        'Attendance Management',
        'Daily attendance, bulk marking, reports',
      )
      .addTag('Exam Management', 'Create exams, schedules, exam types')
      .addTag(
        'Results & Marks',
        'Marks entry, grade calculation, publishing workflow',
      )
      .addTag('Fee Management', 'Fee structures, invoices, payments, discounts')
      .addTag(
        'Grade Scales',
        'Grade definitions, GPA calculation, credit hours',
      )
      .addTag(
        'Certificates',
        'Transfer Certificate, Bonafide, Character certificates',
      )
      .addTag('SMS', 'Send SMS, templates, delivery logs')
      .addTag('Academic Calendar', 'Holidays, events, exam schedules')
      .addTag('Documents', 'Student document upload, verification')
      .addTag(
        'Export',
        'CSV/JSON export for students, teachers, attendance, fees',
      )
      .addTag('Sync', 'Offline-first mobile app sync (push/pull)')
      .addTag('Webhooks', 'Payment callbacks, event notifications')
      .addTag('Health Check', 'System health, database, memory status')
      .addTag('School Management', 'School settings, academic years, branches')
      .addTag('User Management', 'System users, roles, permissions')
      .addTag('Dashboard Statistics', 'Real-time analytics, charts, reports')
      .addTag('Timetable Management', 'Class schedules, period management')
      .addTag('Subject Management', 'Subjects, compulsory/optional')
      .addTag('Section Management', 'Sections (A, B, C), stream division')
      .addTag(
        'Academic Class Management',
        'Class-room assignment, class teacher',
      )
      .addTag('Enrollment Management', 'Student class enrollment')
      .addTag('Hostel Management', 'Hostel facilities, room allocation, meals')
      .addTag('Transport Management', 'Bus routes, stops, vehicle tracking')
      .addTag('Library Management', 'Books, issue/return, fines')
      .addTag('HR & Payroll', 'Staff payroll, leaves, attendance')
      .addTag('Assignment Management', 'Homework, submissions, grading')
      .addTag('Notification Management', 'Push notifications, alerts')
      .addTag(
        'Video Class Management',
        'Live classes, recordings, Zoom integration',
      )
      .addTag(
        'Payment Management',
        'Payment gateway integration (eSewa, Khalti)',
      )
      .addTag('Student & Parent Portal', 'Student/parent self-service portal')
      .addTag('DEO Compliance & Reports', 'Government compliance reports')
      .addTag('Report Card Management', 'Report card generation, printing')
      .addTag('AI Assistant', 'AI-powered queries and automation')
      .addTag('Promotion', 'Student promotion to next class')
      .addTag('Student Guardian', 'Link students to guardians')
      .addTag('Audit Logs', 'System audit trail, activity logs')

      // Security
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          description: 'Enter JWT access token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'schoolId',
          in: 'header',
          description: 'School ID (required for most endpoints)',
        },
        'schoolId',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'Accept-Language',
          in: 'header',
          description: 'Language: en or np',
        },
        'language',
      )
      .build();

    // Swagger UI Options
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document, {
      customSiteTitle: '🇳🇵 School Management System API',
      customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { font-size: 2.5em; }
      .swagger-ui .info .description { font-size: 1.1em; line-height: 1.8; }
      .swagger-ui .scheme-container { padding: 20px; background: #f8f9fa; border-radius: 8px; }
    `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'list',
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        syntaxHighlight: {
          activate: true,
          theme: 'monokai',
        },
      },
      explorer: true,
    });

    logger.log(`Swagger documentation enabled: http://localhost:${port}/docs`);
  } else {
    logger.log('Swagger documentation disabled in production');
  }

  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://localhost:${port}/api`);
  logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}
void bootstrap();

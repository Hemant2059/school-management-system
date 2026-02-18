# Nepal School Management System (SMS)

## Government Compliance Documentation

---

## 1. Project Overview

### 1.1 Project Name

**Nepal School Management System (SMS)** - A comprehensive, Nepal-specific school management software built with modern web technologies.

### 1.2 Purpose

A fully compliant school management system designed specifically for Nepal's educational institutions, supporting:

- Nepal Government regulations (MOEST, NEB, District Education Office)
- Bikram Sambat (BS) calendar system
- Nepal's federal structure (Provinces, Districts, Municipalities, Wards)
- Tax compliance (PAN, VAT, SSF)
- Multi-tenant architecture for multiple schools

### 1.3 Technology Stack

| Component          | Technology            | Version |
| ------------------ | --------------------- | ------- |
| Backend Framework  | NestJS                | 11.x    |
| Database           | PostgreSQL            | 15+     |
| API Documentation  | Swagger/OpenAPI       | 3.x     |
| Authentication     | JWT (Passport)        | -       |
| Logging            | Pino                  | -       |
| Cache              | Redis                 | 7.x     |
| Queue              | BullMQ                | 5.x     |
| Server             | Fastify               | 5.x     |
| Nepal Date Library | nepali-date-converter | 3.4.0   |

---

## 2. Nepal-Specific Features

### 2.1 Calendar System

- **Bikram Sambat (BS)** date support throughout the system
- **Gregorian (AD)** dates stored alongside BS for international compatibility
- Nepal-specific date utility functions:
  - `ad_to_bs()` - Convert AD to BS
  - `get_bs_month_name()` - Get Nepali month names

### 2.2 Geographic Structure

Full support for Nepal's federal structure:

- **Provinces** (7 provinces)
- **Districts** (77 districts)
- **Local Bodies** (Municipalities/Rural Municipalities)
- **Wards**
- Address fields in both English and Nepali

### 2.3 Compliance Fields

#### Schools

- MOEST School Code
- PAN Number
- SSF Employer Number
- Labor Office Registration
- Affiliation Number (NEB/Board)
- Local Body Type

#### Students

- Caste/Ethnicity (for DEO reports)
- Birth Certificate Number
- Citizenship Number (for 16+ students)
- Government-mandated free seat tracking
- Economically disadvantaged status
- Disability tracking
- Bank account details for scholarships

#### Teachers/Staff

- Citizenship Number + Issue District + Date
- PAN Number
- SSF (Social Security Fund) Number
- Teaching License Number
- Caste/Ethnicity for compliance reports
- Marital Status
- Emergency Contact Details
- Bank Account for salary

### 2.4 Fee & Payment Compliance

- Nepal-specific payment methods:
  - Cash, Bank Transfer, Cheque
  - **Digital Wallets**: eSewa, Khalti, Fonepay, ConnectIPS, IME Pay
- Transaction UUID for payment gateway tracking
- GST/TDS tracking
- Fiscal year in BS (e.g., 2081-2082)
- Scholarship tracking

---

## 3. Database Schema

### 3.1 Core Tables

```
schools
├── school_id (PK)
├── school_code (Unique)
├── school_name / school_name_nepali
├── moest_school_code
├── pan_number
├── ssf_employer_number
├── province_id, district_id, municipality_id, ward_id
├── tole, street_address (EN/NP)
└── is_active

users
├── user_id (PK)
├── school_id (FK)
├── role_id (FK)
├── username, email, phone
├── password_hash
├── user_type (admin/teacher/parent/student)
├── is_verified, is_active
└── last_login_at

students
├── student_id (PK)
├── school_id (FK)
├── student_code (Unique)
├── admission_number
├── first_name_en/np, middle_name_en/np, last_name_en/np
├── date_of_birth_ad, date_of_birth_bs
├── gender, blood_group, religion, mother_tongue
├── caste_ethnicity, caste_ethnicity_code
├── citizenship_number, birth_certificate_number
├── permanent_address (EN/NP)
├── temporary_address (EN/NP)
├── is_govt_mandated_free_seat
├── is_economically_disadvantaged
├── has_disability, disability_type
├── bank_name, bank_account_number
└── current_status (active/graduated/transferred)

teachers
├── teacher_id (PK)
├── school_id (FK)
├── teacher_code, employee_id
├── first_name_en/np, middle_name_en/np, last_name_en/np
├── date_of_birth, date_of_birth_bs
├── gender, blood_group, nationality, religion
├── highest_qualification, specialization
├── teaching_license_number, license_expiry_date
├── citizenship_number, citizenship_issue_district
├── pan_number, ssf_number
├── permanent_address (EN/NP)
├── joining_date, joining_date_bs
├── employment_type (permanent/contract/daily)
├── department, designation
├── bank_name, bank_account_number
├── emergency_contact_name, phone, relation
└── current_status (active/resigned/retired)

parents/guardians
├── parent_id (PK)
├── school_id (FK)
├── user_id (FK - for login)
├── guardian_code
├── first_name_en/np, last_name_en/np
├── relation_to_student
├── occupation, organization, designation
├── mobile, email, whatsapp_number
└── address (EN/NP)

classes (academic_classes)
├── class_id (PK)
├── school_id (FK)
├── class_name (e.g., "Grade 1", "Class 11")
├── class_code
├── class_order
├── education_level (school/plus2)
├── min_age, max_age
└── max_students_per_section

sections
├── section_id (PK)
├── school_id (FK)
├── class_id (FK)
├── section_name (e.g., "A", "B")
├── capacity
├── homeroom_teacher_id (FK)
└── student_count

subjects
├── subject_id (PK)
├── school_id (FK)
├── subject_name / subject_name_nepali
├── subject_code
├── subject_type (compulsory/optional/practical)
├── credit_hours
├── theory_full_marks, theory_pass_marks
├── practical_full_marks, practical_pass_marks
└── is_active
```

### 3.2 Academic & Exam Tables

```
academic_years
├── academic_year_id (PK)
├── school_id (FK)
├── session_name (e.g., "2081-2082")
├── start_date, end_date
├── is_current
└── is_active

shifts
├── shift_id (PK)
├── school_id (FK)
├── shift_name (e.g., "Morning", "Day")
├── start_time, end_time
└── is_active

streams (for Class 11-12)
├── stream_id (PK)
├── school_id (FK)
├── class_id (FK)
├── stream_name (Science/Commerce/Humanities)
├── stream_code
└── is_active

subject_allocations
├── allocation_id (PK)
├── school_id, class_id, section_id
├── subject_id, teacher_id
├── academic_year
└── is_active

exams
├── exam_id (PK)
├── school_id (FK)
├── exam_name, exam_code
├── exam_type (unit_test/terminal/final/see/neb/board)
├── class_id, section_id, subject_id
├── exam_date, exam_date_bs
├── start_time, end_time
├── full_marks, pass_marks
├── is_published, is_result_published, is_locked
├── remarks
└── academic_year

marks
├── mark_id (PK)
├── school_id, exam_id, student_id
├── theory_marks, practical_marks, total_marks
├── grade, grade_point, grade_np
├── class_rank, section_rank
├── remarks
├── is_submitted, is_verified
└── academic_year

grade_systems
├── grade_id (PK)
├── school_id (FK)
├── grade_name (e.g., "A+", "A")
├── grade_name_np
├── grade_points
├── min_mark, max_mark
├── remark
└── is_active

attendance_records (student_attendance)
├── attendance_id (PK)
├── school_id, student_id
├── class_id, section_id
├── attendance_date, attendance_date_bs
├── status (present/absent/late/leave/holiday)
├── session (morning/afternoon/full_day)
├── check_in_time, check_out_time
├── biometric_device_id
├── academic_year
└── is_active
```

### 3.3 Finance Tables

```
fee_structures
├── structure_id (PK)
├── school_id (FK)
├── class_id, stream_id, section_id
├── academic_year
├── fee_type (tuition/exam/transport/library)
├── amount
├── is_recurring, fee_frequency
├── due_date, due_date_bs
└── is_mandatory

fees
├── fee_id (PK)
├── school_id, student_id
├── fee_type
├── amount, discount_amount, fine_amount, total_amount
├── due_date, due_date_bs
├── status (pending/paid/partial/overdue)
├── payment_date, payment_date_bs
├── payment_method
├── transaction_id, transaction_uuid
├── gateway_name, gateway_response (JSON)
├── fiscal_year_bs
├── scholarship_percent
├── invoice_number
├── discount_type, discount_percent
├── fine_type, fine_percent
├── is_fully_paid
├── partial_payment_amount
├── late_fee_applied
├── received_by, bank_name, cheque_number
└── academic_year

payments
├── payment_id (PK)
├── school_id, invoice_id, student_id
├── amount
├── payment_date, payment_date_bs, payment_time
├── payment_method
├── transaction_id, transaction_uuid
├── gateway_name, gateway_response (JSON)
├── received_by
├── bank_name, branch_name
├── cheque_number, cheque_date
├── reference_number
├── is_verified, verified_by, verified_at
└── created_at

expenses
├── expense_id (PK)
├── school_id (FK)
├── expense_category
├── expense_date, expense_date_bs
├── amount
├── description
├── voucher_number
├── payment_method
├── vendor_name
└── created_by
```

### 3.4 Supporting Tables

```
roles
├── role_id (PK)
├── role_name (SUPER_ADMIN/PRINCIPAL/ADMIN/ACCOUNTANT/TEACHER/PARENT/STUDENT)
├── role_name_np
├── description
├── permissions (JSON)
└── is_system_default

leave_requests
├── leave_request_id (PK)
├── school_id, staff_id, leave_type_id
├── start_date, end_date, total_days
├── reason
├── status (pending/approved/rejected)
├── approved_by, approved_at
└── created_at

payroll
├── payroll_id (PK)
├── school_id, staff_id
├── month, year
├── salary_month_bs
├── basic_salary
├── allowances (house_rent/transport/medical/other)
├── deductions (cit/ssf/provident_fund/tax/other)
├── gross_salary, total_deductions, net_salary
├── payment_date, payment_status
├── payment_method, transaction_reference
├── bank_name, account_number
├── is_tax_exempt
└── academic_year_id

library_books
├── book_id (PK)
├── school_id (FK)
├── isbn, book_code
├── title, title_np
├── author, author_np
├── publisher, publisher_np
├── category
├── total_copies, available_copies
├── price, rack_number
└── is_active

book_issues
├── issue_id (PK)
├── school_id, book_id
├── student_id, teacher_id
├── issue_date, issue_date_bs
├── due_date, due_date_bs
├── return_date, return_date_bs
├── fine_amount, days_overdue
├── status (issued/returned/overdue)
├── remarks
└── issued_by

transport_routes
├── route_id (PK)
├── transport_id (FK)
├── route_name, route_code
├── start_point, end_point
├── distance_km
└── is_active

vehicles
├── vehicle_id (PK)
├── transport_id (FK)
├── vehicle_number, vehicle_name
├── vehicle_type, capacity
└── is_active

route_stops
├── stop_id (PK)
├── route_id (FK)
├── stop_name, stop_order
├── arrival_time
└── is_active

transport_assignments
├── assignment_id (PK)
├── school_id, student_id
├── route_id, vehicle_id
├── academic_year
└── is_active

hostels
├── hostel_id (PK)
├── school_id (FK)
├── hostel_name, hostel_name_np
├── hostel_type (boys/girls/mixed)
├── total_rooms, capacity_per_room
├── monthly_fee
├── warden_name, warden_phone
└── is_active

hostel_allocations
├── allocation_id (PK)
├── school_id, student_id
├── hostel_id
├── room_number, bed_number
├── allocation_date, allocation_date_bs
├── monthly_fee
└── is_active

notices
├── notice_id (PK)
├── school_id (FK)
├── title, title_np
├── description, description_np
├── target_audience
├── class_id, section_id
├── publish_date, expiry_date
├── is_published
├── attachment_urls (JSON)
└── created_by

notifications
├── notification_id (PK)
├── school_id, user_id
├── title, message
├── type (info/warning/error/success)
├── is_read
└── sent_at

assignments
├── assignment_id (PK)
├── school_id (FK)
├── title, description
├── class_id, section_id, subject_id
├── teacher_id
├── due_date, due_date_bs
├── total_marks
├── instructions, attachments (JSON)
├── is_published
└── academic_year

audit_logs
├── log_id (PK)
├── user_id
├── action, entity_type, entity_id
├── old_values, new_values (JSON)
├── ip_address, user_agent
└── created_at
```

---

## 4. API Endpoints

### 4.1 Authentication

| Method | Endpoint           | Description       |
| ------ | ------------------ | ----------------- |
| POST   | /api/auth/login    | User login        |
| POST   | /api/auth/register | Register new user |
| POST   | /api/auth/refresh  | Refresh token     |
| POST   | /api/auth/logout   | Logout            |

### 4.2 Schools

| Method | Endpoint         | Description        |
| ------ | ---------------- | ------------------ |
| GET    | /api/schools     | List all schools   |
| GET    | /api/schools/:id | Get school details |
| POST   | /api/schools     | Create school      |
| PUT    | /api/schools/:id | Update school      |
| DELETE | /api/schools/:id | Delete school      |

### 4.3 Students

| Method | Endpoint                     | Description         |
| ------ | ---------------------------- | ------------------- |
| GET    | /api/students                | List students       |
| GET    | /api/students/:id            | Get student details |
| POST   | /api/students                | Create student      |
| PUT    | /api/students/:id            | Update student      |
| DELETE | /api/students/:id            | Delete student      |
| GET    | /api/students/:id/fees       | Get student fees    |
| GET    | /api/students/:id/attendance | Get attendance      |
| GET    | /api/students/:id/marks      | Get marks           |

### 4.4 Teachers

| Method | Endpoint          | Description         |
| ------ | ----------------- | ------------------- |
| GET    | /api/teachers     | List teachers       |
| GET    | /api/teachers/:id | Get teacher details |
| POST   | /api/teachers     | Create teacher      |
| PUT    | /api/teachers/:id | Update teacher      |
| DELETE | /api/teachers/:id | Delete teacher      |

### 4.5 Attendance

| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| GET    | /api/attendance      | List attendance      |
| POST   | /api/attendance      | Mark attendance      |
| POST   | /api/attendance/bulk | Bulk mark attendance |
| PUT    | /api/attendance/:id  | Update attendance    |

### 4.6 Fees

| Method | Endpoint                          | Description             |
| ------ | --------------------------------- | ----------------------- |
| GET    | /api/fees/categories              | List fee categories     |
| POST   | /api/fees/structures              | Create fee structure    |
| GET    | /api/fees/structures/:classId     | Get class fee structure |
| POST   | /api/fees/student-fees            | Assign fee to student   |
| GET    | /api/fees/student-fees/:studentId | Get student fees        |
| POST   | /api/fees/payments                | Process payment         |
| GET    | /api/fees/receipts/:id            | Generate receipt        |
| GET    | /api/fees/overdue                 | Get overdue fees        |

### 4.7 Exams

| Method | Endpoint                   | Description          |
| ------ | -------------------------- | -------------------- |
| GET    | /api/exams                 | List exams           |
| POST   | /api/exams                 | Create exam          |
| PUT    | /api/exams/:id             | Update exam          |
| POST   | /api/exams/:id/schedule    | Create exam schedule |
| POST   | /api/exams/:id/marks       | Submit marks         |
| GET    | /api/exams/:id/marks       | Get exam marks       |
| POST   | /api/exams/:id/report-card | Generate report card |

### 4.8 Reports (DEO Compliance)

| Method | Endpoint                       | Description            |
| ------ | ------------------------------ | ---------------------- |
| GET    | /api/compliance/deo/students   | DEO student report     |
| GET    | /api/compliance/deo/staff      | DEO staff report       |
| GET    | /api/compliance/deo/castes     | Caste/ethnicity report |
| GET    | /api/compliance/deo/free-seat  | Free seat report       |
| GET    | /api/compliance/deo/disability | Disability report      |

---

## 5. Security Features

### 5.1 Authentication & Authorization

- JWT-based authentication
- Role-based access control (RBAC)
- Roles: SUPER_ADMIN, PRINCIPAL, ADMIN, ACCOUNTANT, TEACHER, PARENT, STUDENT

### 5.2 Multi-Tenant Security

- Row Level Security (RLS) enabled on all tables
- School-based data isolation
- Application must set `app.current_school_id` before queries

### 5.3 API Security

- Rate limiting (ThrottlerModule)
- CORS configuration
- Helmet for security headers
- Input validation with class-validator

### 5.4 Audit Logging

- All CRUD operations logged
- Tracks: user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent

---

## 6. Installation & Setup

### 6.1 Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### 6.2 Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_NAME=sms_nepal
DB_SCHEMA=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_TTL=3600

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 6.3 Database Setup

```bash
# Run migration
psql -U postgres -d sms_nepal -f src/database/migrations/1706200000000-NepalSchemaEnhancement.sql

# Or use the application seed (if available)
npm run seed
```

### 6.4 Start Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 6.5 API Documentation

After starting the server:

- Swagger UI: http://localhost:3000/docs
- OpenAPI JSON: http://localhost:3000/docs-json

---

## 7. Nepal Government Compliance

### 7.1 Ministry of Education (MOEST)

- ✅ School Code registration
- ✅ Student enrollment tracking
- ✅ Teacher qualification records
- ✅ Caste/Ethnicity reporting

### 7.2 National Examination Board (NEB)

- ✅ Exam schedule management
- ✅ Marks entry & grade calculation
- ✅ Board exam registration fields
- ✅ Report card generation

### 7.3 District Education Office (DEO)

- ✅ Student statistics by caste/ethnicity
- ✅ Free seat (government mandated) tracking
- ✅ Economically disadvantaged reporting
- ✅ Disability reporting
- ✅ Teacher staff reports

### 7.4 Tax Compliance

- ✅ PAN number for schools, staff, students
- ✅ SSF (Social Security Fund) tracking
- ✅ Tax deduction from payroll
- ✅ TDS on fees

### 7.5 Digital Payments

- ✅ eSewa integration
- ✅ Khalti integration
- ✅ Fonepay integration
- ✅ ConnectIPS integration
- ✅ IME Pay integration

---

## 8. Project Structure

```
src/
├── app.module.ts                 # Root module
├── main.ts                      # Application entry
├── config/
│   └── env.validation.ts         # Environment validation
├── database/
│   ├── database.module.ts       # Database module
│   ├── database.service.ts      # Raw SQL service (pg)
│   ├── entities/
│   │   └── interfaces.ts        # TypeScript interfaces
│   └── migrations/
│       └── 1706200000000-NepalSchemaEnhancement.sql
├── auth/                        # Authentication
├── user/                        # User management
├── school/                      # School management
├── student/                     # Student management
├── teacher/                     # Teacher management
├── guardian/                    # Parent/Guardian management
├── academic-class/              # Class management
├── section/                     # Section management
├── subject/                     # Subject management
├── enrollment/                 # Enrollment management
├── attendance/                  # Attendance management
├── fee/                         # Fee management
├── exam/                        # Exam management
├── result/                      # Results management
├── assignment/                  # Assignments
├── report-card/                 # Report cards
├── library/                     # Library management
├── transport/                   # Transport management
├── timetable/                   # Timetable management
├── hr/                          # Human resources
├── notification/                # Notifications
├── dashboard/                   # Dashboard analytics
├── compliance/                   # DEO reports
├── ai/                          # AI features
└── common/
    ├── filters/                 # Exception filters
    ├── interceptors/            # Interceptors
    └── guards/                  # Guards
```

---

## 9. License & Support

This software is developed specifically for Nepal's educational institutions and complies with:

- Ministry of Education, Science and Technology (MOEST) guidelines
- National Examination Board (NEB) requirements
- Nepal Government fiscal policies
- Data privacy regulations

---

## 10. Contact & Support

For technical support and customizations:

- Email: [Your Email]
- Phone: [Your Phone]
- Website: [Your Website]

---

**Document Version:** 1.0  
**Last Updated:** February 2026  
**Compliance:** Nepal Ministry of Education, NEB, Tax Office, SSF

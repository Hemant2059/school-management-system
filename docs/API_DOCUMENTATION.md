# Nepal School Management System - Complete API Documentation

---

# TABLE OF CONTENTS

1. [Authentication](#1-authentication)
2. [Student Management](#2-student-management)
3. [Teacher Management](#3-teacher-management)
4. [Guardian Management](#4-guardian-management)
5. [Attendance](#5-attendance)
6. [Exams](#6-exams)
7. [Results & Marks](#7-results--marks)
8. [Fee Management](#8-fee-management)
9. [Grade Scales](#9-grade-scales)
10. [Certificates](#10-certificates)
11. [SMS](#11-sms)
12. [Academic Calendar](#12-academic-calendar)
13. [Documents](#13-documents)
14. [Export](#14-export)
15. [Sync (Offline)](#15-sync-offline)
16. [Webhooks](#16-webhooks)
17. [Audit Logs](#17-audit-logs)
18. [Promotion](#18-promotion)
19. [Student Guardian](#19-student-guardian)
20. [School Management](#20-school-management)
21. [User Management](#21-user-management)
22. [Dashboard](#22-dashboard)
23. [Timetable](#23-timetable)
24. [Subjects](#24-subjects)
25. [Sections](#25-sections)
26. [Academic Class](#26-academic-class)
27. [Enrollment](#27-enrollment)
28. [Hostel](#28-hostel)
29. [Transport](#29-transport)
30. [Library](#30-library)
31. [HR & Payroll](#31-hr--payroll)
32. [Assignments](#32-assignments)
33. [Notifications](#33-notifications)
34. [Video Class](#34-video-class)
35. [Payments](#35-payments)
36. [Portal](#36-portal)
37. [Compliance](#37-compliance)
38. [Report Card](#38-report-card)
39. [AI Assistant](#39-ai-assistant)

---

# 1. AUTHENTICATION

## Overview

Manages user registration, login, password reset, and token refresh.

## Base URL

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/change-password
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/logout
```

## Endpoints

### POST /auth/register

Register a new user.

**Request Body:**

```json
{
  "username": "admin123",
  "password": "Password123!",
  "fullName": "Admin User",
  "email": "admin@school.edu.np",
  "phone": "9841000001",
  "userType": "ADMIN",
  "schoolId": 1
}
```

**User Types:** ADMIN, PRINCIPAL, TEACHER, LIBRARIAN, ACCOUNTANT, STAFF, STUDENT, PARENT

**Response (201):**

```json
{
  "message": "User registered successfully. Account is active.",
  "userId": "1"
}
```

### POST /auth/login

Login with username/email/phone and password.

**Request Body:**

```json
{
  "username": "testadmin",
  "password": "Admin@123"
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "sessionId": "uuid",
  "user": {
    "id": "1",
    "schoolId": "1",
    "username": "testadmin",
    "fullName": "Test Admin",
    "userType": "ADMIN",
    "email": "admin@test.com",
    "phone": "9841000001"
  }
}
```

### POST /auth/refresh

Refresh access token using refresh token.

**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### POST /auth/change-password

Change current password.

**Request Body:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword123!"
}
```

---

# 2. STUDENT MANAGEMENT

## Overview

Complete student lifecycle management with Nepal-specific fields (BS/AD dates, province/district, bilingual support).

## Base URL

```
POST /api/v1/students
GET  /api/v1/students
GET  /api/v1/students/search
GET  /api/v1/students/:id
GET  /api/v1/students/:id/full
GET  /api/v1/students/admission/:admissionNumber
PATCH /api/v1/students/:id
DELETE /api/v1/students/:id
```

## Data Model

### Fields (40+)

| Field                    | Type   | Required | Description                               |
| ------------------------ | ------ | -------- | ----------------------------------------- |
| `schoolId`               | number | Yes      | School identifier                         |
| `admissionNumber`        | string | Yes      | Unique admission ID (e.g., ADM-2024-0001) |
| `firstNameEn`            | string | Yes      | First name in English                     |
| `middleNameEn`           | string | No       | Middle name in English                    |
| `lastNameEn`             | string | Yes      | Last name in English                      |
| `firstNameNp`            | string | No       | First name in Nepali (Unicode)            |
| `middleNameNp`           | string | No       | Middle name in Nepali                     |
| `lastNameNp`             | string | No       | Last name in Nepali                       |
| `dateOfBirthAd`          | date   | Yes      | DOB in Gregorian (YYYY-MM-DD)             |
| `dateOfBirthBs`          | string | No       | DOB in Bikram Sambat (YYYY-MM-DD)         |
| `gender`                 | enum   | Yes      | MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY    |
| `bloodGroup`             | string | No       | A_POSITIVE, B_POSITIVE, etc.              |
| `religion`               | string | No       | Religion (e.g., Hinduism)                 |
| `motherTongue`           | string | No       | Mother tongue (e.g., Nepali)              |
| `casteEthnicity`         | string | No       | Caste/ethnicity (e.g., Brahmin)           |
| `casteEthnicityCode`     | string | No       | Government standard code                  |
| `citizenshipNumber`      | string | No       | Parent citizenship number                 |
| `birthCertificateNumber` | string | No       | Birth certificate number                  |

### Address Fields (Nepal-specific)

| Field                     | Type   | Description              |
| ------------------------- | ------ | ------------------------ |
| `permanentProvinceId`     | number | Province (1-7)           |
| `permanentDistrictId`     | number | District ID              |
| `permanentMunicipalityId` | number | Municipality ID          |
| `permanentWardNo`         | number | Ward number              |
| `permanentToleEn`         | string | Street/village (English) |
| `permanentToleNp`         | string | Street/village (Nepali)  |
| `temporaryProvinceId`     | number | Temporary province       |
| `temporaryDistrictId`     | number | Temporary district       |
| `temporaryMunicipalityId` | number | Temporary municipality   |
| `temporaryWardNo`         | number | Temporary ward           |
| `temporaryToleEn`         | string | Temporary address        |
| `temporaryAddressEn`      | string | Additional address       |

### Contact & Government

| Field                         | Type    | Validation   | Description               |
| ----------------------------- | ------- | ------------ | ------------------------- |
| `studentMobile`               | string  | 98/97xxxxxxx | Nepali mobile (10 digits) |
| `studentEmail`                | string  | email format | Student email             |
| `isGovtMandatedFreeSeat`      | boolean | -            | Free seat (10% quota)     |
| `isEconomicallyDisadvantaged` | boolean | -            | EWS category              |
| `hasDisability`               | boolean | -            | Disability status         |
| `disabilityType`              | string  | -            | Type of disability        |

### Status Enum

- `ACTIVE` - Currently studying
- `INACTIVE` - Not active
- `TRANSFERRED` - Transferred to another school
- `DROPPED` - Left education
- `GRADUATED` - Completed studies
- `SUSPENDED` - Temporarily suspended

## Query Parameters

| Parameter      | Type   | Description                        |
| -------------- | ------ | ---------------------------------- |
| `schoolId`     | number | **Required** - School ID           |
| `page`         | number | Page number (default: 1)           |
| `limit`        | number | Items per page (default: 20)       |
| `classId`      | number | Filter by class                    |
| `sectionId`    | number | Filter by section                  |
| `academicYear` | string | Filter by year (e.g., "2081-2082") |
| `gender`       | string | MALE/FEMALE/OTHER                  |
| `status`       | string | ACTIVE/INACTIVE/TRANSFERRED        |
| `search`       | string | Search by name/admission number    |
| `order`        | string | ASC or DESC                        |

## Example: Create Student

```json
{
  "schoolId": 1,
  "admissionNumber": "ADM-2024-0001",
  "firstNameEn": "Ram",
  "lastNameEn": "Sharma",
  "firstNameNp": "राम",
  "lastNameNp": "शर्मा",
  "dateOfBirthAd": "2015-01-15",
  "dateOfBirthBs": "2071-10-01",
  "gender": "MALE",
  "bloodGroup": "A_POSITIVE",
  "religion": "Hinduism",
  "motherTongue": "Nepali",
  "casteEthnicity": "Brahmin",
  "permanentProvinceId": 3,
  "permanentDistrictId": 27,
  "permanentMunicipalityId": 124,
  "permanentWardNo": 5,
  "permanentToleEn": "Baluwatar",
  "studentMobile": "9841234567",
  "studentEmail": "ram@example.com",
  "isGovtMandatedFreeSeat": false,
  "currentStatus": "ACTIVE"
}
```

## RBAC Permissions

| Role           | Permissions                                                  |
| -------------- | ------------------------------------------------------------ |
| ADMIN          | student:create, student:read, student:update, student:delete |
| TEACHER        | student:create, student:read                                 |
| STUDENT/PARENT | student:read (own)                                           |

---

# 3. TEACHER MANAGEMENT

## Overview

Teacher profiles, qualifications, subjects, and employment details.

## Base URL

```
POST /api/v1/teachers
GET  /api/v1/teachers
GET  /api/v1/teachers/:id
PATCH /api/v1/teachers/:id
DELETE /api/v1/teachers/:id
```

## Data Model

| Field            | Type   | Required | Description                         |
| ---------------- | ------ | -------- | ----------------------------------- |
| `schoolId`       | number | Yes      | School ID                           |
| `employeeId`     | string | Yes      | Unique employee ID                  |
| `firstNameEn`    | string | Yes      | First name (English)                |
| `lastNameEn`     | string | Yes      | Last name (English)                 |
| `firstNameNp`    | string | No       | First name (Nepali)                 |
| `lastNameNp`     | string | No       | Last name (Nepali)                  |
| `gender`         | enum   | Yes      | MALE, FEMALE, OTHER                 |
| `dateOfBirthAd`  | date   | No       | Date of birth                       |
| `dateOfBirthBs`  | string | No       | DOB in BS                           |
| `personalMobile` | string | Yes      | Mobile (98/97xxxxxxx)               |
| `email`          | string | No       | Email address                       |
| `designation`    | string | No       | Teacher, HOD, Principal             |
| `department`     | string | No       | Subject department                  |
| `qualification`  | string | No       | Education qualification             |
| `specialization` | string | No       | Subject specialization              |
| `joiningDate`    | date   | No       | Date of joining                     |
| `currentStatus`  | enum   | Yes      | ACTIVE, INACTIVE, RETIRED, RESIGNED |

## Example: Create Teacher

```json
{
  "schoolId": 1,
  "employeeId": "EMP-001",
  "firstNameEn": "Kishor",
  "lastNameEn": "Sharma",
  "firstNameNp": "किशोर",
  "lastNameNp": "शर्मा",
  "gender": "MALE",
  "personalMobile": "9841234567",
  "email": "kishor@school.edu.np",
  "designation": "Teacher",
  "department": "Science",
  "qualification": "M.Sc. Physics",
  "specialization": "Physics",
  "joiningDate": "2020-01-01",
  "currentStatus": "ACTIVE"
}
```

---

# 4. GUARDIAN MANAGEMENT

## Overview

Parent/guardian information and contact details.

## Base URL

```
POST /api/v1/guardians
GET  /api/v1/guardians
GET  /api/v1/guardians/:id
PATCH /api/v1/guardians/:id
DELETE /api/v1/guardians/:id
```

## Data Model

| Field               | Type   | Required | Description                     |
| ------------------- | ------ | -------- | ------------------------------- |
| `schoolId`          | number | Yes      | School ID                       |
| `firstNameEn`       | string | Yes      | First name                      |
| `lastNameEn`        | string | Yes      | Last name                       |
| `firstNameNp`       | string | No       | First name (Nepali)             |
| `lastNameNp`        | string | No       | Last name (Nepali)              |
| `gender`            | enum   | Yes      | MALE, FEMALE, OTHER             |
| `relation`          | enum   | Yes      | FATHER, MOTHER, GUARDIAN, OTHER |
| `mobile`            | string | Yes      | Mobile number                   |
| `alternateMobile`   | string | No       | Alternate mobile                |
| `email`             | string | No       | Email                           |
| `occupation`        | string | No       | Job/occupation                  |
| `officeAddress`     | string | No       | Office address                  |
| `officePhone`       | string | No       | Office phone                    |
| `annualIncome`      | number | No       | Annual income                   |
| `citizenshipNumber` | string | No       | Citizenship number              |

---

# 5. ATTENDANCE

## Overview

Daily student attendance tracking with SMS alerts.

## Base URL

```
POST /api/v1/attendance
GET  /api/v1/attendance
GET  /api/v1/attendance/summary
GET  /api/v1/attendance/monthly
GET  /api/v1/attendance/report
```

## Attendance Status

- `PRESENT` - Present
- `ABSENT` - Absent
- `LEAVE` - On leave
- `LATE` - Arrived late
- `HOLIDAY` - School holiday

## Query Parameters

| Parameter      | Type   | Required | Description                |
| -------------- | ------ | -------- | -------------------------- |
| `schoolId`     | number | Yes      | School ID                  |
| `academicYear` | string | Yes      | BS year (e.g., "2082")     |
| `classId`      | number | No       | Filter by class            |
| `sectionId`    | number | No       | Filter by section          |
| `date`         | string | No       | Specific date (YYYY-MM-DD) |
| `startDate`    | string | No       | Date range start           |
| `endDate`      | string | No       | Date range end             |

## Example: Mark Attendance

```json
{
  "schoolId": 1,
  "academicYear": "2082",
  "classId": 10,
  "sectionId": 1,
  "date": "2082-11-08",
  "attendances": [
    { "studentId": 1, "status": "PRESENT" },
    { "studentId": 2, "status": "ABSENT", "remarks": "Sick" },
    { "studentId": 3, "status": "LEAVE", "remarks": "Family function" }
  ]
}
```

---

# 6. EXAMS

## Overview

Exam creation, scheduling, and management.

## Base URL

```
POST /api/v1/exams
GET  /api/v1/exams
GET  /api/v1/exams/:id
PATCH /api/v1/exams/:id
DELETE /api/v1/exams/:id
```

## Exam Types

- `ANNUAL` - Annual exam
- `HALF_YEARLY` - Half-yearly
- `QUARTERLY` - Quarterly
- `MONTHLY` - Monthly
- `UNIT_TEST` - Unit test
- `MOCK` - Mock exam

## Data Model

| Field          | Type    | Required | Description               |
| -------------- | ------- | -------- | ------------------------- |
| `schoolId`     | number  | Yes      | School ID                 |
| `examName`     | string  | Yes      | Exam name                 |
| `examType`     | enum    | Yes      | ANNUAL, HALF_YEARLY, etc. |
| `academicYear` | string  | Yes      | BS year                   |
| `startDate`    | date    | Yes      | Exam start date           |
| `endDate`      | date    | Yes      | Exam end date             |
| `startDateBs`  | string  | No       | Start date (BS)           |
| `endDateBs`    | string  | No       | End date (BS)             |
| `isActive`     | boolean | No       | Exam active status        |
| `resultStatus` | string  | No       | DRAFT, PUBLISHED          |

## Example: Create Exam

```json
{
  "schoolId": 1,
  "examName": "First Terminal Exam 2082",
  "examType": "TERMINAL",
  "academicYear": "2082",
  "startDate": "2026-10-01",
  "endDate": "2026-10-15",
  "startDateBs": "2082-06-15",
  "endDateBs": "2082-06-29"
}
```

---

# 7. RESULTS & MARKS

## Overview

Marks entry with publishing workflow: DRAFT → SUBMITTED → VERIFIED → APPROVED → PUBLISHED → LOCKED

## Base URL

```
POST /api/v1/results
POST /api/v1/results/bulk
GET  /api/v1/results
GET  /api/v1/results/student/:studentId
GET  /api/v1/results/class
GET  /api/v1/results/student/:studentId/gpa
PATCH /api/v1/results/:id
POST /api/v1/results/:examId/submit
POST /api/v1/results/:examId/verify
POST /api/v1/results/:examId/approve
POST /api/v1/results/:examId/publish
POST /api/v1/results/:examId/lock
```

## Workflow States

| State     | Role      | Description                 |
| --------- | --------- | --------------------------- |
| DRAFT     | Teacher   | Marks being entered         |
| SUBMITTED | Teacher   | Submitted for verification  |
| VERIFIED  | Admin     | Admin verified marks        |
| APPROVED  | Principal | Principal approved          |
| PUBLISHED | Admin     | Visible to students/parents |
| LOCKED    | System    | Results locked (no changes) |

## Data Model

| Field            | Type    | Description                                        |
| ---------------- | ------- | -------------------------------------------------- |
| `schoolId`       | number  | School ID                                          |
| `examId`         | number  | Exam ID                                            |
| `studentId`      | number  | Student ID                                         |
| `subjectId`      | number  | Subject ID                                         |
| `marksObtained`  | number  | Marks obtained                                     |
| `fullMarks`      | number  | Total marks                                        |
| `theoryMarks`    | number  | Theory marks                                       |
| `practicalMarks` | number  | Practical marks                                    |
| `grade`          | string  | Letter grade (A, B+, B, etc.)                      |
| `gradePoint`     | number  | Grade point (4.0, 3.7, etc.)                       |
| `isAbsent`       | boolean | Was absent                                         |
| `status`         | string  | DRAFT/SUBMITTED/VERIFIED/APPROVED/PUBLISHED/LOCKED |

## Example: Enter Marks

```json
{
  "schoolId": 1,
  "examId": 1,
  "subjectId": 1,
  "marks": [
    { "studentId": 1, "marksObtained": 85, "fullMarks": 100 },
    { "studentId": 2, "marksObtained": 92, "fullMarks": 100 }
  ]
}
```

---

# 8. FEE MANAGEMENT

## Overview

Fee structures, invoices, payments, discounts.

## Base URL

```
POST /api/v1/fees/structures
GET  /api/v1/fees/structures
GET  /api/v1/fees/structures/:id
POST /api/v1/fees/invoices
GET  /api/v1/fees/invoices
GET  /api/v1/fees/invoices/:id
POST /api/v1/fees/payments
GET  /api/v1/fees/payments
```

## Fee Types

- `MONTHLY` - Monthly fee
- `ANNUAL` - Annual fee
- `ADMISSION` - Admission fee
- `EXAM` - Exam fee
- `TRANSPORT` - Bus fee
- `HOSTEL` - Hostel fee
- `LIBRARY` - Library fee
- `OTHER` - Other fees

## Payment Methods

- `CASH` - Cash payment
- `BANK_TRANSFER` - Bank transfer
- `ESEWA` - eSewa digital payment
- `KHALTI` - Khalti digital payment
- `CHEQUE` - Cheque payment

## Example: Create Fee Structure

```json
{
  "schoolId": 1,
  "classId": 10,
  "academicYear": "2082",
  "feeType": "MONTHLY",
  "amount": 1500,
  "dueDate": "2082-11-15",
  "description": "Monthly tuition fee"
}
```

## Example: Record Payment

```json
{
  "schoolId": 1,
  "invoiceId": 1,
  "studentId": 1,
  "amount": 1500,
  "paymentMethod": "ESEWA",
  "transactionId": "ES123456789",
  "paymentDate": "2026-02-19",
  "remarks": "February fee"
}
```

---

# 9. GRADE SCALES

## Overview

Custom grade definitions and GPA calculation.

## Base URL

```
POST /api/v1/grade-scales
GET  /api/v1/grade-scales
GET  /api/v1/grade-scales/:id
PATCH /api/v1/grade-scales/:id
DELETE /api/v1/grade-scales/:id
GET  /api/v1/grade-scales/:schoolId/calculate
```

## Example: Create Grade Scale

```json
{
  "schoolId": 1,
  "gradeName": "A+",
  "gradeLabel": "Outstanding",
  "minPercentage": 90,
  "maxPercentage": 100,
  "gradePoint": 4.0,
  "isActive": true
}
```

## Grade Example

| Grade | Label             | Min % | Max % | Point |
| ----- | ----------------- | ----- | ----- | ----- |
| A+    | Outstanding       | 90    | 100   | 4.0   |
| A     | Excellent         | 80    | 89    | 3.7   |
| B+    | Very Good         | 70    | 79    | 3.3   |
| B     | Good              | 60    | 69    | 3.0   |
| C+    | Satisfactory      | 50    | 59    | 2.7   |
| C     | Acceptable        | 40    | 49    | 2.3   |
| D     | Needs Improvement | 30    | 39    | 2.0   |
| E     | Below Standard    | 0     | 29    | 1.0   |

---

# 10. CERTIFICATES

## Overview

Generate TC, Bonafide, and Character certificates.

## Base URL

```
POST /api/v1/certificates/tc
POST /api/v1/certificates/bonafide
POST /api/v1/certificates/character
GET  /api/v1/certificates/student/:studentId
GET  /api/v1/certificates/:id
POST /api/v1/certificates/bonafide/:id/verify
POST /api/v1/certificates/character/:id/verify
GET  /api/v1/certificates/tc/list
```

## Example: Transfer Certificate (TC)

```json
{
  "schoolId": 1,
  "studentId": 1,
  "leavingDate": "2026-02-19",
  "leavingDateBs": "2082-11-08",
  "reasonForLeaving": "Transfer to another school",
  "characterGrade": "A",
  "attendancePercentage": 95.5,
  "lastClassId": 10,
  "lastSectionId": 1,
  "lastAcademicYear": "2081",
  "issuedTo": "PARENT",
  "issuedBy": 1
}
```

---

# 11. SMS

## Overview

Send SMS notifications to parents/students.

## Base URL

```
POST /api/v1/sms/send
GET  /api/v1/sms/templates
POST /api/v1/sms/templates
GET  /api/v1/sms/logs
```

## SMS Types

- `ATTENDANCE` - Absence alerts
- `FEE_DUE` - Fee reminders
- `FEE_PAID` - Payment confirmation
- `RESULT` - Result published
- `ADMISSION` - Admission updates
- `GENERAL` - General notifications

## Example: Send SMS

```json
{
  "schoolId": 1,
  "templateId": 1,
  "recipients": [{ "phone": "9841234567", "studentId": 1 }],
  "message": "Your ward {student_name} was absent on {date}. Please contact school.",
  "type": "ATTENDANCE"
}
```

---

# 12. ACADEMIC CALENDAR

## Overview

Holidays, events, and exam schedules.

## Base URL

```
POST /api/v1/academic-calendar
GET  /api/v1/academic-calendar
GET  /api/v1/academic-calendar/holidays
GET  /api/v1/academic-calendar/exams
GET  /api/v1/academic-calendar/events
GET  /api/v1/academic-calendar/upcoming
GET  /api/v1/academic-calendar/range
PATCH /api/v1/academic-calendar/:id
DELETE /api/v1/academic-calendar/:id
```

## Event Types

- `HOLIDAY` - School holiday
- `EXAM` - Exam schedule
- `EVENT` - School event
- `ACTIVITY` - Extra-curricular
- `MEETING` - Staff/parent meeting
- `OTHER` - Other

---

# 13. DOCUMENTS

## Overview

Student document upload and verification.

## Base URL

```
POST /api/v1/documents
GET  /api/v1/documents/student/:studentId
GET  /api/v1/documents/:id
POST /api/v1/documents/:id/verify
GET  /api/v1/documents/pending
```

## Document Types

- `SEE_CERTIFICATE` - SEE marksheet
- `CITIZENSHIP` - Parent citizenship
- `BIRTH_CERTIFICATE` - Birth certificate
- `PASSPORT` - Passport
- `PHOTO` - Student photo
- `ID_CARD` - ID card
- `TRANSFER_CERTIFICATE` - TC
- `OTHER` - Other

## Verification Status

- `PENDING` - Awaiting verification
- `VERIFIED` - Verified
- `REJECTED` - Rejected

---

# 14. EXPORT

## Overview

Export data in CSV/JSON format.

## Base URL

```
GET /export/students
GET /export/teachers
GET /export/attendance
GET /export/fees
GET /export/deo/:reportType
```

## Query Parameters

| Parameter      | Type   | Required | Description  |
| -------------- | ------ | -------- | ------------ |
| `schoolId`     | number | Yes      | School ID    |
| `academicYear` | string | No       | BS year      |
| `classId`      | number | No       | Class filter |
| `startDate`    | string | No       | Start date   |
| `endDate`      | string | No       | End date     |
| `format`       | string | No       | csv or json  |

---

# 15. SYNC (OFFLINE)

## Overview

Offline-first mobile app sync.

## Base URL

```
POST /api/v1/sync/push
GET  /api/v1/sync/pull
POST /api/v1/sync/acknowledge
GET  /api/v1/sync/status
POST /api/v1/sync/retry/:syncId
```

## Example: Push Changes

```json
{
  "schoolId": 1,
  "deviceId": "device_001",
  "changes": [
    {
      "entityType": "attendance",
      "entityId": 100,
      "operation": "CREATE",
      "data": { "studentId": 10, "status": "PRESENT" }
    }
  ],
  "lastSyncTimestamp": "2026-02-19T10:00:00Z"
}
```

---

# 16. WEBHOOKS

## Overview

Real-time event notifications.

## Base URL

```
POST /api/v1/webhooks
GET  /api/v1/webhooks
GET  /api/v1/webhooks/:id
PATCH /api/v1/webhooks/:id
DELETE /api/v1/webhooks/:id
GET  /api/v1/webhooks/:id/logs
POST /api/v1/webhooks/trigger
```

## Webhook Events

- `payment.success` - Payment successful
- `payment.failed` - Payment failed
- `student.admitted` - New admission
- `student.promoted` - Student promoted
- `result.published` - Results published
- `attendance.marked` - Attendance marked

---

# 17. AUDIT LOGS

## Overview

Track all system changes.

## Base URL

```
GET /api/v1/audit-logs
GET /api/v1/audit-logs/activity-summary
GET /api/v1/audit-logs/entity/:entityType/:entityId
GET /api/v1/audit-logs/user/:userId
GET /api/v1/audit-logs/:id
```

## Action Types

- `CREATE` - New record created
- `UPDATE` - Record modified
- `DELETE` - Record deleted
- `LOGIN` - User logged in
- `LOGOUT` - User logged out
- `VIEW` - Record viewed
- `EXPORT` - Data exported

---

# 18. PROMOTION

## Overview

Promote students to next class.

## Base URL

```
POST /api/v1/promotions/promote
POST /api/v1/promotions/demote
GET  /api/v1/promotions/eligible
GET  /api/v1/promotions/history
```

---

# 19. STUDENT GUARDIAN

## Overview

Link students to guardians.

## Base URL

```
POST /api/v1/student-guardian/link
POST /api/v1/student-guardian/unlink
GET  /api/v1/student-guardian/student/:studentId
GET  /api/v1/student-guardian/guardian/:guardianId
```

---

# 20. SCHOOL MANAGEMENT

## Overview

School settings and configuration.

## Base URL

```
GET /api/v1/schools/:id
PATCH /api/v1/schools/:id
GET /api/v1/schools/:id/branches
```

---

# 21. USER MANAGEMENT

## Overview

System user management.

## Base URL

```
GET /api/v1/users
POST /api/v1/users
GET /api/v1/users/:id
PATCH /api/v1/users/:id
DELETE /api/v1/users/:id
```

---

# 22. DASHBOARD

## Overview

Real-time analytics and statistics.

## Base URL

```
GET /api/v1/dashboard/overview
GET /api/v1/dashboard/enrollment
GET /api/v1/dashboard/attendance
GET /api/v1/dashboard/fees
GET /api/v1/dashboard/results
```

---

# 23. TIMETABLE

## Overview

Class schedules and period management.

## Base URL

```
POST /api/v1/timetable
GET  /api/v1/timetable
GET  /api/v1/timetable/class/:classId
GET  /api/v1/timetable/teacher/:teacherId
DELETE /api/v1/timetable/:id
```

---

# 24. SUBJECTS

## Overview

Subject management.

## Base URL

```
POST /api/v1/subjects
GET  /api/v1/subjects
GET  /api/v1/subjects/:id
PATCH /api/v1/subjects/:id
DELETE /api/v1/subjects/:id
```

---

# 25. SECTIONS

## Overview

Section (A, B, C) management.

## Base URL

```
POST /api/v1/sections
GET  /api/v1/sections
GET  /api/v1/sections/:id
PATCH /api/v1/sections/:id
DELETE /api/v1/sections/:id
```

---

# 26. ACADEMIC CLASS

## Overview

Class management (Grade 1-12).

## Base URL

```
POST /api/v1/academic-classes
GET  /api/v1/academic-classes
GET  /api/v1/academic-classes/:id
PATCH /api/v1/academic-classes/:id
DELETE /api/v1/academic-classes/:id
```

---

# 27. ENROLLMENT

## Overview

Student class enrollment.

## Base URL

```
POST /api/v1/enrollments
GET  /api/v1/enrollments
GET  /api/v1/enrollments/student/:studentId
DELETE /api/v1/enrollments/:id
```

---

# 28. HOSTEL

## Overview

Hostel management.

## Base URL

```
POST /api/v1/hostels
GET  /api/v1/hostels
GET  /api/v1/hostels/:id
POST /api/v1/hostels/:id/rooms
GET  /api/v1/hostels/:id/rooms
POST /api/v1/hostels/allocate
GET  /api/v1/hostels/allocated
```

---

# 29. TRANSPORT

## Overview

Bus routes and transport management.

## Base URL

```
POST /api/v1/transport/routes
GET  /api/v1/transport/routes
POST /api/v1/transport/stops
GET  /api/v1/transport/stops
POST /api/v1/transport/vehicles
GET  /api/v1/transport/vehicles
POST /api/v1/transport/assign
```

---

# 30. LIBRARY

## Overview

Library book management.

## Base URL

```
POST /api/v1/library/books
GET  /api/v1/library/books
GET  /api/v1/library/books/:id
POST /api/v1/library/issue
POST /api/v1/library/return
GET  /api/v1/library/issued
```

---

# 31. HR & PAYROLL

## Overview

Staff HR and payroll.

## Base URL

```
GET /api/v1/hr/staff
POST /api/v1/hr/leave
GET  /api/v1/hr/leave
POST /api/v1/hr/salary
GET  /api/v1/hr/salary
```

---

# 32. ASSIGNMENTS

## Overview

Homework and assignments.

## Base URL

```
POST /api/v1/assignments
GET  /api/v1/assignments
GET  /api/v1/assignments/:id
POST /api/v1/assignments/:id/submit
GET  /api/v1/assignments/:id/submissions
```

---

# 33. NOTIFICATIONS

## Overview

Push notifications.

## Base URL

```
POST /api/v1/notifications/send
GET  /api/v1/notifications
GET  /api/v1/notifications/:id/mark-read
```

---

# 34. VIDEO CLASS

## Overview

Live video classes.

## Base URL

```
POST /api/v1/video-class/live
GET  /api/v1/video-class/live
POST /api/v1/video-class/join
GET  /api/v1/video-class/recordings
```

---

# 35. PAYMENTS

## Overview

Payment gateway integration.

## Base URL

```
POST /api/v1/payment/esewa
POST /api/v1/payment/khalti
GET  /api/v1/payment/status/:orderId
POST /api/v1/payment/webhook
```

---

# 36. PORTAL

## Overview

Student/Parent self-service portal.

## Base URL

```
GET  /api/v1/portal/student/:studentId
GET  /api/v1/portal/attendance
GET  /api/v1/portal/results
GET  /api/v1/portal/fees
GET  /api/v1/portal/assignments
```

---

# 37. COMPLIANCE

## Overview

DEO government reports.

## Base URL

```
GET /api/v1/compliance/deo/enrollment
GET /api/v1/compliance/deo/staff
GET /api/v1/compliance/deo/infrastructure
GET /api/v1/compliance/annual
```

---

# 38. REPORT CARD

## Overview

Report card generation.

## Base URL

```
POST /api/v1/report-card/generate
GET  /api/v1/report-card/:studentId
GET  /api/v1/report-card/class/:classId
```

---

# 39. AI ASSISTANT

## Overview

AI-powered features.

## Base URL

```
POST /api/v1/ai/query
POST /api/v1/ai/summarize
GET  /api/v1/ai/insights
```

---

# QUICK REFERENCE

## Common Headers

```
Authorization: Bearer <token>
Content-Type: application/json
schoolId: 1
```

## Date Formats

- AD: YYYY-MM-DD (e.g., 2026-02-19)
- BS: YYYY-MM-DD (e.g., 2082-11-08)

## Phone Numbers

- Nepali: 10 digits, starts with 98 or 97 (e.g., 9841234567)

## HTTP Status Codes

| Code | Description      |
| ---- | ---------------- |
| 200  | Success          |
| 201  | Created          |
| 400  | Bad Request      |
| 401  | Unauthorized     |
| 403  | Forbidden        |
| 404  | Not Found        |
| 422  | Validation Error |
| 429  | Rate Limited     |
| 500  | Server Error     |

---

For detailed information, visit the Swagger UI: http://localhost:3001/docs

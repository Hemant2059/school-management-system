# Nepal School Management System - API Documentation

## Base URL

```
http://localhost:3001/api/v1
```

## Authentication

All protected endpoints require Bearer token in header:

```
Authorization: Bearer <token>
```

---

## 1. AUTHENTICATION

### POST /auth/register

Register a new user.

**Request:**

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

**Response (201):**

```json
{
  "message": "User registered successfully. Account is active.",
  "userId": "1"
}
```

> **Note:** After registration, user must change password to verify account.

````

### POST /auth/login

Login with username and password.

**Request:**

```json
{
  "username": "admin123",
  "password": "Password123!"
}
````

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "sessionId": "uuid",
  "user": {
    "id": "1",
    "schoolId": "1",
    "username": "admin123",
    "fullName": "Admin User",
    "userType": "ADMIN",
    "isVerified": false
  }
}
```

### POST /auth/change-password

Change password (required on first login to verify account).

**Request:**

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

**Response (200):**

```json
{
  "message": "Password changed successfully. Account verified."
}
```

> **First Login Flow:**
>
> 1. Register new user → `isVerified: false`
> 2. Login → Returns `isVerified: false` in response
> 3. Call `/auth/change-password` with current password → Sets `isVerified: true`
> 4. Login again → Returns `isVerified: true`

---

## 2. SCHOOLS

### GET /schools/:id

Get school details.

**Response (200):**

```json
{
  "school_id": "1",
  "school_name": "Model School",
  "school_name_nepali": "मोडेल स्कूल",
  "school_code": "SCH001",
  "moest_school_code": "12345",
  "school_type": "DAY",
  "province_id": 3,
  "district_id": 25,
  "municipality_id": 507,
  "ward_no": 1,
  "phone": "01-123456",
  "email": "school@example.edu.np"
}
```

---

## 3. CLASSES

### POST /classes

Create a new class.

**Request:**

```json
{
  "schoolId": 1,
  "className": "Class 1",
  "classCode": "C1",
  "classOrder": 1,
  "educationLevel": "PRIMARY",
  "minAge": 5,
  "maxAge": 7,
  "maxStudentsPerSection": 30
}
```

**Response (201):**

```json
{
  "class_id": "9",
  "school_id": "1",
  "class_name": "Class 1",
  "class_code": "C1",
  "class_order": 1,
  "education_level": "PRIMARY",
  "min_age": 5,
  "max_age": 7,
  "section_count": 0,
  "student_count": 0,
  "max_students_per_section": 30,
  "is_active": true
}
```

### GET /classes

Get all classes.

**Response (200):**

```json
[
  {
    "class_id": "1",
    "school_id": "1",
    "class_name": "Class 10",
    "class_code": "C10",
    "class_order": 10,
    "education_level": "SECONDARY"
  }
]
```

---

## 4. SECTIONS

### POST /sections

Create a new section.

**Request:**

```json
{
  "schoolId": 1,
  "classId": 9,
  "sectionName": "Section A",
  "sectionCode": "A",
  "sectionOrder": 1,
  "capacity": 30
}
```

**Response (201):**

```json
{
  "section_id": "5",
  "school_id": "1",
  "class_id": "9",
  "section_name": "Section A",
  "section_code": "A",
  "section_order": 1,
  "capacity": 30,
  "student_count": 0,
  "homeroom_teacher_id": null
}
```

---

## 5. SUBJECTS

### POST /subjects

Create a new subject.

**Request:**

```json
{
  "schoolId": 1,
  "subjectName": "Mathematics",
  "subjectNameNp": "गणित",
  "subjectCode": "MATH",
  "subjectType": "COMPULSORY",
  "subjectGroup": "SCIENCE",
  "creditHours": 4
}
```

**Response (201):**

```json
{
  "subject_id": "1",
  "school_id": "1",
  "subject_name": "Mathematics",
  "subject_name_nepali": "गणित",
  "subject_code": "MATH",
  "subject_type": "COMPULSORY",
  "subject_group": "SCIENCE",
  "credit_hours": 4,
  "is_active": true
}
```

---

## 6. TEACHERS

### POST /teachers

Create a new teacher.

**Request:**

```json
{
  "schoolId": 1,
  "employeeId": "EMP-001",
  "firstNameEn": "Ram",
  "middleNameEn": "Kumar",
  "lastNameEn": "Sharma",
  "firstNameNp": "राम",
  "lastNameNp": "शर्मा",
  "dateOfBirth": "1985-05-15",
  "gender": "MALE",
  "bloodGroup": "O+",
  "nationality": "Nepalese",
  "religion": "Hindu",
  "highestQualification": "Masters",
  "specialization": "Mathematics",
  "personalMobile": "9841000001",
  "officialEmail": "ram.sharma@school.edu.np",
  "permanentProvinceId": 3,
  "permanentDistrictId": 25,
  "permanentMunicipalityId": 507,
  "permanentWardNo": 5,
  "permanentToleEn": "Tole",
  "permanentToleNp": "टोल",
  "joiningDate": "2020-01-01",
  "employmentType": "PERMANENT",
  "department": "Academic",
  "designation": "Teacher"
}
```

**Response (201):**

```json
{
  "teacher_id": "10",
  "school_id": "1",
  "teacher_code": "TCH-26-00010",
  "employee_id": "EMP-001",
  "first_name_en": "Ram",
  "middle_name_en": "Kumar",
  "last_name_en": "Sharma",
  "first_name_np": "राम",
  "display_name": "Ram Sharma",
  "gender": "MALE",
  "personal_mobile": "9841000001",
  "joining_date": "2020-01-01",
  "employment_type": "PERMANENT",
  "designation": "Teacher",
  "current_status": "ACTIVE",
  "is_active": true
}
```

### GET /teachers

Get all teachers.

**Response (200):**

```json
[
  {
    "teacher_id": "1",
    "school_id": "1",
    "teacher_code": "TCH-26-00001",
    "first_name_en": "John",
    "last_name_en": "Doe",
    "designation": "Teacher",
    "is_active": true
  }
]
```

---

## 7. STUDENTS

### POST /students

Create a new student.

**Request:**

```json
{
  "schoolId": 1,
  "admissionNumber": "ADM-2024-001",
  "firstNameEn": "Shyam",
  "middleNameEn": "Kumar",
  "lastNameEn": "Thapa",
  "firstNameNp": "श्याम",
  "lastNameNp": "थापा",
  "dateOfBirthAd": "2012-04-15",
  "dateOfBirthBs": "2068-12-25",
  "gender": "MALE",
  "bloodGroup": "A+",
  "religion": "Hindu",
  "motherTongue": "Nepali",
  "casteEthnicity": "Brahmin",
  "casteEthnicityCode": "BR",
  "citizenshipNumber": "9876543210123",
  "birthCertificateNumber": "BC-001",
  "isGovtMandatedFreeSeat": false,
  "isEconomicallyDisadvantaged": false,
  "hasDisability": false,
  "permanentProvinceId": 3,
  "permanentDistrictId": 25,
  "permanentMunicipalityId": 507,
  "permanentWardNo": 3,
  "permanentToleEn": "Tole",
  "permanentToleNp": "टोल",
  "studentMobile": "9841000002",
  "studentEmail": "shyam@email.com",
  "admissionDate": "2024-01-01",
  "admissionClassId": 1
}
```

**Response (201):**

```json
{
  "student_id": "10",
  "school_id": "1",
  "student_code": "STU-2026-001-0010",
  "admission_number": "ADM-2024-001",
  "first_name_en": "Shyam",
  "middle_name_en": "Kumar",
  "last_name_en": "Thapa",
  "first_name_np": "श्याम",
  "display_name": "श्याम थापा",
  "gender": "MALE",
  "date_of_birth_ad": "2012-04-14T18:15:00.000Z",
  "date_of_birth_bs": "2068-12-25",
  "caste_ethnicity": "Brahmin",
  "caste_ethnicity_code": "BR",
  "is_govt_mandated_free_seat": false,
  "current_status": "ACTIVE",
  "is_active": true
}
```

### GET /students?schoolId=1

Get all students (paginated).

**Response (200):**

```json
{
  "data": [
    {
      "student_id": "1",
      "admission_number": "ADM-001",
      "first_name_en": "Ram",
      "last_name_en": "Sharma",
      "gender": "MALE",
      "class_id": 1,
      "section_id": 1,
      "academic_year": "2082"
    }
  ],
  "meta": {
    "page": 1,
    "take": 10,
    "itemCount": 5,
    "pageCount": 1
  }
}
```

---

## 8. GUARDIANS

### POST /guardians

Create a new guardian.

**Request:**

```json
{
  "schoolId": 1,
  "firstNameEn": "Hari",
  "middleNameEn": "Prasad",
  "lastNameEn": "Sharma",
  "firstNameNp": "हरि",
  "lastNameNp": "शर्मा",
  "relationToStudent": "FATHER",
  "occupation": "Business",
  "organization": "ABC Trading",
  "designation": "Owner",
  "educationLevel": "Bachelor",
  "annualIncome": 500000,
  "mobile": "9841000003",
  "alternateMobile": "9851000003",
  "email": "hari@email.com",
  "whatsappNumber": "9841000003",
  "provinceId": 3,
  "districtId": 25,
  "municipalityId": 507,
  "wardNo": 3,
  "toleEn": "Main Tole",
  "toleNp": "मुख्य टोल"
}
```

**Response (201):**

```json
{
  "guardian_id": "4",
  "school_id": "1",
  "guardian_code": "GRD-26-00004",
  "first_name_en": "Hari",
  "last_name_en": "Sharma",
  "relation_to_student": "FATHER",
  "occupation": "Business",
  "mobile": "9841000003",
  "email": "hari@email.com"
}
```

---

## 9. ENROLLMENTS

### POST /enrollments

Enroll a student in a class.

**Request:**

```json
{
  "schoolId": 1,
  "studentId": 10,
  "classId": 1,
  "sectionId": 1,
  "academicYear": "2082",
  "enrollmentDate": "2024-01-01",
  "rollNumber": "1"
}
```

**Response (201):**

```json
{
  "enrollment_id": "5",
  "school_id": "1",
  "student_id": "10",
  "class_id": "1",
  "section_id": "1",
  "academic_year": "2082",
  "enrollment_date": "2024-01-01",
  "roll_number": "1",
  "status": "ACTIVE",
  "is_current": true
}
```

---

## 10. ATTENDANCE

### POST /attendance

Mark student attendance.

**Request:**

```json
{
  "schoolId": 1,
  "studentId": 10,
  "classId": 1,
  "sectionId": 1,
  "attendanceDate": "2026-02-18",
  "attendanceDateBs": "2082-11-06",
  "status": "PRESENT",
  "academicYear": "2082",
  "session": "FULL_DAY",
  "remarks": "On time"
}
```

**Response (201):**

```json
{
  "attendance_id": "10",
  "school_id": "1",
  "student_id": "10",
  "class_id": "1",
  "attendance_date": "2026-02-18",
  "attendance_date_bs": "2082-11-06",
  "status": "PRESENT",
  "academic_year": "2082"
}
```

### POST /attendance/bulk

Mark multiple student attendances.

**Request:**

```json
{
  "schoolId": 1,
  "classId": 1,
  "sectionId": 1,
  "attendanceDate": "2026-02-18",
  "academicYear": "2082",
  "records": [
    { "studentId": 1, "status": "PRESENT" },
    { "studentId": 2, "status": "ABSENT" },
    { "studentId": 3, "status": "LEAVE" }
  ]
}
```

---

## 11. EXAMS

### POST /exams

Create a new exam.

**Request:**

```json
{
  "schoolId": 1,
  "examName": "First Terminal Exam",
  "examCode": "TERM1",
  "examType": "TERMINAL",
  "classId": 1,
  "subjectId": 1,
  "examDate": "2026-03-01",
  "examDateBs": "2082-11-15",
  "startTime": "09:00",
  "endTime": "12:00",
  "fullMarks": 100,
  "passMarks": 35,
  "isPublished": true,
  "academicYear": "2082"
}
```

**Response (201):**

```json
{
  "exam_id": "1",
  "school_id": "1",
  "exam_name": "First Terminal Exam",
  "exam_code": "TERM1",
  "exam_type": "TERMINAL",
  "class_id": "1",
  "subject_id": "1",
  "exam_date": "2026-03-01",
  "full_marks": 100,
  "pass_marks": 35,
  "is_published": true,
  "academic_year": "2082"
}
```

---

## 12. FEE MANAGEMENT

### POST /fee/categories

Create fee category.

**Request:**

```json
{
  "schoolId": 1,
  "categoryName": "Tuition Fee",
  "categoryType": "TUITION",
  "description": "Monthly tuition charges"
}
```

### POST /fee/structures

Create fee structure.

**Request:**

```json
{
  "schoolId": 1,
  "classId": 1,
  "academicYear": "2082",
  "feeType": "TUITION",
  "categoryId": 1,
  "amount": 5000,
  "isRecurring": true,
  "dueDate": "2082-01-15"
}
```

### POST /fee/payments

Record fee payment.

**Request:**

```json
{
  "schoolId": 1,
  "studentId": 1,
  "feeStructureId": 1,
  "amount": 5000,
  "paymentMethod": "CASH",
  "transactionDate": "2026-01-15",
  "referenceNumber": "RCP-001"
}
```

---

## 13. LIBRARY

### POST /library/books

Add a new book.

**Request:**

```json
{
  "schoolId": 1,
  "isbn": "978-3-16-148410-0",
  "bookCode": "B001",
  "title": "Mathematics Grade 10",
  "titleNp": "गणित कक्षा १०",
  "author": "Editorial",
  "authorNp": "सम्पादक",
  "publisher": "National Publisher",
  "publisherNp": "राष्ट्रीय प्रकाशक",
  "category": "ACADEMIC",
  "totalCopies": 10,
  "availableCopies": 10,
  "price": 350,
  "currency": "NPR",
  "rackNumber": "A-1-1"
}
```

### POST /library/issues

Issue book to student.

**Request:**

```json
{
  "schoolId": 1,
  "bookId": 1,
  "studentId": 1,
  "issueDate": "2026-02-18",
  "dueDate": "2026-03-18"
}
```

### POST /library/issues/return

Return book.

**Request:**

```json
{
  "schoolId": 1,
  "issueId": 1,
  "returnDate": "2026-03-15"
}
```

---

## 14. TRANSPORT

### POST /transport/vehicles

Add vehicle.

**Request:**

```json
{
  "schoolId": 1,
  "vehicleNumber": "Ba 1 Ja 1234",
  "vehicleName": "School Bus 1",
  "vehicleType": "BUS",
  "capacity": 50,
  "driverName": "Ram Singh",
  "driverLicense": "DL-12345",
  "driverMobile": "9841000004",
  "insuranceExpiry": "2027-12-31",
  "permitExpiry": "2027-12-31"
}
```

### POST /transport/routes

Create transport route.

**Request:**

```json
{
  "schoolId": 1,
  "routeName": "Route 1 - Koteshwor",
  "routeCode": "R1",
  "startPoint": "School",
  "endPoint": "Koteshwor",
  "distance": 5.5,
  "fare": 500
}
```

---

## 15. TIMETABLES

### POST /timetables

Create timetable entry.

**Request:**

```json
{
  "schoolId": 1,
  "classId": 1,
  "sectionId": 1,
  "subjectId": 1,
  "teacherId": 1,
  "dayOfWeek": "MONDAY",
  "startTime": "08:00",
  "endTime": "09:00",
  "roomNumber": "Room 101",
  "academicYear": "2082"
}
```

---

## 16. ASSIGNMENTS

### POST /assignments

Create assignment.

**Request:**

```json
{
  "schoolId": 1,
  "classId": 1,
  "sectionId": 1,
  "subjectId": 1,
  "title": "Chapter 1 Review",
  "description": "Complete all exercises from chapter 1",
  "dueDate": "2026-02-25",
  "totalMarks": 20,
  "academicYear": "2082"
}
```

---

## 17. NOTIFICATIONS

### POST /notifications

Send notification.

**Request:**

```json
{
  "schoolId": 1,
  "userId": 1,
  "title": "Exam Notice",
  "message": "Terminal exam starts from March 1",
  "type": "GENERAL"
}
```

---

## 18. HR / STAFF

### POST /hr/staff

Add staff member.

**Request:**

```json
{
  "schoolId": 1,
  "staffCode": "STF001",
  "firstName": "Kamal",
  "lastName": "Shrestha",
  "email": "kamal@school.edu.np",
  "mobile": "9841000005",
  "department": "Administration",
  "designation": "Accountant",
  "employmentType": "PERMANENT",
  "joiningDate": "2020-06-01"
}
```

### POST /hr/payroll/process

Process payroll.

**Request:**

```json
{
  "schoolId": 1,
  "staffId": 1,
  "month": 1,
  "year": 2082,
  "basicSalary": 30000,
  "allowances": 5000,
  "deductions": 2000
}
```

### POST /hr/leaves

Submit leave request.

**Request:**

```json
{
  "schoolId": 1,
  "staffId": 1,
  "leaveType": "ANNUAL",
  "startDate": "2026-03-01",
  "endDate": "2026-03-05",
  "reason": "Family function"
}
```

---

## 19. DASHBOARD

### GET /dashboard/admin

Get admin dashboard.

**Response (200):**

```json
{
  "totalStudents": 150,
  "totalTeachers": 25,
  "totalStaff": 10,
  "totalClasses": 10,
  "totalSections": 20,
  "totalSubjects": 45,
  "todayAttendance": {
    "present": 140,
    "absent": 8,
    "leave": 2,
    "percentage": 93.33
  },
  "recentEnrollments": 5,
  "feeCollection": {
    "collected": 500000,
    "pending": 100000
  }
}
```

### GET /dashboard/student

Get student dashboard.

**Response (200):**

```json
{
  "studentId": 1,
  "className": "Class 10",
  "sectionName": "A",
  "attendance": {
    "present": 45,
    "total": 50,
    "percentage": 90
  },
  "upcomingExams": [],
  "pendingAssignments": 2,
  "latestMarks": []
}
```

### GET /dashboard/teacher

Get teacher dashboard.

**Response (200):**

```json
{
  "teacherId": 1,
  "assignedClasses": 3,
  "totalStudents": 120,
  "pendingAssignments": 2,
  "todayClasses": 4
}
```

---

## 20. COMPLIANCE REPORTS (DEO/MOEST)

### GET /compliance/deo-report

Get DEO enrollment report (MOEST v3.2).

**Response (200):**

```json
{
  "reportType": "DEO_ENROLLMENT_V3_2",
  "generatedAt": "2026-02-18T12:00:00.000Z",
  "school": {
    "schoolId": "1",
    "schoolCode": "SCH001",
    "schoolName": "Model School",
    "schoolNameNepali": "मोडेल स्कूल"
  },
  "academicYear": "2082-2083",
  "data": [
    {
      "studentId": "1",
      "admissionNumber": "ADM-001",
      "rollNumber": "1",
      "name": "Ram Sharma",
      "nameNp": "राम शर्मा",
      "casteCode": "BR",
      "gender": "MALE",
      "isGovtSeat": false,
      "dobBs": "2071-10-01",
      "className": "Class 10",
      "sectionName": "A"
    }
  ],
  "generatedAtBs": "2082-11-06"
}
```

### GET /compliance/free-seat-report

Get government free seat quota report.

**Response (200):**

```json
{
  "reportType": "GOVT_FREE_SEAT_QUOTA",
  "schoolId": "1",
  "schoolCode": "SCH001",
  "schoolName": "Model School",
  "generatedAt": "2026-02-18T12:00:00.000Z",
  "totalActiveStudents": 150,
  "govtFreeSeatCount": 12,
  "percentage": 8,
  "quotaPercent": 10,
  "isCompliant": true,
  "maxAllowedFreeSeats": 15,
  "slotsRemainingForFreeSeat": 3,
  "generatedAtBs": "2082-11-06"
}
```

### GET /compliance/annual-statistics

Get annual statistics for DEO/MOEST.

**Response (200):**

```json
{
  "reportType": "ANNUAL_STATISTICS_DEO",
  "schoolId": "1",
  "schoolCode": "SCH001",
  "schoolName": "Model School",
  "generatedAt": "2026-02-18T12:00:00.000Z",
  "academicYear": "2082-2083",
  "totalStudents": 150,
  "byGender": {
    "male": 80,
    "female": 70,
    "other": 0
  },
  "govtFreeSeatCount": 12,
  "freeSeatPercentage": 8,
  "byClass": {
    "1": 20,
    "2": 25,
    "10": 15
  },
  "complianceNote": "For DEO/MOEST annual submission (Nepal)",
  "generatedAtBs": "2082-11-06"
}
```

---

## ENUM VALUES

### Gender

- MALE
- FEMALE
- OTHER

### UserType

- ADMIN
- TEACHER
- STUDENT
- GUARDIAN
- ACCOUNTANT
- LIBRARIAN
- PRINCIPAL

### EducationLevel

- PRIMARY (1-5)
- LOWER_SECONDARY (6-8)
- SECONDARY (9-10)
- HIGHER_SECONDARY (11-12)

### EmploymentType

- PERMANENT
- CONTRACTUAL
- PART_TIME

### RelationToStudent

- FATHER
- MOTHER
- GUARDIAN
- OTHER

### AttendanceStatus

- PRESENT
- ABSENT
- LEAVE

### ExamType

- UNIT_TEST
- TERMINAL
- FINAL
- SEE
- NEB
- BOARD

### PaymentMethod

- CASH
- BANK
- CHEQUE
- ESEWA
- KHALTI
- FONEPAY
- CONNECTIPS
- IMEPAY

### LeaveType

- ANNUAL
- SICK
- CASUAL
- MATERNITY
- PATERNITY
- UNPAID

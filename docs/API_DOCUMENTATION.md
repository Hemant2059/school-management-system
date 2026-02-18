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

**Required Fields:**

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

**All Fields (Optional & Required):**

```json
{
  "username": "admin123", // Required - Unique username
  "password": "Password123!", // Required - Min 8 chars
  "fullName": "Admin User", // Required
  "email": "admin@school.edu.np", // Required
  "phone": "9841000001", // Required - Unique phone
  "userType": "ADMIN", // Required - ADMIN|TEACHER|STUDENT|GUARDIAN|ACCOUNTANT|LIBRARIAN|PRINCIPAL
  "schoolId": 1 // Required - School ID
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

---

### POST /auth/login

Login with username/email/phone and password.

**Required Fields:**

```json
{
  "username": "admin123",
  "password": "Password123!"
}
```

**All Fields:**

```json
{
  "username": "admin123", // Required - Can be username, email, or phone
  "password": "Password123!" // Required
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
    "username": "admin123",
    "fullName": "Admin User",
    "userType": "ADMIN",
    "email": "admin@school.edu.np",
    "phone": "9841000001",
    "isVerified": false
  }
}
```

---

### POST /auth/change-password

Change password (required on first login to verify account).

**Required Fields:**

```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewPassword456!"
}
```

**All Fields:**

```json
{
  "currentPassword": "Password123!", // Required - Current password
  "newPassword": "NewPassword456!" // Required - New password (min 8 chars)
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

### POST /auth/forgot-password

Request password reset link.

**Required Fields:**

```json
{
  "email": "user@example.com"
}
```

**All Fields:**

```json
{
  "email": "user@example.com" // Required - User's registered email/username/phone
}
```

**Response (200):**

```json
{
  "message": "If the email exists, a reset link will be sent.",
  "resetToken": "abc123...", // In production, sent via email/SMS
  "expiry": "2026-02-18T14:00:00.000Z"
}
```

---

### POST /auth/reset-password

Reset password using token.

**Required Fields:**

```json
{
  "token": "abc123...",
  "newPassword": "NewPassword456!"
}
```

**All Fields:**

```json
{
  "token": "abc123...", // Required - Reset token from forgot-password
  "newPassword": "NewPassword456!" // Required - New password (min 8 chars)
}
```

**Response (200):**

```json
{
  "message": "Password reset successfully. You can now login."
}
```

---

### GET /auth/profile

Get authenticated user profile.

**Response (200):**

```json
{
  "userId": 1,
  "schoolId": 1,
  "username": "admin123",
  "email": "admin@school.edu.np",
  "phone": "9841000001",
  "fullName": "Admin User",
  "userType": "ADMIN",
  "isVerified": true,
  "isActive": true,
  "lastLoginAt": "2026-02-18T10:00:00.000Z",
  "lastLoginIp": "192.168.1.1",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "updatedAt": "2026-02-18T10:00:00.000Z",
  "school": null
}
```

---

### POST /auth/logout

Logout from current device.

**Required Fields:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**

```json
{
  "message": "Successfully logged out from this device"
}
```

---

### POST /auth/logout-all

Logout from all devices.

**Response (200):**

```json
{
  "message": "Successfully logged out from all devices"
}
```

---

### POST /auth/refresh

Refresh access token.

**Required Fields:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200):**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "sessionId": "new-uuid"
}
```

---

## 2. SCHOOLS

### POST /schools

Create a new school.

**Required Fields:**

```json
{
  "schoolName": "Model School",
  "schoolCode": "SCH001"
}
```

**All Fields:**

```json
{
  "schoolName": "Model School", // Required
  "schoolNameNp": "मोडेल स्कूल", // Optional - Nepali name
  "schoolCode": "SCH001", // Required - Unique code
  "schoolType": "DAY", // Optional - DAY|SEMI_BOARDING|FULL_BOARDING
  "ownershipType": "PRIVATE", // Optional - PRIVATE|GOVT
  "establishedDate": "2000-01-01", // Optional
  "establishedDateBs": "2056-09-17", // Optional - Nepali date
  "registrationNumber": "REG-001", // Optional
  "affiliationNumber": "AFF-001", // Optional
  "moestSchoolCode": "12345", // Optional - MOEST code for DEO
  "provinceId": 3, // Optional - Nepal province (1-7)
  "districtId": 25, // Optional
  "municipalityId": 507, // Optional
  "wardNo": 1, // Optional
  "tole": "Tole Name", // Optional
  "toleNp": "टोल नाम", // Optional
  "streetAddress": "Street Name", // Optional
  "streetAddressNp": "सडकको नाम", // Optional
  "phone": "01-123456", // Optional
  "mobile": "9841000001", // Optional
  "email": "school@example.edu.np", // Optional
  "website": "www.school.edu.np", // Optional
  "academicYearStartMonth": 4, // Optional - Month when academic year starts (4=Baisakh)
  "currencyCode": "NPR", // Optional - Currency code
  "timezone": "Asia/Kathmandu" // Optional
}
```

---

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
  "ownership_type": "PRIVATE",
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

**Required Fields:**

```json
{
  "schoolId": 1,
  "className": "Class 1",
  "classCode": "C1",
  "educationLevel": "PRIMARY"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "className": "Class 1", // Required
  "classCode": "C1", // Required - Unique within school
  "classOrder": 1, // Optional - Display order
  "educationLevel": "PRIMARY", // Required - PRIMARY|LOWER_SECONDARY|SECONDARY|HIGHER_SECONDARY
  "minAge": 5, // Optional - Minimum student age
  "maxAge": 7, // Optional - Maximum student age
  "maxStudentsPerSection": 30 // Optional - Max students per section
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

---

### GET /classes

Get all classes for a school.

**Query Parameters:**

```
?schoolId=1
```

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

**Required Fields:**

```json
{
  "schoolId": 1,
  "classId": 1,
  "sectionName": "Section A"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "classId": 1, // Required
  "sectionName": "Section A", // Required
  "sectionCode": "A", // Optional - Unique within class
  "sectionOrder": 1, // Optional
  "capacity": 30, // Optional - Max students
  "homeroomTeacherId": 1 // Optional - Teacher ID
}
```

**Response (201):**

```json
{
  "section_id": "5",
  "school_id": "1",
  "class_id": "1",
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

**Required Fields:**

```json
{
  "schoolId": 1,
  "subjectName": "Mathematics",
  "subjectCode": "MATH"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "subjectName": "Mathematics", // Required
  "subjectNameNp": "गणित", // Optional - Nepali name
  "subjectCode": "MATH", // Required - Unique within school
  "subjectType": "COMPULSORY", // Optional - COMPULSORY|OPTIONAL|ELECTIVE
  "subjectGroup": "SCIENCE", // Optional - SCIENCE|ARTS|COMMERCE|ETC
  "creditHours": 4, // Optional
  "isTheory": true, // Optional
  "isPractical": false, // Optional
  "theoryFullMarks": 100, // Optional
  "theoryPassMarks": 40, // Optional
  "practicalFullMarks": 0, // Optional
  "practicalPassMarks": 0 // Optional
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

**Required Fields:**

```json
{
  "schoolId": 1,
  "employeeId": "EMP-001",
  "firstNameEn": "Ram",
  "lastNameEn": "Sharma",
  "dateOfBirth": "1985-05-15",
  "gender": "MALE",
  "personalMobile": "9841000001",
  "joiningDate": "2020-01-01",
  "employmentType": "PERMANENT"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "employeeId": "EMP-001", // Required - Unique employee ID

  // English Names
  "firstNameEn": "Ram", // Required
  "middleNameEn": "Kumar", // Optional
  "lastNameEn": "Sharma", // Required

  // Nepali Names
  "firstNameNp": "राम", // Optional
  "middleNameNp": "कुमार", // Optional
  "lastNameNp": "शर्मा", // Optional

  // Personal Info
  "dateOfBirth": "1985-05-15", // Required
  "gender": "MALE", // Required - MALE|FEMALE|OTHER
  "bloodGroup": "O+", // Optional - A+|A-|B+|B-|O+|O-|AB+|AB-
  "nationality": "Nepalese", // Optional
  "religion": "Hindu", // Optional

  // Education
  "highestQualification": "Masters", // Optional - SEE|LC|HA|SLC|+2|BACHELORS|MASTERS|PHD
  "specialization": "Mathematics", // Optional
  "universityBoard": "TU", // Optional - TU|PU|KU|BOKU|OTHER
  "passingYear": 2010, // Optional

  // License
  "teachingLicenseNumber": "LIC-12345", // Optional
  "licenseExpiryDate": "2030-12-31", // Optional

  // Contact
  "personalMobile": "9841000001", // Required
  "officialMobile": "01-4123456", // Optional
  "personalEmail": "ram@email.com", // Optional
  "officialEmail": "ram@school.edu.np", // Optional

  // Permanent Address (Nepal - IDs)
  "permanentProvinceId": 3, // Optional - Province (1-7)
  "permanentDistrictId": 25, // Optional
  "permanentMunicipalityId": 507, // Optional
  "permanentWardNo": 5, // Optional
  "permanentToleEn": "Tole Name", // Optional
  "permanentToleNp": "टोल नाम", // Optional

  // Employment
  "joiningDate": "2020-01-01", // Required
  "employmentType": "PERMANENT", // Required - PERMANENT|CONTRACTUAL|PART_TIME
  "department": "Academic", // Optional
  "designation": "Teacher", // Optional
  "currentStatus": "ACTIVE" // Optional - ACTIVE|ON_LEAVE|SUSPENDED|RESIGNED
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

---

### GET /teachers

Get all teachers for a school.

**Query Parameters:**

```
?schoolId=1
```

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

**Required Fields:**

```json
{
  "schoolId": 1,
  "admissionNumber": "ADM-2024-001",
  "firstNameEn": "Shyam",
  "lastNameEn": "Thapa",
  "dateOfBirthAd": "2012-04-15",
  "gender": "MALE"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required

  // Identification
  "admissionNumber": "ADM-2024-001", // Required - Unique admission number
  "studentCode": "STU-001", // Optional - Auto-generated if not provided
  "rollNumber": "10A-01", // Optional
  "registrationNumber": "REG-001", // Optional

  // English Names
  "firstNameEn": "Shyam", // Required
  "middleNameEn": "Kumar", // Optional
  "lastNameEn": "Thapa", // Required

  // Nepali Names
  "firstNameNp": "श्याम", // Optional
  "middleNameNp": "कुमार", // Optional
  "lastNameNp": "थापा", // Optional

  // Personal Info
  "dateOfBirthAd": "2012-04-15", // Required - AD Date
  "dateOfBirthBs": "2068-12-25", // Optional - BS Date (auto-calculated if not provided)
  "gender": "MALE", // Required - MALE|FEMALE|OTHER
  "bloodGroup": "A+", // Optional
  "religion": "Hindu", // Optional
  "motherTongue": "Nepali", // Optional

  // Caste/Ethnicity (MOEST codes for DEO)
  "casteEthnicity": "Brahmin", // Optional
  "casteEthnicityCode": "BR", // Optional - MOEST caste code

  // Government IDs
  "citizenshipNumber": "9876543210123", // Optional
  "birthCertificateNumber": "BC-001", // Optional

  // Government Quota
  "isGovtMandatedFreeSeat": false, // Optional - 10% free seat quota
  "isEconomicallyDisadvantaged": false, // Optional
  "hasDisability": false, // Optional
  "disabilityType": null, // Optional - Physical|Visual|Hearing|Speech|Other

  // Permanent Address (Nepal - IDs)
  "permanentProvinceId": 3, // Optional - Province (1-7)
  "permanentDistrictId": 25, // Optional
  "permanentMunicipalityId": 507, // Optional
  "permanentWardNo": 3, // Optional
  "permanentToleEn": "Tole Name", // Optional
  "permanentToleNp": "टोल नाम", // Optional

  // Temporary Address (Nepal - IDs)
  "temporaryProvinceId": 3, // Optional
  "temporaryDistrictId": 25, // Optional
  "temporaryMunicipalityId": 507, // Optional
  "temporaryWardNo": 3, // Optional
  "temporaryToleEn": "Temp Tole", // Optional
  "temporaryToleNp": "अस्थायी टोल", // Optional

  // Contact
  "studentMobile": "9841000002", // Optional
  "studentEmail": "shyam@email.com", // Optional

  // Admission
  "admissionDate": "2024-01-01", // Optional
  "admissionClassId": 1, // Optional

  // Previous School (for transfer)
  "previousSchoolName": null, // Optional
  "previousSchoolAddress": null, // Optional
  "transferCertificateNumber": null, // Optional
  "tcIssueDate": null // Optional
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

---

### GET /students

Get all students (paginated).

**Query Parameters:**

```
?schoolId=1&page=1&take=10&search=Ram&gender=MALE
```

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

**Required Fields:**

```json
{
  "schoolId": 1,
  "firstNameEn": "Hari",
  "lastNameEn": "Sharma",
  "relationToStudent": "FATHER",
  "mobile": "9841000003"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required

  // English Names
  "firstNameEn": "Hari", // Required
  "middleNameEn": "Prasad", // Optional
  "lastNameEn": "Sharma", // Required

  // Nepali Names
  "firstNameNp": "हरि", // Optional
  "middleNameNp": "प्रसाद", // Optional
  "lastNameNp": "शर्मा", // Optional

  // Relation
  "relationToStudent": "FATHER", // Required - FATHER|MOTHER|GUARDIAN|OTHER

  // Professional Info
  "occupation": "Business", // Optional
  "organization": "ABC Trading", // Optional
  "designation": "Owner", // Optional
  "educationLevel": "Bachelor", // Optional - SEE|LC|HA|SLC|+2|BACHELORS|MASTERS|PHD
  "annualIncome": 500000, // Optional

  // Contact
  "mobile": "9841000003", // Required
  "alternateMobile": "9851000003", // Optional
  "email": "hari@email.com", // Optional
  "whatsappNumber": "9841000003", // Optional

  // Address (Nepal - IDs)
  "provinceId": 3, // Optional
  "districtId": 25, // Optional
  "municipalityId": 507, // Optional
  "wardNo": 3, // Optional
  "toleEn": "Main Tole", // Optional
  "toleNp": "मुख्य टोल" // Optional
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

**Required Fields:**

```json
{
  "schoolId": 1,
  "studentId": 10,
  "classId": 1,
  "academicYear": "2082"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "studentId": 10, // Required
  "classId": 1, // Required
  "sectionId": 1, // Optional
  "academicYear": "2082", // Required - BS year
  "enrollmentDate": "2024-01-01", // Optional - Default: today
  "enrollmentDateBs": "2080-09-17", // Optional - Auto-calculated
  "rollNumber": "1", // Optional
  "status": "ACTIVE", // Optional - ACTIVE|PROMOTED|TRANSFERRED|DROPPED
  "isCurrent": true, // Optional - Default: true
  "boardExamRegistration": null, // Optional - For SEE/NEB
  "previousAcademicYear": null, // Optional
  "previousClassId": null, // Optional
  "remarks": null // Optional
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

**Required Fields:**

```json
{
  "schoolId": 1,
  "studentId": 10,
  "classId": 1,
  "attendanceDate": "2026-02-18",
  "status": "PRESENT"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "studentId": 10, // Required
  "classId": 1, // Required
  "sectionId": 1, // Optional
  "attendanceDate": "2026-02-18", // Required - AD Date
  "attendanceDateBs": "2082-11-06", // Optional - BS Date (auto-calculated)
  "status": "PRESENT", // Required - PRESENT|ABSENT|LEAVE
  "academicYear": "2082", // Optional - BS year
  "session": "FULL_DAY", // Optional - FULL_DAY|MORNING|AFTERNOON
  "remarks": "On time" // Optional
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

---

### POST /attendance/bulk

Mark multiple student attendances.

**Required Fields:**

```json
{
  "schoolId": 1,
  "classId": 1,
  "attendanceDate": "2026-02-18",
  "academicYear": "2082",
  "records": []
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "classId": 1, // Required
  "sectionId": 1, // Optional
  "attendanceDate": "2026-02-18", // Required
  "attendanceDateBs": "2082-11-06", // Optional
  "academicYear": "2082", // Required
  "session": "FULL_DAY", // Optional
  "records": [
    // Required - Array of student attendances
    { "studentId": 1, "status": "PRESENT", "remarks": "On time" },
    { "studentId": 2, "status": "ABSENT", "remarks": "Sick" },
    { "studentId": 3, "status": "LEAVE", "remarks": "Family function" }
  ]
}
```

---

## 11. EXAMS

### POST /exams

Create a new exam.

**Required Fields:**

```json
{
  "schoolId": 1,
  "examName": "First Terminal Exam",
  "examCode": "TERM1",
  "examType": "TERMINAL",
  "classId": 1,
  "examDate": "2026-03-01",
  "fullMarks": 100,
  "passMarks": 35
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "examName": "First Terminal Exam", // Required
  "examCode": "TERM1", // Required - Unique within school
  "examType": "TERMINAL", // Required - UNIT_TEST|TERMINAL|FINAL|SEE|NEB|BOARD
  "classId": 1, // Optional
  "sectionId": 1, // Optional
  "subjectId": 1, // Optional
  "examDate": "2026-03-01", // Required - AD Date
  "examDateBs": "2082-11-15", // Optional - BS Date
  "startTime": "09:00", // Optional
  "endTime": "12:00", // Optional
  "fullMarks": 100, // Required
  "passMarks": 35, // Required
  "isPublished": true, // Optional - Default: false
  "isResultPublished": false, // Optional
  "isLocked": false, // Optional
  "academicYear": "2082" // Optional
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

**Required Fields:**

```json
{
  "schoolId": 1,
  "categoryName": "Tuition Fee"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "categoryName": "Tuition Fee", // Required
  "categoryType": "TUITION", // Optional - TUITION|HOSTEL|TRANSPORT|LIBRARY|EXAM|OTHER
  "description": "Monthly tuition charges" // Optional
}
```

---

### POST /fee/structures

Create fee structure.

**Required Fields:**

```json
{
  "schoolId": 1,
  "classId": 1,
  "academicYear": "2082",
  "feeType": "TUITION",
  "amount": 5000
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "classId": 1, // Required
  "academicYear": "2082", // Required
  "feeType": "TUITION", // Required
  "categoryId": 1, // Optional
  "amount": 5000, // Required
  "isRecurring": true, // Optional - Monthly recurring
  "dueDate": "2082-01-15", // Optional - BS Date
  "installmentNumber": 1 // Optional - For installment plans
}
```

---

### POST /fee/payments

Record fee payment.

**Required Fields:**

```json
{
  "schoolId": 1,
  "studentId": 1,
  "amount": 5000,
  "paymentMethod": "CASH"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "studentId": 1, // Required
  "feeStructureId": 1, // Optional
  "amount": 5000, // Required
  "paymentMethod": "CASH", // Required - CASH|BANK|CHEQUE|ESEWA|KHALTI|FONEPAY|CONNECTIPS|IMEPAY
  "transactionDate": "2026-01-15", // Optional - Default: today
  "transactionDateBs": "2082-10-02", // Optional
  "referenceNumber": "RCP-001", // Optional
  "remarks": "First installment" // Optional
}
```

---

## 13. LIBRARY

### POST /library/books

Add a new book.

**Required Fields:**

```json
{
  "schoolId": 1,
  "title": "Mathematics",
  "bookCode": "B001"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "isbn": "978-3-16-148410-0", // Optional
  "bookCode": "B001", // Required - Unique within school
  "title": "Mathematics", // Required
  "titleNp": "गणित", // Optional
  "author": "Editorial", // Optional
  "authorNp": "सम्पादक", // Optional
  "publisher": "National Publisher", // Optional
  "publisherNp": "राष्ट्रीय प्रकाशक", // Optional
  "category": "ACADEMIC", // Optional - ACADEMIC|REFERENCE|FICTION|NON_FICTION
  "totalCopies": 10, // Optional - Default: 1
  "price": 350, // Optional
  "currency": "NPR", // Optional
  "rackNumber": "A-1-1" // Optional
}
```

---

### POST /library/issues

Issue book to student.

**Required Fields:**

```json
{
  "schoolId": 1,
  "bookId": 1,
  "studentId": 1,
  "issueDate": "2026-02-18"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "bookId": 1, // Required
  "studentId": 1, // Required
  "issueDate": "2026-02-18", // Required - AD Date
  "issueDateBs": "2082-11-06", // Optional
  "dueDate": "2026-03-18", // Required
  "dueDateBs": "2082-12-06" // Optional
}
```

---

### POST /library/issues/return

Return book.

**Required Fields:**

```json
{
  "schoolId": 1,
  "issueId": 1
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "issueId": 1, // Required
  "returnDate": "2026-03-15", // Optional - Default: today
  "returnDateBs": "2082-12-03" // Optional
}
```

---

## 14. TRANSPORT

### POST /transport/vehicles

Add vehicle.

**Required Fields:**

```json
{
  "schoolId": 1,
  "vehicleNumber": "Ba 1 Ja 1234"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "vehicleNumber": "Ba 1 Ja 1234", // Required - Unique vehicle number
  "vehicleName": "School Bus 1", // Optional
  "vehicleType": "BUS", // Required - BUS|VAN|CAR|OTHER
  "capacity": 50, // Optional
  "driverName": "Ram Singh", // Optional
  "driverLicense": "DL-12345", // Optional
  "driverMobile": "9841000004", // Optional
  "insuranceExpiry": "2027-12-31", // Optional
  "permitExpiry": "2027-12-31", // Optional
  "isActive": true // Optional
}
```

---

### POST /transport/routes

Create transport route.

**Required Fields:**

```json
{
  "schoolId": 1,
  "routeName": "Route 1 - Koteshwor"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "routeName": "Route 1 - Koteshwor", // Required
  "routeCode": "R1", // Optional
  "startPoint": "School", // Optional
  "endPoint": "Koteshwor", // Optional
  "distance": 5.5, // Optional - In KM
  "fare": 500, // Optional
  "isActive": true // Optional
}
```

---

## 15. TIMETABLES

### POST /timetables

Create timetable entry.

**Required Fields:**

```json
{
  "schoolId": 1,
  "classId": 1,
  "subjectId": 1,
  "teacherId": 1,
  "dayOfWeek": "MONDAY"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "classId": 1, // Required
  "sectionId": 1, // Optional
  "subjectId": 1, // Required
  "teacherId": 1, // Required
  "dayOfWeek": "MONDAY", // Required - MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY
  "startTime": "08:00", // Required - HH:MM format
  "endTime": "09:00", // Required - HH:MM format
  "roomNumber": "Room 101", // Optional
  "academicYear": "2082", // Optional
  "isActive": true // Optional
}
```

---

## 16. ASSIGNMENTS

### POST /assignments

Create assignment.

**Required Fields:**

```json
{
  "schoolId": 1,
  "classId": 1,
  "subjectId": 1
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "classId": 1, // Required
  "sectionId": 1, // Optional
  "subjectId": 1, // Required
  "title": "Chapter 1 Review", // Optional
  "description": "Complete all exercises", // Optional
  "dueDate": "2026-02-25", // Optional - AD Date
  "dueDateBs": "2082-11-14", // Optional
  "totalMarks": 20, // Optional
  "academicYear": "2082", // Optional
  "isActive": true // Optional
}
```

---

## 17. NOTIFICATIONS

### POST /notifications

Send notification.

**Required Fields:**

```json
{
  "schoolId": 1,
  "title": "Exam Notice"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "userId": 1, // Optional - Specific user
  "title": "Exam Notice", // Required
  "message": "Exam starts soon", // Optional
  "type": "GENERAL", // Optional - GENERAL|EXAM|FEE|ATTENDANCE|ACHIEVEMENT
  "priority": "NORMAL", // Optional - LOW|NORMAL|HIGH
  "sendSms": false, // Optional - Send SMS notification
  "sendEmail": false // Optional - Send email notification
}
```

---

## 18. HR / STAFF

### POST /hr/staff

Add staff member.

**Required Fields:**

```json
{
  "schoolId": 1,
  "firstName": "Kamal",
  "lastName": "Shrestha"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "staffCode": "STF001", // Optional - Auto-generated if not provided
  "firstName": "Kamal", // Required
  "lastName": "Shrestha", // Required
  "email": "kamal@school.edu.np", // Optional
  "mobile": "9841000005", // Optional
  "department": "Administration", // Optional
  "designation": "Accountant", // Optional
  "employmentType": "PERMANENT", // Optional - PERMANENT|CONTRACTUAL|PART_TIME
  "joiningDate": "2020-06-01", // Optional

  // Address (Nepal - IDs)
  "provinceId": 3, // Optional
  "districtId": 25, // Optional
  "municipalityId": 507, // Optional
  "wardNo": 5, // Optional
  "toleEn": "Admin Tole", // Optional
  "toleNp": "प्रशासन टोल" // Optional
}
```

---

### POST /hr/payroll/process

Process payroll.

**Required Fields:**

```json
{
  "schoolId": 1,
  "staffId": 1,
  "month": 1,
  "year": 2082,
  "basicSalary": 30000
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "staffId": 1, // Required
  "month": 1, // Required - 1-12
  "year": 2082, // Required - BS year
  "basicSalary": 30000, // Required
  "allowances": 5000, // Optional - House rent, transport, etc.
  "deductions": 2000, // Optional - Tax, PF, etc.
  "paymentDate": "2026-02-25", // Optional
  "paymentStatus": "PENDING", // Optional - PENDING|PAID
  "bankName": "NMB Bank", // Optional
  "accountNumber": "1234567890", // Optional
  "remarks": "Monthly salary" // Optional
}
```

---

### POST /hr/leaves

Submit leave request.

**Required Fields:**

```json
{
  "schoolId": 1,
  "staffId": 1,
  "leaveType": "ANNUAL",
  "startDate": "2026-03-01"
}
```

**All Fields:**

```json
{
  "schoolId": 1, // Required
  "staffId": 1, // Required
  "leaveType": "ANNUAL", // Required - ANNUAL|SICK|CASUAL|MATERNITY|PATERNITY|UNPAID
  "startDate": "2026-03-01", // Required - AD Date
  "startDateBs": "2082-11-18", // Optional
  "endDate": "2026-03-05", // Required
  "endDateBs": "2082-11-22", // Optional
  "reason": "Family function", // Optional
  "status": "PENDING", // Optional - PENDING|APPROVED|REJECTED
  "approvedBy": null, // Optional
  "approvedAt": null // Optional
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

---

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

---

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

---

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

---

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

### Session

- FULL_DAY
- MORNING
- AFTERNOON

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

### DayOfWeek

- MONDAY
- TUESDAY
- WEDNESDAY
- THURSDAY
- FRIDAY
- SATURDAY
- SUNDAY

### SchoolType

- DAY
- SEMI_BOARDING
- FULL_BOARDING

### OwnershipType

- PRIVATE
- GOVT

### SubjectType

- COMPULSORY
- OPTIONAL
- ELECTIVE

### FeeType

- TUITION
- HOSTEL
- TRANSPORT
- LIBRARY
- EXAM
- OTHER

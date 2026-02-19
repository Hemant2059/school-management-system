export const AUTH_EXAMPLES = {
  login: {
    success: {
      accessToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJBRE1JTiIsInNjaG9vbElkIjoxLCJpYXQiOjE3MDY3OTIwMDAsImV4cCI6MTcwNjc5NTYwMH0.xxxxxxxxxxxxxx',
      refreshToken:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidHlwZSI6InJlZnJlc2giLCJpYXQiOjE3MDY3OTIwMDAsImV4cCI6MTcwNjg3ODQwMH0.yyyyyyyyyyyyyy',
      sessionId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      user: {
        id: 1,
        username: 'admin',
        email: 'admin@school.edu.np',
        role: 'ADMIN',
        schoolId: 1,
        schoolName: 'Kathmandu Model Secondary School',
      },
    },
    invalidCredentials: {
      statusCode: 401,
      message: 'Invalid credentials',
      error: 'Unauthorized',
    },
    accountLocked: {
      statusCode: 423,
      message: 'Account is locked due to too many failed attempts',
      error: 'Locked',
    },
  },
  refreshToken: {
    success: {
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresIn: 3600,
    },
    invalidToken: {
      statusCode: 401,
      message: 'Invalid or expired refresh token',
    },
  },
  changePassword: {
    success: {
      message: 'Password changed successfully',
    },
    wrongCurrentPassword: {
      statusCode: 400,
      message: 'Current password is incorrect',
    },
  },
};

export const STUDENT_EXAMPLES = {
  create: {
    schoolId: 1,
    firstName: 'राम',
    firstNameEn: 'Ram',
    lastName: 'शर्मा',
    lastNameEn: 'Sharma',
    gender: 'MALE',
    dateOfBirth: '2015-01-15',
    bloodGroup: 'A_POSITIVE',
    admissionNumber: 'ADM-2024-0001',
    rollNumber: 1,
    academicYear: '2081-2082',
    classId: 10,
    sectionId: 1,
    admissionDate: '2081-04-01',
    address: {
      province: 3,
      district: 'Kathmandu',
      municipality: 'Kathmandu Metropolitan',
      wardNumber: 10,
      tole: 'Lazimpat',
    },
    guardian: {
      firstName: 'श्याम',
      lastName: 'शर्मा',
      mobile: '9841234567',
      relation: 'FATHER',
      occupation: 'Business',
    },
  },
  search: {
    success: [
      {
        id: 1,
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        admissionNumber: 'ADM-2024-0001',
        rollNumber: 1,
        class: 'Grade 10',
        section: 'A',
        status: 'ACTIVE',
      },
    ],
  },
  fullDetails: {
    id: 1,
    firstNameEn: 'Ram',
    lastNameEn: 'Sharma',
    admissionNumber: 'ADM-2024-0001',
    class: { id: 10, name: 'Grade 10', nameEn: 'Grade 10' },
    section: { id: 1, name: 'A' },
    guardians: [
      {
        id: 1,
        firstName: 'श्याम',
        lastName: 'शर्मा',
        mobile: '9841234567',
        relation: 'FATHER',
      },
    ],
    enrollments: [
      {
        id: 1,
        academicYear: '2081-2082',
        classId: 10,
        sectionId: 1,
        status: 'ACTIVE',
      },
    ],
    attendance: {
      totalDays: 180,
      present: 175,
      absent: 3,
      leave: 2,
      percentage: 97.22,
    },
  },
};

export const ATTENDANCE_EXAMPLES = {
  create: {
    studentId: 123,
    date: '2081-10-15',
    status: 'PRESENT',
    remarks: 'On time',
  },
  bulk: {
    date: '2081-10-15',
    classId: 10,
    sectionId: 1,
    records: [
      { studentId: 1, status: 'PRESENT' },
      { studentId: 2, status: 'PRESENT' },
      { studentId: 3, status: 'ABSENT', remarks: 'Sick leave' },
      { studentId: 4, status: 'LATE', remarks: 'Arrived 10 min late' },
    ],
  },
  studentAttendance: [
    {
      id: 1,
      date: '2081-10-15',
      status: 'PRESENT',
      remarks: null,
    },
    {
      id: 2,
      date: '2081-10-16',
      status: 'ABSENT',
      remarks: 'Sick',
    },
  ],
  statistics: {
    studentId: 123,
    academicYear: '2081-2082',
    totalDays: 180,
    present: 175,
    absent: 3,
    leave: 2,
    percentage: 97.22,
  },
  monthlyReport: {
    month: '2081-10',
    monthName: 'Mangsir',
    totalStudents: 50,
    attendance: [
      { date: '2081-10-01', day: 1, present: 48, absent: 2, holiday: false },
      { date: '2081-10-02', day: 2, present: 49, absent: 1, holiday: false },
    ],
  },
  holiday: {
    date: '2024-04-14',
    isHoliday: true,
    nepaliDate: '2081-01-01',
    holidayName: 'Nawa Barsha',
  },
};

export const EXAM_EXAMPLES = {
  create: {
    name: 'Terminal Examination 2081',
    classId: 10,
    examType: 'TERMINAL',
    startDate: '2081-10-15',
    endDate: '2081-10-25',
    subjects: [
      {
        subjectId: 1,
        date: '2081-10-15',
        startTime: '09:00',
        duration: 150,
        fullMarks: 100,
      },
      {
        subjectId: 2,
        date: '2081-10-16',
        startTime: '09:00',
        duration: 150,
        fullMarks: 100,
      },
    ],
  },
  list: [
    {
      id: 1,
      name: 'Terminal Examination 2081',
      classId: 10,
      examType: 'TERMINAL',
      startDate: '2081-10-15',
      endDate: '2081-10-25',
      status: 'SCHEDULED',
    },
  ],
  details: {
    id: 1,
    name: 'Terminal Examination 2081',
    classId: 10,
    className: 'Grade 10',
    examType: 'TERMINAL',
    startDate: '2081-10-15',
    endDate: '2081-10-25',
    subjects: [
      {
        id: 1,
        name: 'English',
        code: 'ENG',
        date: '2081-10-15',
        startTime: '09:00',
        duration: 150,
        fullMarks: 100,
        passMarks: 35,
      },
    ],
  },
};

export const RESULT_EXAMPLES = {
  create: {
    examId: 1,
    studentId: 123,
    marks: [
      { subjectId: 1, theoryMarks: 85, practicalMarks: 18, assignmentMarks: 5 },
      {
        subjectId: 2,
        theoryMarks: 78,
        practicalMarks: null,
        assignmentMarks: 4,
      },
    ],
  },
  bulk: {
    examId: 1,
    classId: 10,
    marks: [
      {
        studentId: 1,
        marks: [
          { subjectId: 1, theoryMarks: 85, practicalMarks: 18 },
          { subjectId: 2, theoryMarks: 78 },
        ],
      },
      {
        studentId: 2,
        marks: [
          { subjectId: 1, theoryMarks: 72, practicalMarks: 15 },
          { subjectId: 2, theoryMarks: 65 },
        ],
      },
    ],
  },
  studentResult: {
    studentId: 123,
    examId: 1,
    examName: 'Terminal Examination 2081',
    totalMarks: 750,
    obtainedMarks: 625,
    percentage: 83.33,
    grade: 'A',
    gradePoint: 3.6,
    rank: 5,
    subjects: [
      {
        subjectId: 1,
        subjectName: 'English',
        fullMarks: 100,
        obtainedMarks: 85,
        grade: 'A',
      },
    ],
  },
  classResult: {
    examId: 1,
    classId: 10,
    totalStudents: 50,
    appeared: 48,
    passed: 45,
    failed: 3,
    passPercentage: 93.75,
    highestMarks: 780,
    lowestMarks: 280,
    averageMarks: 580,
    gradeDistribution: {
      'A+': 10,
      A: 15,
      'B+': 12,
      B: 8,
    },
  },
  gpa: {
    studentId: 123,
    academicYear: '2081-2082',
    gpa: 3.4,
    totalCredits: 120,
    gradePoints: 408,
    rank: 15,
    totalStudents: 50,
  },
  submit: {
    examId: 1,
    status: 'SUBMITTED',
    submittedAt: '2081-10-30T10:00:00Z',
    submittedBy: 5,
  },
  verify: {
    examId: 1,
    status: 'VERIFIED',
    verifiedAt: '2081-10-31T14:00:00Z',
    verifiedBy: 1,
  },
};

export const FEE_EXAMPLES = {
  category: {
    create: {
      name: 'Tuition Fee',
      nameNp: 'शिक्षा शुल्क',
      description: 'Monthly tuition fee',
      type: 'MONTHLY',
      isOptional: false,
    },
    success: {
      id: 1,
      name: 'Tuition Fee',
      nameNp: 'शिक्षा शुल्क',
      type: 'MONTHLY',
    },
  },
  structure: {
    create: {
      classId: 10,
      sectionId: 1,
      academicYear: '2081-2082',
      categories: [
        { categoryId: 1, amount: 5000, isOptional: false },
        { categoryId: 2, amount: 1000, isOptional: true },
      ],
    },
    success: {
      id: 1,
      classId: 10,
      academicYear: '2081-2082',
      totalAmount: 6000,
      categories: [
        { name: 'Tuition Fee', amount: 5000 },
        { name: 'Lab Fee', amount: 1000 },
      ],
    },
  },
  studentFee: {
    create: {
      studentId: 123,
      structureId: 1,
    },
    success: {
      id: 1,
      studentId: 123,
      totalAmount: 60000,
      paidAmount: 30000,
      pendingAmount: 30000,
      installments: [
        {
          id: 1,
          dueDate: '2081-04-15',
          amount: 10000,
          paid: true,
          paidDate: '2081-04-10',
        },
        {
          id: 2,
          dueDate: '2081-08-15',
          amount: 10000,
          paid: true,
          paidDate: '2081-08-14',
        },
        { id: 3, dueDate: '2081-12-15', amount: 10000, paid: false },
      ],
    },
  },
  payment: {
    create: {
      studentFeeId: 1,
      amount: 10000,
      paymentDate: '2081-04-10',
      paymentMethod: 'BANK',
      transactionReference: 'TXN-2024-001',
      remarks: 'First installment',
    },
    success: {
      id: 1,
      transactionId: 'TXN-2024-001',
      amount: 10000,
      paymentDate: '2081-04-10',
      paymentMethod: 'BANK',
      receiptUrl: '/api/fee/receipts/1',
    },
  },
  receipt: {
    transactionId: 1,
    receiptNumber: 'RCP-2024-0001',
    studentName: 'Ram Sharma',
    admissionNumber: 'ADM-2024-0001',
    class: 'Grade 10',
    academicYear: '2081-2082',
    paymentDate: '2081-04-10',
    amount: 10000,
    paymentMethod: 'BANK',
    transactionReference: 'TXN-2024-001',
    remainingBalance: 50000,
    collectedBy: 'Admin User',
  },
  overdueFees: [
    {
      studentId: 123,
      studentName: 'Ram Sharma',
      admissionNumber: 'ADM-2024-0001',
      class: 'Grade 10',
      totalPending: 15000,
      daysOverdue: 45,
      lastPaymentDate: '2081-08-15',
    },
  ],
};

export const TEACHER_EXAMPLES = {
  create: {
    schoolId: 1,
    firstName: 'जय',
    firstNameEn: 'Jay',
    lastName: 'पन्त',
    lastNameEn: 'Panta',
    gender: 'MALE',
    dateOfBirth: '1985-05-15',
    employeeId: 'EMP-2024-001',
    email: 'jay.panta@school.edu.np',
    mobile: '9841234567',
    joiningDate: '2081-04-01',
    qualification: 'M.Ed',
    department: 'Science',
    designation: 'Teacher',
    salary: 50000,
    address: {
      province: 3,
      district: 'Kathmandu',
      municipality: 'Kageshwori',
      wardNumber: 5,
    },
  },
  search: [
    {
      id: 1,
      firstNameEn: 'Jay',
      lastNameEn: 'Panta',
      employeeId: 'EMP-2024-001',
      department: 'Science',
      designation: 'Teacher',
      status: 'ACTIVE',
    },
  ],
  details: {
    id: 1,
    firstNameEn: 'Jay',
    lastNameEn: 'Panta',
    employeeId: 'EMP-2024-001',
    email: 'jay.panta@school.edu.np',
    mobile: '9841234567',
    department: 'Science',
    designation: 'Teacher',
    qualifications: ['M.Ed', 'B.Ed'],
    subjects: [
      { id: 1, name: 'Physics', code: 'PHY' },
      { id: 2, name: 'Chemistry', code: 'CHEM' },
    ],
    classes: [
      { id: 10, name: 'Grade 10', section: 'A', subject: 'Physics' },
      { id: 11, name: 'Grade 11', section: 'B', subject: 'Chemistry' },
    ],
  },
};

export const GUARDIAN_EXAMPLES = {
  create: {
    schoolId: 1,
    firstName: 'श्याम',
    firstNameEn: 'Shyam',
    lastName: 'शर्मा',
    lastNameEn: 'Sharma',
    mobile: '9841234567',
    email: 'shyam.sharma@email.com',
    relation: 'FATHER',
    occupation: 'Business',
    income: 500000,
    address: {
      province: 3,
      district: 'Kathmandu',
      municipality: 'Kathmandu',
      wardNumber: 10,
    },
  },
  search: [
    {
      id: 1,
      firstNameEn: 'Shyam',
      lastNameEn: 'Sharma',
      mobile: '9841234567',
      relation: 'FATHER',
    },
  ],
  details: {
    id: 1,
    firstNameEn: 'Shyam',
    lastNameEn: 'Sharma',
    mobile: '9841234567',
    email: 'shyam.sharma@email.com',
    relation: 'FATHER',
    occupation: 'Business',
    students: [
      {
        id: 1,
        name: 'Ram Sharma',
        relation: 'FATHER',
        isPrimary: true,
      },
    ],
  },
};

export const PAGINATION_EXAMPLES = {
  pageRequest: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    order: 'DESC',
    search: 'Ram',
  },
  pageResponse: {
    data: [],
    meta: {
      page: 1,
      limit: 20,
      total: 100,
      totalPages: 5,
      hasNext: true,
      hasPrevious: false,
    },
  },
};

export const ERROR_EXAMPLES = {
  unauthorized: {
    statusCode: 401,
    message: 'Unauthorized',
    error: 'Unauthorized',
  },
  forbidden: {
    statusCode: 403,
    message: 'Forbidden resource',
    error: 'Forbidden',
  },
  notFound: {
    statusCode: 404,
    message: 'Resource not found',
    error: 'Not Found',
  },
  validationError: {
    statusCode: 422,
    message: 'Validation failed',
    error: 'Unprocessable Entity',
    details: [
      { field: 'email', message: 'Invalid email format' },
      { field: 'mobile', message: 'Mobile must be 10 digits' },
    ],
  },
  badRequest: {
    statusCode: 400,
    message: 'Invalid input data',
    error: 'Bad Request',
  },
  conflict: {
    statusCode: 409,
    message: 'Resource already exists',
    error: 'Conflict',
  },
  tooManyRequests: {
    statusCode: 429,
    message: 'Too many requests. Please try again later.',
    error: 'Too Many Requests',
  },
};

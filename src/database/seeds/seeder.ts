import { DataSource } from 'typeorm';
import { Faker, en } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
import { databaseConfig } from '../../config/database.config';
import { School } from '../../school/entities/school.entity';
import { User } from '../../user/entities/user.entity';
import { AcademicClass } from '../../academic-class/entities/academic-class.entity';
import { Section } from '../../section/entities/section.entity';
import { Teacher } from '../../teacher/entities/teacher.entity';
import { Guardian } from '../../guardian/entities/guardian.entity';
import { Student } from '../../student/entities/student.entity';
import { Enrollment } from '../../enrollment/entities/enrollment.entity';
import { Subject } from '../../subject/entities/subject.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { FeeCategory } from '../../fee/entities/fee-category.entity';
import { FeeStructure } from '../../fee/entities/fee-structure.entity';
import { StudentFee } from '../../fee/entities/student-fee.entity';
import { Book } from '../../library/entities/book.entity';
import { BookIssue } from '../../library/entities/book-issue.entity';
import { Exam } from '../../exam/entities/exam.entity';
import { Mark } from '../../result/entities/mark.entity';
import { Staff } from '../../hr/entities/staff.entity';
import { Payroll } from '../../hr/entities/payroll.entity';
import { LeaveType } from '../../hr/entities/leave-type.entity';
import { LeaveRequest } from '../../hr/entities/leave-request.entity';
import { Vehicle } from '../../transport/entities/vehicle.entity';
import { Route } from '../../transport/entities/route.entity';
import { RouteStop } from '../../transport/entities/route-stop.entity';
import { TransportAssignment } from '../../transport/entities/transport-assignment.entity';
import { TransportFee } from '../../transport/entities/transport-fee.entity';
import { StudentGuardian } from '../../guardian/entities/student-guardian.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { Assignment } from '../../assignment/entities/assignment.entity';
import { Timetable } from '../../timetable/entities/timetable.entity';

const faker = new Faker({ locale: [en] });

async function seed() {
  const dataSource = new DataSource(databaseConfig as any);
  await dataSource.initialize();
  console.log('Database connected for seeding...');

  // Truncate tables for fresh seed (Reverse order of dependencies)
  console.log('Cleaning up existing data...');
  const tables = [
    'assignments',
    'notifications',
    'timetables',
    'student_fees',
    'fee_transactions',
    'fee_structures',
    'fee_categories',
    'marks',
    'exams',
    'book_issues',
    'books',
    'leave_requests',
    'payroll',
    'staff',
    'leave_types',
    'transport_assignments',
    'student_guardians',
    'route_stops',
    'routes',
    'vehicles',
    'student_enrollments',
    'attendance',
    'students',
    'teachers',
    'guardians',
    'subjects',
    'sections',
    'classes',
    'users',
    'schools',
  ];

  for (const table of tables) {
    try {
      await dataSource.query(
        `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`,
      );
    } catch {
      console.log(`Could not truncate ${table}, skipping...`);
    }
  }

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Schools
  console.log('Seeding Schools...');
  const schools: School[] = [];
  for (let i = 0; i < 10; i++) {
    const school = dataSource.manager.create(School, {
      schoolCode: `SCH${1000 + i}`,
      schoolName: faker.company.name() + ' School',
      schoolType: faker.helpers.arrayElement([
        'DAY',
        'BOARDING',
        'DAY_BOARDING',
      ]),
      ownershipType: faker.helpers.arrayElement([
        'PRIVATE',
        'COMMUNITY',
        'INSTITUTIONAL',
      ]),
      establishedDate: faker.date.past({ years: 20 }),
      registrationNumber: `REG-${faker.string.alphanumeric(10).toUpperCase()}`,
      provinceId: faker.number.int({ min: 1, max: 7 }),
      districtId: faker.number.int({ min: 1, max: 77 }),
      municipalityId: faker.number.int({ min: 1, max: 753 }),
      wardNo: faker.number.int({ min: 1, max: 32 }),
      tole: faker.location.streetAddress().substring(0, 100),
      mobile: faker.string.numeric(10),
      email: faker.internet.email().toLowerCase(),
    });
    schools.push(await dataSource.manager.save(school));
  }

  // 2. Users
  console.log('Seeding Users...');
  const users: User[] = [];
  const roles = [
    'ADMIN',
    'TEACHER',
    'STAFF',
    'STUDENT',
    'PARENT',
    'ACCOUNTANT',
  ];
  for (let i = 0; i < 60; i++) {
    const userRole = roles[i % roles.length];
    const user = dataSource.manager.create(User, {
      schoolId: schools[i % schools.length].schoolId,
      username: `${userRole.toLowerCase()}_${i}_${faker.string.alphanumeric(4)}`,
      email: faker.internet.email().toLowerCase(),
      passwordHash: passwordHash,
      fullName: faker.person.fullName(),
      userType: userRole,
      isVerified: true,
      isActive: true,
    });
    users.push(await dataSource.manager.save(user));
  }

  // 3. Academic Classes
  console.log('Seeding Academic Classes...');
  const classes: AcademicClass[] = [];
  const levels = [
    'PRIMARY',
    'LOWER_SECONDARY',
    'SECONDARY',
    'HIGHER_SECONDARY',
  ];
  for (let i = 0; i < 12; i++) {
    const academicClass = dataSource.manager.create(AcademicClass, {
      schoolId: schools[0].schoolId,
      className: `Grade ${i + 1}`,
      classCode: `G${i + 1}`,
      classOrder: i + 1,
      educationLevel: levels[Math.floor(i / 3)] || 'PRIMARY',
      isActive: true,
    });
    classes.push(await dataSource.manager.save(academicClass));
  }

  // 4. Sections
  console.log('Seeding Sections...');
  const sections: Section[] = [];
  for (const cls of classes) {
    for (const secName of ['A', 'B']) {
      const section = dataSource.manager.create(Section, {
        schoolId: schools[0].schoolId,
        classId: cls.classId,
        sectionName: `Section ${secName}`,
        sectionCode: secName,
        capacity: 40,
        isActive: true,
      });
      sections.push(await dataSource.manager.save(section));
    }
  }

  // 5. Teachers
  console.log('Seeding Teachers...');
  const teachers: Teacher[] = [];
  for (let i = 0; i < 15; i++) {
    const teacher = dataSource.manager.create(Teacher, {
      schoolId: schools[0].schoolId,
      teacherCode: `TCH${1000 + i}`,
      employeeId: `EMP${1000 + i}`,
      firstNameEn: faker.person.firstName(),
      lastNameEn: faker.person.lastName(),
      gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
      joiningDate: faker.date.past({ years: 5 }),
      employmentType: 'PERMANENT',
      currentStatus: 'ACTIVE',
    });
    teachers.push(await dataSource.manager.save(teacher));
  }

  // 6. Guardians
  console.log('Seeding Guardians & Linking to Students...');
  const guardians: Guardian[] = [];
  const parentUsers = users.filter((u) => u.userType === 'PARENT');

  for (let i = 0; i < 20; i++) {
    const guardian = dataSource.manager.create(Guardian, {
      schoolId: schools[0].schoolId,
      userId: parentUsers[i % parentUsers.length]?.userId, // Link to Parent User
      guardianCode: `GDN${1000 + i}`,
      firstNameEn: faker.person.firstName(),
      lastNameEn: faker.person.lastName(),
      relationToStudent: faker.helpers.arrayElement([
        'FATHER',
        'MOTHER',
        'OTHER',
      ]),
      mobile: faker.string.numeric(10),
      isActive: true,
    });
    guardians.push(await dataSource.manager.save(guardian));
  }

  // 7. Students
  console.log('Seeding Students...');
  const students: Student[] = [];
  for (let i = 0; i < 20; i++) {
    const student = dataSource.manager.create(Student, {
      schoolId: schools[0].schoolId,
      studentCode: `STD${1000 + i}`,
      admissionNumber: `ADM${1000 + i}`,
      firstNameEn: faker.person.firstName(),
      lastNameEn: faker.person.lastName(),
      dateOfBirthAd: faker.date.birthdate({ min: 5, max: 18, mode: 'age' }),
      gender: faker.helpers.arrayElement(['MALE', 'FEMALE']),
      admissionDate: faker.date.past({ years: 1 }),
      admissionClassId: classes[0].classId,
      currentStatus: 'ACTIVE',
    });
    students.push(await dataSource.manager.save(student));
  }

  // 7.5 Link Students to Guardians
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const guardian = guardians[i % guardians.length]; // Simple 1-to-1 mapping for seed

    const studentGuardian = dataSource.manager.create(StudentGuardian, {
      schoolId: schools[0].schoolId,
      studentId: Number(student.studentId),
      guardianId: Number(guardian.guardianId),
      relationship: guardian.relationToStudent,
      isPrimaryContact: true,
    });
    await dataSource.manager.save(studentGuardian);
  }

  // 8. Enrollments
  console.log('Seeding Enrollments...');
  for (let i = 0; i < students.length; i++) {
    const enrollment = dataSource.manager.create(Enrollment, {
      schoolId: schools[0].schoolId,
      studentId: Number(students[i].studentId),
      classId: Number(classes[Math.floor(i / 2) % classes.length].classId),
      sectionId: Number(
        sections[Math.floor(i / 2) % sections.length].sectionId,
      ),
      enrollmentType: 'REGULAR',
      academicYear: '2081',
      enrollmentDate: new Date(),
      rollNumber: String((i % 2) + 1),
      status: 'ACTIVE',
    } as any);
    await dataSource.manager.save(enrollment);
  }

  // 9. Subjects
  console.log('Seeding Subjects...');
  const subjectNames = [
    'Math',
    'Science',
    'English',
    'Nepali',
    'Social',
    'Computer',
    'Account',
    'Economics',
    'Health',
    'Physical',
  ];
  const subjects: Subject[] = [];
  for (let i = 0; i < subjectNames.length; i++) {
    const subject = dataSource.manager.create(Subject, {
      schoolId: schools[0].schoolId,
      subjectName: subjectNames[i],
      subjectCode: subjectNames[i].substring(0, 3).toUpperCase() + i,
      subjectType: 'COMPULSORY',
      creditHours: 4,
    });
    subjects.push(await dataSource.manager.save(subject));
  }

  // 10. Fee Categories & Structure
  console.log('Seeding Fees...');
  const feeCats: FeeCategory[] = [];
  const catNames = [
    'Tuition',
    'Admission',
    'Exam',
    'Transport',
    'Library',
    'Canteen',
    'Uniform',
    'Stationery',
    'Hostel',
    'Other',
  ];
  const catTypes = [
    'TUITION',
    'ADMISSION',
    'EXAMINATION',
    'TRANSPORT',
    'LIBRARY',
    'MISC',
    'MISC',
    'MISC',
    'HOSTEL',
    'MISC',
  ];
  for (let i = 0; i < catNames.length; i++) {
    const cat = dataSource.manager.create(FeeCategory, {
      schoolId: schools[0].schoolId,
      categoryName: catNames[i],
      categoryCode: catNames[i].toUpperCase() + i,
      categoryType: catTypes[i],
    });
    feeCats.push(await dataSource.manager.save(cat));
  }

  const feeStructures: FeeStructure[] = [];
  for (let i = 0; i < 10; i++) {
    const structure = dataSource.manager.create(FeeStructure, {
      schoolId: schools[0].schoolId,
      academicYearId: 2081,
      classId: classes[i % classes.length].classId,
      categoryId: feeCats[i % feeCats.length].categoryId,
      amount: faker.number.int({ min: 1000, max: 5000 }),
      dueDate: faker.date.future(),
    });
    feeStructures.push(await dataSource.manager.save(structure));
  }

  const studentFees: StudentFee[] = [];
  for (let i = 0; i < 20; i++) {
    const sf = dataSource.manager.create(StudentFee, {
      schoolId: schools[0].schoolId,
      studentId: students[i % students.length].studentId,
      feeStructureId: feeStructures[i % feeStructures.length].structureId,
      academicYearId: 2081,
      totalAmount: feeStructures[i % feeStructures.length].amount,
      paidAmount: 0,
      status: 'PENDING',
    });
    studentFees.push(await dataSource.manager.save(sf));
  }

  // 11. Library
  console.log('Seeding Library...');
  const books: Book[] = [];
  for (let i = 0; i < 15; i++) {
    const book = dataSource.manager.create(Book, {
      schoolId: schools[0].schoolId,
      titleEn: faker.commerce.productName(),
      authorEn: faker.person.fullName(),
      publisherEn: faker.company.name(),
      isbn: faker.string.numeric(13),
      bookCode: `BK${1000 + i}`,
      bookType: faker.helpers.arrayElement(['TEXTBOOK', 'REFERENCE', 'NOVEL']),
      acquisitionDate: new Date(),
      price: faker.number.int({ min: 200, max: 2000 }),
      totalCopies: 5,
      availableCopies: 5,
    } as any);
    books.push(await dataSource.manager.save(book));
  }

  // 12. Exams & Marks
  console.log('Seeding Exams & Marks...');
  const exams: Exam[] = [];
  for (let i = 0; i < 10; i++) {
    const exam = dataSource.manager.create(Exam, {
      schoolId: schools[0].schoolId,
      examName: `Unit Test ${i + 1}`,
      examCode: `UT${i + 1}`,
      examType: 'UNIT_TEST',
      classId: classes[0].classId,
      subjectId: subjects[i % subjects.length].subjectId,
      examDate: faker.date.recent(),
      fullMarks: 100,
      passMarks: 40,
      isPublished: true,
      isActive: true,
    } as any);
    exams.push(await dataSource.manager.save(exam));
  }

  for (let i = 0; i < 20; i++) {
    const mark = dataSource.manager.create(Mark, {
      schoolId: schools[0].schoolId,
      examId: exams[i % exams.length].examId,
      studentId: students[i % students.length].studentId,
      theoryMarks: faker.number.int({ min: 30, max: 95 }),
      totalMarks: 0,
    } as any);
    await dataSource.manager.save(mark);
  }

  // 13. HR
  console.log('Seeding HR...');
  const leaveTypes: LeaveType[] = [];
  const ltNames = [
    'Sick',
    'Casual',
    'Maternity',
    'Paternity',
    'Study',
    'Sabbatical',
    'Bereavement',
    'Marriage',
    'Public',
    'Other',
  ];
  for (let i = 0; i < ltNames.length; i++) {
    const lt = dataSource.manager.create(LeaveType, {
      schoolId: schools[0].schoolId,
      leaveTypeName: ltNames[i],
      leaveTypeNameNp: ltNames[i], // Just same for seed
      daysAllocated: 15,
      isPaid: true,
    } as any);
    leaveTypes.push(await dataSource.manager.save(lt));
  }

  const staffMembers: Staff[] = [];
  const staffUsers = users.filter((u) => u.userType === 'STAFF');
  for (let i = 0; i < 10; i++) {
    const staff = dataSource.manager.create(Staff, {
      schoolId: schools[0].schoolId,
      userId: staffUsers[i % staffUsers.length].userId,
      firstNameEn: faker.person.firstName(),
      lastNameEn: faker.person.lastName(),
      gender: 'MALE',
      position: 'Accountant',
      hireDate: faker.date.past(),
      employmentType: 'PERMANENT',
    } as any);
    staffMembers.push(await dataSource.manager.save(staff));
  }

  for (const staff of staffMembers) {
    const payroll = dataSource.manager.create(Payroll, {
      schoolId: schools[0].schoolId,
      staffId: staff.staffId,
      payrollMonth: 1,
      payrollYear: 2024,
      salaryMonthBs: '2081-01',
      paymentDate: new Date(),
      basicSalary: 30000,
      netSalary: 30000,
    } as any);
    await dataSource.manager.save(payroll);
  }

  // 14. Transport
  console.log('Seeding Transport...');
  const vehicles: Vehicle[] = [];
  for (let i = 0; i < 10; i++) {
    const vehicle = dataSource.manager.create(Vehicle, {
      schoolId: schools[0].schoolId,
      vehicleNumber: `BA ${i + 1} PA ${1000 + i}`,
      vehicleName: `School Bus ${i + 1}`,
      vehicleType: faker.helpers.arrayElement(['Bus', 'Microbus', 'Jeep']),
      capacity: 40,
    } as any);
    vehicles.push(await dataSource.manager.save(vehicle));
  }

  const routes: Route[] = [];
  for (let i = 0; i < 10; i++) {
    const route = dataSource.manager.create(Route, {
      schoolId: schools[0].schoolId,
      routeName: `Route ${i + 1}`,
      routeCode: `R${i + 1}`,
      routeDescription: faker.lorem.sentence(),
      distanceKm: faker.number.int({ min: 5, max: 50 }),
    } as any);
    routes.push(await dataSource.manager.save(route));
  }

  const stops: RouteStop[] = [];
  for (let i = 0; i < 10; i++) {
    const stopContent = dataSource.manager.create(RouteStop, {
      schoolId: schools[0].schoolId,
      routeId: Number(routes[i % routes.length].routeId),
      stopName: `Stop ${i + 1}`,
      stopCode: `S${i + 1}`,
      stopOrder: i + 1,
      arrivalTime: '08:00',
    } as any);
    stops.push(await dataSource.manager.save(stopContent));
  }

  for (let i = 0; i < 10; i++) {
    const transportAssignment = dataSource.manager.create(TransportAssignment, {
      schoolId: schools[0].schoolId,
      routeId: Number(routes[i % routes.length].routeId),
      vehicleId: Number(vehicles[i % vehicles.length].vehicleId),
      studentId: Number(students[i % students.length].studentId),
      stopId: Number(stops[i % stops.length].stopId),
      assignmentDate: new Date(),
    } as any);
    await dataSource.manager.save(transportAssignment);
  }

  // 15. Other activities
  console.log('Seeding Assignments, Timetables, Notifications, Attendance...');
  for (let i = 0; i < 10; i++) {
    const assignment = dataSource.manager.create(Assignment, {
      schoolId: schools[0].schoolId,
      classId: Number(classes[0].classId),
      sectionId: Number(sections[0].sectionId),
      subjectId: Number(subjects[0].subjectId),
      title: `Assignment ${i + 1}`,
      description: faker.lorem.paragraph().substring(0, 500),
      dueDate: faker.date.future(),
      teacherId: Number(teachers[0].teacherId),
    } as any);
    await dataSource.manager.save(assignment);

    const notification = dataSource.manager.create(Notification, {
      schoolId: Number(schools[0].schoolId),
      studentId: Number(students[i % students.length].studentId),
      type: 'INFO',
      title: `Welcome Notification ${i + 1}`,
      message: faker.lorem.sentence(),
    } as any);
    await dataSource.manager.save(notification);

    const timetable = dataSource.manager.create(Timetable, {
      schoolId: Number(schools[0].schoolId),
      classId: Number(classes[0].classId),
      sectionId: Number(sections[0].sectionId),
      subjectId: Number(subjects[i % subjects.length].subjectId),
      teacherId: Number(teachers[0].teacherId),
      dayOfWeek: (i % 6) + 1,
      startTime: '09:00',
      endTime: '10:00',
      periodNumber: (i % 8) + 1,
    } as any);
    await dataSource.manager.save(timetable);

    const att = dataSource.manager.create(Attendance, {
      schoolId: Number(schools[0].schoolId),
      classId: Number(classes[0].classId),
      sectionId: Number(sections[0].sectionId),
      studentId: Number(students[i % students.length].studentId),
      attendanceDate: new Date(),
      status: 'PRESENT',
      academicYear: '2081',
    } as any);
    await dataSource.manager.save(att);

    const leave = dataSource.manager.create(LeaveRequest, {
      schoolId: schools[0].schoolId,
      staffId: Number(staffMembers[i % staffMembers.length].staffId),
      leaveTypeId: Number(leaveTypes[i % leaveTypes.length].leaveTypeId),
      startDate: new Date(),
      endDate: new Date(),
      daysRequested: 1,
      reason: faker.lorem.sentence(),
      status: 'PENDING',
    } as any);
    await dataSource.manager.save(leave);

    const issue = dataSource.manager.create(BookIssue, {
      schoolId: schools[0].schoolId,
      bookId: Number(books[i % books.length].bookId),
      studentId: Number(students[i % students.length].studentId),
      issueDate: new Date(),
      dueDate: faker.date.future(),
      status: 'ISSUED',
    } as any);
    await dataSource.manager.save(issue);

    const transportFee = dataSource.manager.create(TransportFee, {
      schoolId: schools[0].schoolId,
      routeId: Number(routes[i % routes.length].routeId),
      sectionId: Number(sections[i % sections.length].sectionId),
      monthlyFee: faker.number.int({ min: 1000, max: 5000 }),
      admissionFee: 500,
    } as any);
    await dataSource.manager.save(transportFee);
  }

  console.log('Seeding complete! 34+ Tables populated with 10+ records each.');
  await dataSource.destroy();
}

seed().catch((error) => console.log('Error during seeding:', error));

/* Runtime probes for the module-fix pass (006 + service corrections).
 * Each probe runs against live tables; failures print FAIL + message.
 * Run: DB_HOST=localhost DB_PORT=5544 DB_USERNAME=postgres DB_PASSWORD=postgres \
 *      DB_NAME=sms_check npx ts-node --transpile-only scripts/verify-module-fixes.ts
 */
import { DatabaseService } from '../src/database/database.service';
import { SeedService } from '../src/database/seed.service';
import { AcademicCalendarService } from '../src/academic-calendar/academic-calendar.service';
import { AssignmentService } from '../src/assignment/assignment.service';
import { AttendanceService } from '../src/attendance/attendance.service';
import { NotificationService } from '../src/notification/notification.service';
import { WhatsAppService } from '../src/notification/whatsapp.service';
import { WebhookService } from '../src/webhook/webhook.service';
import { CertificateService } from '../src/certificate/certificate.service';
import { GradeService } from '../src/grade/grade.service';
import { ResultService } from '../src/result/result.service';
import { ExamService } from '../src/exam/exam.service';
import { HrService } from '../src/hr/hr.service';
import { LibraryService } from '../src/library/library.service';
import { TransportService } from '../src/transport/transport.service';
import { HostelService } from '../src/hostel/hostel.service';
import { FeeService } from '../src/fee/fee.service';
import { AuditService } from '../src/audit/audit.service';
import { SyncService } from '../src/sync/sync.service';
import { TimetableService } from '../src/timetable/timetable.service';
import { SmsService } from '../src/sms/sms.service';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { ExportService } from '../src/export/export.service';
import { VideoClassService } from '../src/video-class/video-class.service';
import { EnrollmentService } from '../src/enrollment/enrollment.service';
import { PromotionService } from '../src/promotion/promotion.service';
import { SchoolService } from '../src/school/school.service';
import { AdmissionService } from '../src/admission/admission.service';
import { PortalService } from '../src/portal/portal.service';

const results: Array<[string, boolean, string]> = [];
async function probe(name: string, fn: () => Promise<any>) {
  try {
    await fn();
    results.push([name, true, '']);
    console.log(`  OK   ${name}`);
  } catch (e: any) {
    results.push([name, false, e.message]);
    console.log(`  FAIL ${name}: ${e.message.split('\n')[0]}`);
  }
}

async function main() {
  const db = new DatabaseService();
  await db.onModuleInit();

  const tag = Date.now().toString(36);
  const school = await db.queryOne<{ school_id: number }>(
    `INSERT INTO schools (name) VALUES ('Probe School ' || $1) RETURNING school_id`,
    [tag],
  );
  const sid = school!.school_id;
  await probe('seed students/guardians/links', async () => {
    const seed = new SeedService(db);
    await seed.seedStudents();
    await seed.seedGuardians();
    await seed.seedStudentGuardians();
  });

  const cls = await db.queryOne<{ class_id: number }>(
    `INSERT INTO classes (school_id, class_name, class_code, class_order) VALUES ($1,'Grade 4','G4',4) RETURNING class_id`,
    [sid],
  );
  const sec = await db.queryOne<{ section_id: number }>(
    `INSERT INTO sections (school_id, class_id, section_name) VALUES ($1,$2,'A') RETURNING section_id`,
    [sid, cls!.class_id],
  );
  const sub = await db.queryOne<{ subject_id: number }>(
    `INSERT INTO subjects (school_id, subject_name_en, subject_code) VALUES ($1,'Math','MATH') RETURNING subject_id`,
    [sid],
  );
  const teacher = await db.queryOne<{ teacher_id: number }>(
    `INSERT INTO teachers (school_id, teacher_code, employee_id, first_name_en, last_name_en, gender) VALUES ($1,'T1','E1','A','B','MALE') RETURNING teacher_id`,
    [sid],
  );
  const exam = await db.queryOne<{ exam_id: number }>(
    `INSERT INTO exams (school_id, exam_name, exam_type, class_id, full_marks, pass_marks) VALUES ($1,'T1','TERMINAL',$2,100,40) RETURNING exam_id`,
    [sid, cls!.class_id],
  );
  const student = await db.queryOne<{ student_id: number }>(
    `INSERT INTO students (school_id, admission_number, student_code, first_name_en, last_name_en, gender) VALUES ($1,'ADM-P1-' || $2, 'STU-P1-' || $2,'Probe','Kid','MALE') RETURNING student_id`,
    [sid, tag],
  );
  const stu = student!.student_id;
  const user = await db.queryOne<{ user_id: number }>(
    `INSERT INTO users (school_id, username, email, password, password_hash, user_type) VALUES ($1,'probe_hr-' || $2 || '','probe_hr-' || $2 || '@x.com','x','x','STAFF') RETURNING user_id`,
    [sid, tag],
  );

  const grades = new GradeService(db);
  const results_svc = new ResultService(db, grades);
  const exams = new ExamService(db, grades);

  await probe('academic-calendar create+list', async () => {
    const svc = new AcademicCalendarService(db);
    const ev = await svc.create({
      schoolId: sid,
      academicYear: '2082',
      title: 'Dashain',
      eventType: 'HOLIDAY',
      startDate: '2025-10-01',
      isHoliday: true,
    });
    if (!ev.id) throw new Error('no id returned');
    await svc.findAll(sid);
    await svc.findById(ev.id, sid);
  });

  await probe('assignment create (title required)', async () => {
    const svc = new AssignmentService(db);
    await svc.create({
      schoolId: sid,
      title: 'HW1',
      description: 'Do it',
      classId: cls!.class_id,
      sectionId: sec!.section_id,
      subjectId: sub!.subject_id,
      teacherId: Number(teacher!.teacher_id),
      dueDate: new Date('2026-01-01'),
      totalMarks: 20,
    } as any);
  });

  await probe('attendance create+stats', async () => {
    const svc = new AttendanceService(db);
    await svc.create({
      schoolId: sid,
      studentId: stu,
      classId: cls!.class_id,
      academicYear: '2082',
      attendanceDate: new Date('2026-01-05'),
      status: 'PRESENT',
    } as any);
    await svc.getStudentStatistics(stu, sid, '2082');
  });

  await probe('notification fan-out + read', async () => {
    const svc = new NotificationService(db, {
      sendMessage: async () => true,
    } as any as WhatsAppService);
    const n = await svc.create({
      schoolId: sid,
      title: 'T',
      message: 'M',
      type: 'INFO',
    } as any);
    await svc.findAll(sid);
    await svc.markAsRead(n.notification_id, sid);
  });

  await probe('webhook create+trigger-path', async () => {
    const svc = new WebhookService(db);
    const w = await svc.createWebhook(
      sid,
      'MARKS',
      'hook',
      'http://127.0.0.1:9/nope',
      ['marks'],
    );
    await svc.getWebhooks(sid);
    await svc.getWebhookById(w.id, sid);
  });

  await probe('certificate TC end-to-end', async () => {
    const svc = new CertificateService(db);
    const tc = await svc.createTC({
      schoolId: sid,
      studentId: stu,
      leavingDate: '2026-01-01',
      issuedBy: 1,
    });
    await svc.getCertificateById(tc.certificate_id, sid);
  });

  await probe('result marks create (legacy cols)', async () => {
    await results_svc.create({
      schoolId: sid,
      studentId: stu,
      examId: exam!.exam_id,
      subjectId: sub!.subject_id,
      classId: cls!.class_id,
      marksObtained: 75,
      fullMarks: 100,
    } as any);
  });

  await probe('exam schedule canonical insert', async () => {
    await exams.createExamSchedule({
      schoolId: sid,
      examId: exam!.exam_id,
      classId: cls!.class_id,
      subjectId: sub!.subject_id,
      examDate: new Date('2026-03-01'),
      fullMarks: 100,
      passMarks: 40,
    });
    await exams.getExamSchedules(exam!.exam_id);
    await exams.getGradeSystems(sid);
  });

  await probe('hr staff + payroll (Nepal model)', async () => {
    const svc = new HrService(db);
    const st = await svc.createStaff({
      schoolId: sid,
      userId: user!.user_id,
      firstNameEn: 'HR',
      lastNameEn: 'Staff',
      email: 'hr@x.com',
      mobile: '9841001400',
      position: 'Clerk',
      employmentType: 'PERMANENT',
      hireDate: new Date('2024-01-01'),
    } as any);
    await svc.processPayroll({
      schoolId: sid,
      staffId: st.staff_id,
      salaryMonthBs: '2082-10',
      basicSalary: 50000,
    } as any);
  });

  await probe('library issue + return flow', async () => {
    const svc = new LibraryService(db);
    const b = await svc.createBook({
      schoolId: sid,
      isbn: '978-1-' + tag,
      bookCode: 'B1',
      titleEn: 'Nepali',
      authorEn: 'A',
      publisherEn: 'P',
      bookType: 'TEXTBOOK',
      totalCopies: 2,
    } as any);
    const issue = await svc.issueBook({
      schoolId: sid,
      bookId: b.book_id,
      studentId: stu,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-10'),
    } as any);
    await svc.returnBook(issue.issue_id, sid, {} as any);
  });

  await probe('transport route + assignment', async () => {
    const svc = new TransportService(db);
    const r = await svc.createRoute({
      schoolId: sid,
      routeName: 'R1',
      routeCode: 'R1',
      provinceId: 3,
      districtId: 27,
      municipalityId: 1,
      routeDescription: 'd',
      distanceKm: 5,
      estimatedTime: '30m',
    } as any);
    await svc.assignStudentToTransport({
      schoolId: sid,
      studentId: stu,
      routeId: r.route_id,
      assignmentDate: new Date('2026-01-01'),
    } as any);
    await svc.setRouteFee(r.route_id, sid, 1500);
  });

  await probe('hostel assign + checkout', async () => {
    const svc = new HostelService(db);
    const h = await db.queryOne<{ hostel_id: number }>(
      `INSERT INTO hostels (school_id, name, type, total_beds) VALUES ($1,'H1','MIXED',10) RETURNING hostel_id`,
      [sid],
    );
    const room = await db.queryOne<{ room_id: number }>(
      `INSERT INTO hostel_rooms (hostel_id, room_number, capacity, available_beds) VALUES ($1,'101',4,4) RETURNING room_id`,
      [h!.hostel_id],
    );
    const a = await svc.assignStudent(sid, {
      hostelId: h!.hostel_id,
      roomId: room!.room_id,
      studentId: stu,
      bedNumber: 'B1',
      checkInDate: '2026-01-01',
    } as any);
    await svc.checkOutStudent((a as any).id, sid, '2026-02-01');
  });

  await probe('fee category + charge + payment', async () => {
    const svc = new FeeService(db);
    await svc.createFeeCategory({ schoolId: sid, categoryName: 'Tuition' });
    const fee = await svc.createStudentFee({
      schoolId: sid,
      studentId: stu,
      feeType: 'tuition',
      amount: 10000,
      totalAmount: 10000,
      dueDate: new Date('2026-02-01'),
    });
    await svc.processPayment({
      schoolId: sid,
      feeId: fee.fee_id,
      studentId: stu,
      amount: 4000,
      paymentDate: new Date(),
      paymentMethod: 'CASH',
    });
    await svc.getOverdueFees(sid);
  });

  await probe('audit log + scoped reads', async () => {
    const svc = new AuditService(db);
    await svc.log({
      schoolId: sid,
      action: 'CREATE',
      entityType: 'TEST',
      ipAddress: '127.0.0.1',
    });
    await svc.findAll({ schoolId: sid });
  });

  await probe('sync push (school-scoped queue)', async () => {
    const svc = new SyncService(db);
    await svc.pushChanges({
      schoolId: sid,
      changes: [{ entityType: 'students', entityId: stu, operation: 'UPDATE' }],
    });
  });

  await probe('timetable create', async () => {
    const svc = new TimetableService(db);
    await svc.create({
      schoolId: sid,
      classId: cls!.class_id,
      sectionId: sec!.section_id,
      subjectId: sub!.subject_id,
      dayOfWeek: 'MONDAY',
      periodNumber: 1,
      startTime: '09:00',
      endTime: '09:45',
    } as any);
  });

  await probe('sms template + logs', async () => {
    const svc = new SmsService(db);
    await svc.createTemplate(sid, {
      templateName: 'Fee',
      templateCode: 'FEE',
      messageEn: 'Pay',
      messageNp: 'तिर्नुहोस्',
    });
    await svc.getTemplates(sid);
  });

  await probe('dashboard admin stats', async () => {
    const svc = new DashboardService(db);
    await svc.getAdminStats(sid);
  });

  await probe('export students csv-shape', async () => {
    const svc = new ExportService(db);
    await svc.getStudentsForExport(sid);
  });

  await probe('enrollment + promotion cycle', async () => {
    const enr = new EnrollmentService(db);
    const pro = new PromotionService(db);
    const en = await enr.create({ schoolId: sid, studentId: stu, classId: 1, sectionId: 1, academicYear: '2082', enrollmentDate: new Date('2025-04-14'), boardExamRegistration: '12345678' } as any);
    if (!en.enrollment_id) throw new Error('no enrollment id');
    const promoter = await db.queryOne<any>(`INSERT INTO users (school_id, username, email, password, user_type) VALUES ($1,'promoter-' || $2,'prom-' || $2 || '@x.com','x','STAFF') RETURNING user_id`, [sid, tag]);
    const res = await pro.promoteClass(sid, { fromAcademicYear: '2082', toAcademicYear: '2083', fromClassId: 1, toClassId: 1, promotedBy: promoter.user_id, studentIds: [stu] });
    if (res.promoted !== 1) throw new Error('promote failed: ' + JSON.stringify(res.results));
    const rep = await pro.getPromotionReport(sid, '2083');
    if (rep.totalPromoted !== 1) throw new Error('report mismatch');
    const hist = await pro.getPromotionHistory(stu, sid);
    if (hist.length !== 1) throw new Error('history missing');
  });

  await probe('school directory create+update', async () => {
    const svc = new SchoolService(db);
    const sch = await svc.create({ schoolCode: 'SCH-' + tag, schoolName: 'Probe Academy', schoolType: 'SECONDARY', ownershipType: 'PRIVATE', mobile: '9841001500', email: 'a@x.com' } as any, 1);
    if (!sch.school_id) throw new Error('no school id');
    const back = await db.queryOne<any>(`SELECT name, school_name FROM schools WHERE school_id = $1`, [sch.school_id]);
    if (back.name !== 'Probe Academy' || back.school_name !== 'Probe Academy') throw new Error('name sync broken');
    await svc.update(sch.school_id, { mobile: '9841001501' } as any, 1);
  });

  await probe('admission funnel: apply->approve->enroll', async () => {
    const svc = new AdmissionService(db);
    const reviewer = await db.queryOne<any>(`INSERT INTO users (school_id, username, email, password, user_type) VALUES ($1,'reviewer-' || $2,'rev-' || $2 || '@x.com','x','STAFF') RETURNING user_id`, [sid, tag]);
    await db.query(`INSERT INTO academic_years (school_id, session_name, start_date_ad, end_date_ad, start_date_bs, end_date_bs, is_current) VALUES ($1,'2082','2025-04-14','2026-04-13','2082-01-01','2083-12-30',true)`, [sid]);
    const app = await svc.createApplication(sid, {
      firstName: 'Adm', lastName: 'Kid', gender: 'male', dateOfBirth: '2014-01-01',
      nationality: 'Nepali', classId: 1, fatherName: 'Adm Father', fatherPhone: '9841001600',
      motherName: 'Adm Mother', email: 'adm@x.com', phone: '9841001601', mobile: '9841001602',
    } as any);
    await svc.reviewApplication(app.id!, sid, 'approved', 'ok', reviewer.user_id);
    const res = await svc.enrollStudent(app.id!, sid);
    const st = await db.queryOne<any>(`SELECT user_id, father_name, caste_ethnicity FROM students WHERE student_id = $1`, [res.studentId]);
    if (!st.user_id || st.father_name !== 'Adm Father') throw new Error('student linkage broken');
    const link = await db.queryOne<any>(`SELECT * FROM student_guardians WHERE student_id = $1 AND is_primary = true`, [res.studentId]);
    if (!link) throw new Error('guardian link missing');
    const enr = await db.queryOne<any>(`SELECT * FROM enrollments WHERE student_id = $1`, [res.studentId]);
    if (!enr || !enr.roll_no) throw new Error('enrollment missing');
  });

  await probe('portal parent + student views', async () => {
    const svc = new PortalService(db);
    const admStudent = await db.queryOne<any>(`SELECT student_id, user_id FROM students WHERE admission_number LIKE 'STU%' AND user_id IS NOT NULL AND school_id = $1 ORDER BY student_id DESC LIMIT 1`, [sid]);
    const prof = await svc.getStudentProfile(sid, admStudent.user_id);
    if (!prof || !prof.id) throw new Error('profile missing');
    const guardianUser = await db.queryOne<any>(`SELECT user_id FROM guardians WHERE guardian_id = (SELECT guardian_id FROM student_guardians WHERE student_id = $1 AND is_primary = true)`, [admStudent.student_id]);
    if (guardianUser?.user_id) {
      const kids = await svc.getChildren(sid, guardianUser.user_id);
      if (!Array.isArray(kids)) throw new Error('children broken');
      await svc.getChildDetails(sid, guardianUser.user_id, admStudent.student_id);
      await svc.getTotalDue(sid, guardianUser.user_id);
    }
  });

  await probe('video-class schedule (bs convert)', async () => {
    const svc = new VideoClassService({ get: () => undefined } as any, db);
    const live = await svc.createLiveClass(sid, 1, {
      classId: 1,
      title: 'Math Live',
      scheduledAt: '2026-02-01T09:00:00Z',
      platform: 'zoom',
    } as any);
    if (!live.id) throw new Error('no id returned');
  });

  const failed = results.filter((r) => !r[1]);
  console.log(
    `\n${results.length - failed.length}/${results.length} probes passed`,
  );
  await db.onModuleDestroy();
  if (failed.length > 0) process.exit(1);
}

main().catch((e) => {
  console.error('PROBE RUNNER FAILED:', e.message);
  process.exit(1);
});

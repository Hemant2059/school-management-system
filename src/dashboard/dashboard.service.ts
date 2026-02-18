import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Student } from '../student/entities/student.entity';
import { Teacher } from '../teacher/entities/teacher.entity';
import { Staff } from '../hr/entities/staff.entity';
import { Section } from '../section/entities/section.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Assignment } from '../assignment/entities/assignment.entity';
import { StudentFee } from '../fee/entities/student-fee.entity';
import { Payroll } from '../hr/entities/payroll.entity';
import { Notification } from '../notification/entities/notification.entity';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { StudentStatsDto } from './dto/student-stats.dto';
import { TeacherStatsDto } from './dto/teacher-stats.dto';
import { AccountantStatsDto } from './dto/accountant-stats.dto';
import { ParentStatsDto, ChildStatsDto } from './dto/parent-stats.dto';
import { Guardian } from '../guardian/entities/guardian.entity';
import { StudentGuardian } from '../guardian/entities/student-guardian.entity';

@Injectable()
export class DashboardService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Teacher)
    private teacherRepository: Repository<Teacher>,
    @InjectRepository(Staff)
    private staffRepository: Repository<Staff>,
    @InjectRepository(Section)
    private sectionRepository: Repository<Section>,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(StudentFee)
    private studentFeeRepository: Repository<StudentFee>,
    @InjectRepository(Payroll)
    private payrollRepository: Repository<Payroll>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(Guardian)
    private guardianRepository: Repository<Guardian>,
    @InjectRepository(StudentGuardian)
    private studentGuardianRepository: Repository<StudentGuardian>,
  ) {}

  async getAdminStats(schoolId: number): Promise<AdminStatsDto> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Parallel execution of raw queries for maximum speed
    const [
      studentsRes,
      teachersRes,
      staffRes,
      sectionsRes,
      genderRes,
      noticesRes,
      attendanceRes,
    ] = await Promise.all([
      this.dataSource.query(
        'SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true',
        [schoolId],
      ),
      this.dataSource.query(
        'SELECT COUNT(*) as count FROM teachers WHERE school_id = $1 AND is_active = true',
        [schoolId],
      ),
      this.dataSource.query(
        'SELECT COUNT(*) as count FROM staff WHERE school_id = $1 AND is_active = true',
        [schoolId],
      ),
      this.dataSource.query(
        'SELECT COUNT(*) as count FROM sections WHERE school_id = $1 AND is_active = true',
        [schoolId],
      ),
      this.dataSource.query(
        `
        SELECT 
          SUM(CASE WHEN gender = 'FEMALE' THEN 1 ELSE 0 END) as female,
          SUM(CASE WHEN gender = 'MALE' THEN 1 ELSE 0 END) as male
        FROM students WHERE school_id = $1 AND is_active = true
      `,
        [schoolId],
      ),
      this.dataSource.query(
        'SELECT COUNT(*) as count FROM notifications WHERE school_id = $1 AND is_active = true',
        [schoolId],
      ),
      this.dataSource.query(
        `
        SELECT COUNT(*) as count 
        FROM attendance_records 
        WHERE school_id = $1 
        AND attendance_date = $2 
        AND status = 'PRESENT'
      `,
        [schoolId, todayStr],
      ),
    ]);

    const totalStudents = parseInt(studentsRes[0].count);
    const todayPresent = parseInt(attendanceRes[0].count);
    const percentage =
      totalStudents > 0 ? (todayPresent / totalStudents) * 100 : 0;

    return {
      totalStudents,
      totalTeachers: parseInt(teachersRes[0].count),
      totalStaff: parseInt(staffRes[0].count),
      totalSections: parseInt(sectionsRes[0].count),
      todayAttendancePercentage: Math.round(percentage * 10) / 10,
      femaleStudents: parseInt(genderRes[0].female || 0),
      maleStudents: parseInt(genderRes[0].male || 0),
      activeNotices: parseInt(noticesRes[0].count),
    };
  }

  async getStudentStats(
    schoolId: number,
    studentId: number,
  ): Promise<StudentStatsDto> {
    const [attendanceStats, assignmentCount, feeStats] = await Promise.all([
      this.dataSource.query(
        `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present
        FROM attendance_records 
        WHERE student_id = $1 AND school_id = $2
      `,
        [studentId, schoolId],
      ),

      this.dataSource.query(
        'SELECT COUNT(*) as count FROM assignments WHERE school_id = $1 AND is_active = true',
        [schoolId],
      ),

      this.dataSource.query(
        `
        SELECT SUM(total_amount) as total FROM student_fees 
        WHERE student_id = $1 AND school_id = $2 AND is_active = true
      `,
        [studentId, schoolId],
      ),
    ]);

    const totalAttendance = parseInt(attendanceStats[0].total || 0);
    const presentDays = parseInt(attendanceStats[0].present || 0);
    const attendancePercentage =
      totalAttendance > 0 ? (presentDays / totalAttendance) * 100 : 0;

    const totalFees = parseFloat(feeStats[0].total || 0);

    return {
      attendancePercentage: Math.round(attendancePercentage * 10) / 10,
      totalAssignments: parseInt(assignmentCount[0].count),
      pendingAssignments: 0,
      totalFees,
      paidFees: 0,
      pendingFees: totalFees,
      recentGpa: 'N/A',
      upcomingExams: 0,
    };
  }

  async getTeacherStats(
    schoolId: number,
    teacherId: number,
  ): Promise<TeacherStatsDto> {
    const [totalAssignmentsGiven] = await Promise.all([
      this.assignmentRepository.count({
        where: { schoolId, teacherId, isActive: true },
      }),
    ]);

    return {
      totalStudents: 0,
      totalAssignmentsGiven,
      pendingGrading: 0,
      todayClasses: 0,
      totalSubjects: 0,
      averageClassAttendance: 0,
    };
  }

  async getAccountantStats(schoolId: number): Promise<AccountantStatsDto> {
    const [feeStats, payrollStats] = await Promise.all([
      this.dataSource.query(
        `
        SELECT 
          SUM(CASE WHEN status != 'PAID' THEN total_amount ELSE 0 END) as pending
        FROM student_fees 
        WHERE school_id = $1 AND is_active = true
      `,
        [schoolId],
      ),

      this.dataSource.query(
        `
        SELECT 
          SUM(CASE WHEN is_paid = true THEN net_salary ELSE 0 END) as paid,
          SUM(CASE WHEN is_paid = false THEN net_salary ELSE 0 END) as pending
        FROM payrolls 
        WHERE school_id = $1
      `,
        [schoolId],
      ),
    ]);

    return {
      todayCollection: 0,
      monthlyCollection: 0,
      totalPendingFees: parseFloat(feeStats[0].pending || 0),
      totalPayrollPaid: parseFloat(payrollStats[0].paid || 0),
      totalPayrollPending: parseFloat(payrollStats[0].pending || 0),
      recentTransactionsCount: 0,
    };
  }

  async getParentStats(
    schoolId: number,
    userId: number,
  ): Promise<ParentStatsDto> {
    const guardian = await this.guardianRepository.findOne({
      where: { userId, schoolId, isActive: true },
    });

    if (!guardian) {
      return { childrenStats: [] };
    }

    const studentGuardians = await this.studentGuardianRepository.find({
      where: { guardianId: guardian.guardianId, schoolId },
      relations: ['student'],
    });

    const childrenStats: ChildStatsDto[] = await Promise.all(
      studentGuardians.map(async (sg) => {
        const student = sg.student;
        const stats = await this.getStudentStats(
          schoolId,
          Number(student.studentId),
        );
        return {
          studentId: Number(student.studentId),
          studentName: student.getFullName('en'),
          stats,
        };
      }),
    );

    return { childrenStats };
  }
}

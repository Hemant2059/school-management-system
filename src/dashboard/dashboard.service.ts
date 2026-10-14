import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { StudentStatsDto } from './dto/student-stats.dto';
import { TeacherStatsDto } from './dto/teacher-stats.dto';
import { AccountantStatsDto } from './dto/accountant-stats.dto';
import { ParentStatsDto, ChildStatsDto } from './dto/parent-stats.dto';

@Injectable()
export class DashboardService {
  constructor(private db: DatabaseService) {}

  async getAdminStats(schoolId: number): Promise<AdminStatsDto> {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    try {
      const [
        studentsRes,
        teachersRes,
        staffRes,
        sectionsRes,
        genderRes,
        noticesRes,
        attendanceRes,
      ] = await Promise.all([
        this.db.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM students WHERE school_id = $1 AND is_active = true',
          [schoolId],
        ),
        this.db.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM teachers WHERE school_id = $1 AND is_active = true',
          [schoolId],
        ),
        this.db.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM staff WHERE school_id = $1 AND is_active = true',
          [schoolId],
        ),
        this.db.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM sections WHERE school_id = $1 AND is_active = true',
          [schoolId],
        ),
        this.db.query<{ female: string; male: string }>(
          `SELECT 
            SUM(CASE WHEN gender = 'FEMALE' THEN 1 ELSE 0 END) as female,
            SUM(CASE WHEN gender = 'MALE' THEN 1 ELSE 0 END) as male
          FROM students WHERE school_id = $1 AND is_active = true`,
          [schoolId],
        ),
        this.db.query<{ count: string }>(
          'SELECT COUNT(*) as count FROM notifications WHERE school_id = $1 AND is_read = false',
          [schoolId],
        ),
        this.db.query<{ count: string }>(
          `SELECT COUNT(*) as count 
          FROM attendance
          WHERE school_id = $1
          AND attendance_date = $2
          AND status = 'PRESENT' AND deleted_at IS NULL`,
          [schoolId, todayStr],
        ),
      ]);

      const totalStudents = parseInt(studentsRes[0]?.count || '0');
      const todayPresent = parseInt(attendanceRes[0]?.count || '0');
      const percentage =
        totalStudents > 0 ? (todayPresent / totalStudents) * 100 : 0;

      return {
        totalStudents,
        totalTeachers: parseInt(teachersRes[0]?.count || '0'),
        totalStaff: parseInt(staffRes[0]?.count || '0'),
        totalSections: parseInt(sectionsRes[0]?.count || '0'),
        todayAttendancePercentage: Math.round(percentage * 10) / 10,
        femaleStudents: parseInt(genderRes[0]?.female || '0'),
        maleStudents: parseInt(genderRes[0]?.male || '0'),
        activeNotices: parseInt(noticesRes[0]?.count || '0'),
      };
    } catch (error) {
      console.error('Dashboard error:', error);
      throw error;
    }
  }

  async getStudentStats(
    schoolId: number,
    studentId: number,
  ): Promise<StudentStatsDto> {
    const [attendanceStats, assignmentCount, feeStats] = await Promise.all([
      this.db.query<{ total: string; present: string }>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present
        FROM attendance
        WHERE student_id = $1 AND school_id = $2 AND deleted_at IS NULL`,
        [studentId, schoolId],
      ),

      this.db.query<{ count: string }>(
        'SELECT COUNT(*) as count FROM assignments WHERE school_id = $1 AND is_active = true',
        [schoolId],
      ),

      this.db.query<{ total: string }>(
        `SELECT SUM(sf.total_amount) as total FROM student_fees sf JOIN students s ON s.student_id = sf.student_id WHERE sf.student_id = $1 AND s.school_id = $2`,
        [studentId, schoolId],
      ),
    ]);

    const totalAttendance = parseInt(attendanceStats[0]?.total || '0');
    const presentDays = parseInt(attendanceStats[0]?.present || '0');
    const attendancePercentage =
      totalAttendance > 0 ? (presentDays / totalAttendance) * 100 : 0;

    const totalFees = parseFloat(feeStats[0]?.total || '0');

    return {
      attendancePercentage: Math.round(attendancePercentage * 10) / 10,
      totalAssignments: parseInt(assignmentCount[0]?.count || '0'),
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
    const [assignmentCountRes] = await Promise.all([
      this.db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM assignments WHERE school_id = $1 AND teacher_id = $2 AND is_active = true`,
        [schoolId, teacherId],
      ),
    ]);

    return {
      totalStudents: 0,
      totalAssignmentsGiven: parseInt(assignmentCountRes[0]?.count || '0'),
      pendingGrading: 0,
      todayClasses: 0,
      totalSubjects: 0,
      averageClassAttendance: 0,
    };
  }

  async getAccountantStats(schoolId: number): Promise<AccountantStatsDto> {
    const [feeStats, payrollStats] = await Promise.all([
      this.db.query<{ pending: string }>(
        `SELECT 
          SUM(CASE WHEN UPPER(sf.status) != 'PAID' THEN sf.total_amount ELSE 0 END) as pending FROM student_fees sf JOIN students s ON s.student_id = sf.student_id WHERE s.school_id = $1`,
        [schoolId],
      ),

      this.db.query<{ paid: string; pending: string }>(
        `SELECT 
          SUM(CASE WHEN is_paid = true THEN net_salary ELSE 0 END) as paid,
          SUM(CASE WHEN is_paid = false THEN net_salary ELSE 0 END) as pending
        FROM payrolls WHERE school_id = $1`,
        [schoolId],
      ),
    ]);

    return {
      todayCollection: 0,
      monthlyCollection: 0,
      totalPendingFees: parseFloat(feeStats[0]?.pending || '0'),
      totalPayrollPaid: parseFloat(payrollStats[0]?.paid || '0'),
      totalPayrollPending: parseFloat(payrollStats[0]?.pending || '0'),
      recentTransactionsCount: 0,
    };
  }

  async getParentStats(
    schoolId: number,
    userId: number,
  ): Promise<ParentStatsDto> {
    const guardian = await this.db.queryOne<{ guardian_id: number }>(
      `SELECT guardian_id FROM guardians WHERE user_id = $1 AND school_id = $2 AND is_active = true`,
      [userId, schoolId],
    );

    if (!guardian) {
      return { childrenStats: [] };
    }

    const studentGuardians = await this.db.query<{ student_id: number }>(
      `SELECT sg.student_id FROM student_guardians sg JOIN guardians g ON g.guardian_id = sg.guardian_id WHERE sg.guardian_id = $1 AND g.school_id = $2 AND sg.is_active = true`,
      [guardian.guardian_id, schoolId],
    );

    const childrenStats: ChildStatsDto[] = await Promise.all(
      studentGuardians.map(async (sg) => {
        const students = await this.db.query<{
          student_id: number;
          first_name_en: string;
          middle_name_en: string;
          last_name_en: string;
        }>(
          `SELECT student_id, first_name_en, middle_name_en, last_name_en FROM students WHERE student_id = $1 AND school_id = $2`,
          [sg.student_id, schoolId],
        );

        const student = students[0];
        if (!student) {
          return {
            studentId: sg.student_id,
            studentName: 'Unknown',
            stats: await this.getStudentStats(schoolId, sg.student_id),
          };
        }

        const stats = await this.getStudentStats(schoolId, sg.student_id);
        const studentName = [
          student.first_name_en,
          student.middle_name_en,
          student.last_name_en,
        ]
          .filter(Boolean)
          .join(' ');

        return {
          studentId: sg.student_id,
          studentName,
          stats,
        };
      }),
    );

    return { childrenStats };
  }
}

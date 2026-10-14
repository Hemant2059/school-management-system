import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface StudentProfile {
  id: number;
  studentCode: string;
  firstNameEn: string;
  firstNameNp: string;
  lastNameEn: string;
  lastNameNp: string;
  dateOfBirth: Date;
  gender: string;
  className: string;
  sectionName: string;
  rollNumber: number;
  profileImage?: string;
}

export interface StudentDashboard {
  profile: StudentProfile;
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    percentage: number;
  };
  upcomingExams: any[];
  pendingAssignments: any[];
  recentMarks: any[];
  feeStatus: {
    totalFee: number;
    paid: number;
    due: number;
  };
}

export interface ParentDashboard {
  children: {
    id: number;
    name: string;
    className: string;
    sectionName: string;
    rollNumber: number;
  }[];
  totalDue: number;
  notifications: any[];
}

@Injectable()
export class PortalService {
  constructor(private databaseService: DatabaseService) {}

  async getStudentDashboard(
    schoolId: number,
    userId: number,
  ): Promise<StudentDashboard> {
    const student = await this.getStudentProfile(schoolId, userId);

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const [
      attendance,
      upcomingExams,
      pendingAssignments,
      recentMarks,
      feeStatus,
    ] = await Promise.all([
      this.getStudentAttendance(schoolId, student.id),
      this.getUpcomingExams(schoolId, student.id),
      this.getPendingAssignments(schoolId, student.id),
      this.getRecentMarks(schoolId, student.id),
      this.getFeeStatus(schoolId, student.id),
    ]);

    return {
      profile: student,
      attendance,
      upcomingExams,
      pendingAssignments,
      recentMarks,
      feeStatus,
    };
  }

  async getStudentProfile(
    schoolId: number,
    userId: number,
  ): Promise<StudentProfile> {
    const query = `
      SELECT
        s.student_id as id,
        s.student_code as "studentCode",
        s.first_name_en as "firstNameEn",
        s.first_name_np as "firstNameNp",
        s.last_name_en as "lastNameEn",
        s.last_name_np as "lastNameNp",
        s.date_of_birth_ad as "dateOfBirth",
        s.gender,
        c.class_name as "className",
        sec.section_name as "sectionName",
        en.roll_no as "rollNumber",
        s.profile_photo_url as "profileImage"
      FROM students s
      LEFT JOIN enrollments en ON en.student_id = s.student_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = en.academic_year_id AND ay.is_current = true
      LEFT JOIN classes c ON en.class_id = c.class_id
      LEFT JOIN sections sec ON en.section_id = sec.section_id
      WHERE s.school_id = $1 AND s.user_id = $2
      LIMIT 1
    `;

    const result = await this.databaseService.query(query, [schoolId, userId]);
    return result[0];
  }

  async getStudentAttendance(
    schoolId: number,
    studentId: number,
  ): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE status = 'present') as "presentDays",
        COUNT(*) FILTER (WHERE status = 'absent') as "absentDays",
        COUNT(*) as "totalDays"
      FROM attendance_records
      WHERE school_id = $1 AND student_id = $2
    `;

    const result = await this.databaseService.query(query, [
      schoolId,
      studentId,
    ]);
    const data = result[0];
    const totalDays = parseInt(data?.totalDays || '0');
    const presentDays = parseInt(data?.presentDays || '0');

    return {
      totalDays,
      presentDays,
      absentDays: parseInt(data?.absentDays || '0'),
      percentage:
        totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
    };
  }

  async getUpcomingExams(schoolId: number, studentId: number): Promise<any[]> {
    const query = `
      SELECT e.exam_id, e.exam_name, e.exam_date, e.exam_date_bs, sub.subject_name
      FROM exams e
      JOIN exam_classes ec ON e.exam_id = ec.exam_id
      JOIN student_enrollments se ON ec.class_id = se.class_id
      JOIN subjects sub ON e.subject_id = sub.subject_id
      WHERE se.student_id = $1 
        AND e.school_id = $2 
        AND e.exam_date > NOW()
      ORDER BY e.exam_date ASC
      LIMIT 5
    `;

    return this.databaseService.query(query, [studentId, schoolId]);
  }

  async getPendingAssignments(
    schoolId: number,
    studentId: number,
  ): Promise<any[]> {
    const query = `
      SELECT a.assignment_id, a.title, a.due_date, a.due_date_bs, sub.subject_name
      FROM assignments a
      JOIN assignment_classes ac ON a.assignment_id = ac.assignment_id
      JOIN student_enrollments se ON ac.class_id = se.class_id
      JOIN subjects sub ON a.subject_id = sub.subject_id
      WHERE se.student_id = $1 
        AND a.school_id = $2 
        AND a.due_date > NOW()
        AND NOT EXISTS (
          SELECT 1 FROM assignment_submissions 
          WHERE assignment_id = a.assignment_id AND student_id = $1
        )
      ORDER BY a.due_date ASC
      LIMIT 5
    `;

    return this.databaseService.query(query, [studentId, schoolId]);
  }

  async getRecentMarks(schoolId: number, studentId: number): Promise<any[]> {
    const query = `
      SELECT m.marks_id, m.obtained_marks, m.total_marks, e.exam_name, sub.subject_name
      FROM marks m
      JOIN exams e ON m.exam_id = e.exam_id
      JOIN subjects sub ON m.subject_id = sub.subject_id
      WHERE m.student_id = $1 AND m.school_id = $2
      ORDER BY m.created_at DESC
      LIMIT 10
    `;

    return this.databaseService.query(query, [studentId, schoolId]);
  }

  async getFeeStatus(schoolId: number, studentId: number): Promise<any> {
    const query = `
      SELECT 
        COALESCE(SUM(sf.total_amount), 0) as "totalFee",
        COALESCE(SUM(sf.paid_amount), 0) as paid
      FROM student_fees sf
      WHERE sf.student_id = $1 AND sf.school_id = $2
    `;

    const result = await this.databaseService.query(query, [
      studentId,
      schoolId,
    ]);
    const data = result[0];
    const totalFee = parseFloat(data?.totalFee || '0');
    const paid = parseFloat(data?.paid || '0');

    return {
      totalFee,
      paid,
      due: totalFee - paid,
    };
  }

  async getParentDashboard(
    schoolId: number,
    userId: number,
  ): Promise<ParentDashboard> {
    const children = await this.getChildren(schoolId, userId);
    const totalDue = await this.getTotalDue(schoolId, userId);

    return {
      children,
      totalDue,
      notifications: [],
    };
  }

  async getChildren(schoolId: number, userId: number): Promise<any[]> {
    const query = `
      SELECT
        s.student_id as id,
        s.first_name_en || ' ' || s.last_name_en as name,
        c.class_name as "className",
        sec.section_name as "sectionName",
        en.roll_no as "rollNumber"
      FROM students s
      JOIN student_guardians sg ON sg.student_id = s.student_id AND sg.is_active = true
      JOIN guardians g ON g.guardian_id = sg.guardian_id
      LEFT JOIN enrollments en ON en.student_id = s.student_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = en.academic_year_id AND ay.is_current = true
      LEFT JOIN classes c ON en.class_id = c.class_id
      LEFT JOIN sections sec ON en.section_id = sec.section_id
      WHERE g.user_id = $1 AND s.school_id = $2
    `;

    return this.databaseService.query(query, [userId, schoolId]);
  }

  async getTotalDue(schoolId: number, userId: number): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(f.total_amount - f.paid_amount), 0) as due
      FROM fees f
      JOIN students s ON s.student_id = f.student_id
      JOIN student_guardians sg ON sg.student_id = s.student_id AND sg.is_active = true
      JOIN guardians g ON g.guardian_id = sg.guardian_id
      WHERE g.user_id = $1 AND f.school_id = $2 AND f.is_active = true
        AND f.is_fully_paid = false
    `;

    const result = await this.databaseService.query(query, [userId, schoolId]);
    return parseFloat(result[0]?.due || '0');
  }

  async getChildDetails(
    schoolId: number,
    userId: number,
    childId: number,
  ): Promise<any> {
    const query = `
      SELECT
        s.student_id as id,
        s.first_name_en || ' ' || s.last_name_en as name,
        s.date_of_birth_ad as "dateOfBirth",
        s.gender,
        c.class_name as "className",
        sec.section_name as "sectionName",
        en.roll_no as "rollNumber"
      FROM students s
      JOIN student_guardians sg ON sg.student_id = s.student_id AND sg.is_active = true
      JOIN guardians g ON g.guardian_id = sg.guardian_id
      LEFT JOIN enrollments en ON en.student_id = s.student_id
      LEFT JOIN academic_years ay ON ay.academic_year_id = en.academic_year_id AND ay.is_current = true
      LEFT JOIN classes c ON en.class_id = c.class_id
      LEFT JOIN sections sec ON en.section_id = sec.section_id
      WHERE g.user_id = $1 AND s.school_id = $2 AND s.student_id = $3
    `;

    const result = await this.databaseService.query(query, [
      userId,
      schoolId,
      childId,
    ]);
    return result[0];
  }
}

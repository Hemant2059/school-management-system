import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface DataExport {
  export_id: number;
  school_id: number | null;
  export_type: string;
  file_name: string | null;
  file_path: string | null;
  format: string;
  filters: Record<string, unknown> | null;
  record_count: number | null;
  export_status: string;
  exported_by: number | null;
  exported_at: Date | null;
  download_url: string | null;
  created_at: Date;
}

export interface CreateExportDto {
  schoolId?: number;
  exportType: string;
  format: string;
  filters?: Record<string, unknown>;
  exportedBy?: number;
}

@Injectable()
export class ExportService {
  constructor(private db: DatabaseService) {}

  async getStudentsForExport(
    schoolId: number,
    academicYear?: string,
    classId?: number,
  ): Promise<any[]> {
    // Canonical placement: enrollments keyed to academic_years sessions.
    let sessionCond = `AND ay.is_current = true`;
    const params: any[] = [schoolId];
    if (academicYear) {
      params.push(academicYear);
      sessionCond = `AND ay.session_name = $${params.length}`;
    }
    let query = `SELECT s.student_id, s.admission_number, s.first_name_en, s.last_name_en, s.first_name_np, s.last_name_np,
                        s.date_of_birth_ad, s.date_of_birth_bs, s.gender, s.caste_ethnicity, s.caste_code,
                        s.birth_certificate_number, s.nin, s.citizenship_number, s.iemis_student_id,
                        s.citizenship_issue_district, s.citizenship_issue_date, s.citizenship_issue_date_bs,
                        s.is_govt_mandated_free_seat, s.is_economically_disadvantaged, s.has_disability, s.disability_type,
                        c.class_name, sec.section_name, en.roll_no AS roll_number, ay.session_name AS academic_year
                 FROM students s
                 LEFT JOIN academic_years ay ON ay.school_id = s.school_id ${sessionCond}
                 LEFT JOIN enrollments en ON en.student_id = s.student_id
                   AND en.academic_year_id = ay.academic_year_id
                 LEFT JOIN classes c ON en.class_id = c.class_id
                 LEFT JOIN sections sec ON en.section_id = sec.section_id
                 WHERE s.school_id = $1 AND s.is_active = true`;

    if (classId) {
      query += ` AND en.class_id = $${params.length + 1}`;
      params.push(classId);
    }

    query += ` ORDER BY en.roll_no, s.first_name_en`;

    return this.db.query(query, params);
  }

  async getTeachersForExport(schoolId: number): Promise<any[]> {
    return this.db.query(
      `SELECT t.teacher_id, t.employee_id, t.first_name_en, t.last_name_en, t.first_name_np, t.last_name_np,
              t.gender, t.date_of_birth, t.date_of_birth_bs, t.highest_qualification, t.specialization, 
              t.personal_mobile, t.personal_email, t.current_status, t.designation, t.department, t.joining_date
       FROM teachers t
       WHERE t.school_id = $1 AND t.is_active = true
       ORDER BY t.first_name_en`,
      [schoolId],
    );
  }

  async getStaffForExport(schoolId: number): Promise<any[]> {
    return this.db.query(
      `SELECT s.staff_id, s.employee_id, s.first_name, s.last_name, s.gender, s.phone, s.email,
              s.department, s.designation, s.employment_type, s.joining_date, s.current_status
       FROM staff s
       WHERE s.school_id = $1 AND s.is_active = true
       ORDER BY s.first_name`,
      [schoolId],
    );
  }

  async getAttendanceForExport(
    schoolId: number,
    academicYear: string,
    classId?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    let query = `SELECT a.attendance_id, a.student_id, s.admission_number, s.first_name_en, s.last_name_en,
                        a.attendance_date, a.attendance_date_bs, a.status, a.remarks,
                        c.class_name, sec.section_name
                 FROM attendance a
                 JOIN students s ON a.student_id = s.student_id
                 LEFT JOIN classes c ON a.class_id = c.class_id
                 LEFT JOIN sections sec ON a.section_id = sec.section_id
                 WHERE a.school_id = $1 AND a.academic_year = $2 AND a.deleted_at IS NULL`;
    const params: any[] = [schoolId, academicYear];

    if (classId) {
      query += ` AND a.class_id = $${params.length + 1}`;
      params.push(classId);
    }

    if (startDate) {
      query += ` AND a.attendance_date >= $${params.length + 1}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND a.attendance_date <= $${params.length + 1}`;
      params.push(endDate);
    }

    query += ` ORDER BY a.attendance_date, s.first_name_en`;

    return this.db.query(query, params);
  }

  async getFeePaymentsForExport(
    schoolId: number,
    academicYear: string,
    classId?: number,
  ): Promise<any[]> {
    let query = `SELECT f.fee_id, f.student_id, s.admission_number, s.first_name_en, s.last_name_en,
                        f.fee_type, f.total_amount, f.discount_amount, f.fine_amount, f.paid_amount,
                        p.payment_date, p.payment_date_bs, p.payment_method, p.transaction_id,
                        c.class_name
                 FROM fees f
                 JOIN students s ON s.student_id = f.student_id
                 LEFT JOIN classes c ON c.class_id = f.class_id
                 LEFT JOIN LATERAL (
                   SELECT * FROM payments WHERE fee_id = f.fee_id ORDER BY payment_date DESC LIMIT 1
                 ) p ON true
                 WHERE f.school_id = $1 AND f.academic_year = $2 AND f.is_active = true`;
    const params: any[] = [schoolId, academicYear];

    if (classId) {
      query += ` AND f.class_id = $${params.length + 1}`;
      params.push(classId);
    }

    query += ` ORDER BY p.payment_date DESC NULLS LAST`;

    return this.db.query(query, params);
  }

  toCSV(data: any[], headers?: string[]): string {
    if (!data || data.length === 0) return '';

    const keys = headers || Object.keys(data[0]);
    const headerRow = keys.join(',');

    const rows = data.map((item) =>
      keys
        .map((key) => {
          const value = item[key];
          if (value === null || value === undefined) return '';
          const stringValue = String(value);
          if (
            stringValue.includes(',') ||
            stringValue.includes('"') ||
            stringValue.includes('\n')
          ) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(','),
    );

    return [headerRow, ...rows].join('\n');
  }

  async exportStudents(
    schoolId: number,
    academicYear?: string,
    classId?: number,
    format: 'csv' | 'json' = 'csv',
  ): Promise<{ data: any; format: string; filename: string }> {
    const students = await this.getStudentsForExport(
      schoolId,
      academicYear,
      classId,
    );

    const filename = `students_${schoolId}_${academicYear || 'all'}_${Date.now()}.${format}`;

    if (format === 'json') {
      return { data: students, format: 'json', filename };
    }

    return { data: this.toCSV(students), format: 'csv', filename };
  }

  async exportTeachers(
    schoolId: number,
    format: 'csv' | 'json' = 'csv',
  ): Promise<{ data: any; format: string; filename: string }> {
    const teachers = await this.getTeachersForExport(schoolId);
    const filename = `teachers_${schoolId}_${Date.now()}.${format}`;

    if (format === 'json') {
      return { data: teachers, format: 'json', filename };
    }

    return { data: this.toCSV(teachers), format: 'csv', filename };
  }

  async exportAttendance(
    schoolId: number,
    academicYear: string,
    classId?: number,
    startDate?: string,
    endDate?: string,
    format: 'csv' | 'json' = 'csv',
  ): Promise<{ data: any; format: string; filename: string }> {
    const attendance = await this.getAttendanceForExport(
      schoolId,
      academicYear,
      classId,
      startDate,
      endDate,
    );
    const filename = `attendance_${schoolId}_${academicYear}_${Date.now()}.${format}`;

    if (format === 'json') {
      return { data: attendance, format: 'json', filename };
    }

    return { data: this.toCSV(attendance), format: 'csv', filename };
  }

  async exportFeePayments(
    schoolId: number,
    academicYear: string,
    classId?: number,
    format: 'csv' | 'json' = 'csv',
  ): Promise<{ data: any; format: string; filename: string }> {
    const payments = await this.getFeePaymentsForExport(
      schoolId,
      academicYear,
      classId,
    );
    const filename = `fee_payments_${schoolId}_${academicYear}_${Date.now()}.${format}`;

    if (format === 'json') {
      return { data: payments, format: 'json', filename };
    }

    return { data: this.toCSV(payments), format: 'csv', filename };
  }

  async exportDEOReport(
    schoolId: number,
    academicYear: string,
    reportType: string,
  ): Promise<{ data: any; filename: string }> {
    if (reportType === 'enrollment') {
      const students = await this.getStudentsForExport(schoolId, academicYear);
      return {
        data: this.toCSV(students),
        filename: `deo_enrollment_${schoolId}_${academicYear}.csv`,
      };
    }

    throw new NotFoundException(`Report type ${reportType} not found`);
  }
}

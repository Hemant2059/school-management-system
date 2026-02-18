import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { Attendance as DbAttendance } from '../database/entities/interfaces';

export interface Attendance {
  attendance_id: number;
  school_id: number;
  student_id: number;
  class_id: number | null;
  section_id: number | null;
  academic_year: string;
  attendance_date: Date;
  attendance_date_bs: string | null;
  status: string;
  session: string | null;
  remarks: string | null;
  check_in_time: string | null;
  check_out_time: string | null;
  biometric_device_id: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
  created_by: number | null;
  updated_by: number | null;
}

@Injectable()
export class AttendanceService {
  constructor(private db: DatabaseService) {}

  async create(
    createDto: CreateAttendanceDto & {
      classId?: number;
      sectionId?: number;
      session?: string;
      attendanceDateBs?: string;
      checkInTime?: string;
      checkOutTime?: string;
      biometricDeviceId?: string;
    },
    userId?: number,
  ): Promise<Attendance> {
    const existing = await this.db.queryOne<Attendance>(
      `SELECT * FROM attendance_records WHERE student_id = $1 AND academic_year = $2 AND attendance_date = $3`,
      [createDto.studentId, createDto.academicYear, createDto.attendanceDate],
    );

    if (existing) {
      throw new BadRequestException(
        'Attendance already marked for this student on this date',
      );
    }

    return this.db.insert<Attendance>(
      `INSERT INTO attendance_records (school_id, student_id, class_id, section_id, academic_year, attendance_date, attendance_date_bs, status, remarks, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.classId || null,
        createDto.sectionId || null,
        createDto.academicYear,
        createDto.attendanceDate,
        createDto.attendanceDateBs || null,
        createDto.status,
        createDto.remarks || null,
        userId || null,
      ],
    );
  }

  async createBulk(bulkDto: any, userId?: number): Promise<Attendance[]> {
    const results: Attendance[] = [];
    for (const dto of bulkDto.records) {
      try {
        const record = await this.create(dto, userId);
        results.push(record);
      } catch (e) {
        // Skip duplicates
      }
    }
    return results;
  }

  async findAll(schoolId: number, query: any): Promise<Attendance[]> {
    const academicYear = query?.academicYear || query?.academic_year;
    if (!academicYear) {
      return [];
    }
    return this.db.query<Attendance>(
      `SELECT * FROM attendance_records WHERE school_id = $1 AND academic_year = $2 ORDER BY attendance_date DESC`,
      [schoolId, academicYear],
    );
  }

  async findOne(id: number, schoolId?: number): Promise<Attendance> {
    const attendance = await this.db.queryOne<Attendance>(
      schoolId
        ? `SELECT * FROM attendance_records WHERE attendance_id = $1 AND school_id = $2`
        : `SELECT * FROM attendance_records WHERE attendance_id = $1`,
      schoolId ? [id, schoolId] : [id],
    );

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${id} not found`);
    }

    return attendance;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateAttendanceDto,
    userId?: number,
  ): Promise<Attendance> {
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      remarks: 'remarks',
      checkInTime: 'check_in_time',
      checkOutTime: 'check_out_time',
      biometricDeviceId: 'biometric_device_id',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateDto[key as keyof UpdateAttendanceDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateDto[key as keyof UpdateAttendanceDto]);
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.query(
        `UPDATE attendance_records SET ${updates.join(', ')}, updated_at = NOW() WHERE attendance_id = $${paramIndex}`,
        params,
      );
    }

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.query(
      `UPDATE attendance_records SET deleted_at = NOW() WHERE attendance_id = $1`,
      [id],
    );
  }

  async findByStudent(
    studentId: number,
    academicYearOrSchoolId: number | string,
    start?: Date,
    end?: Date,
  ): Promise<Attendance[]> {
    // If second param is schoolId (number), use it as schoolId filter
    // Otherwise use it as academicYear
    if (typeof academicYearOrSchoolId === 'number') {
      // Called with (studentId, schoolId, start, end)
      let query = `SELECT * FROM attendance_records WHERE student_id = $1 AND school_id = $2`;
      const params: any[] = [studentId, academicYearOrSchoolId];

      if (start) {
        params.push(start);
        query += ` AND attendance_date >= $${params.length}`;
      }
      if (end) {
        params.push(end);
        query += ` AND attendance_date <= $${params.length}`;
      }

      query += ` ORDER BY attendance_date DESC`;
      return this.db.query<Attendance>(query, params);
    }

    // Original: called with (studentId, academicYear)
    return this.db.query<Attendance>(
      `SELECT * FROM attendance_records WHERE student_id = $1 AND academic_year = $2 ORDER BY attendance_date DESC`,
      [studentId, academicYearOrSchoolId],
    );
  }

  async getStudentStatistics(
    studentId: number,
    academicYearOrSchoolId: string | number,
    academicYear?: string | number,
    start?: Date,
    end?: Date,
  ): Promise<any> {
    const records = await this.findByStudent(studentId, String(academicYear));
    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const leave = records.filter((r) => r.status === 'LEAVE').length;

    return {
      total,
      present,
      absent,
      leave,
      percentage: total > 0 ? ((present / total) * 100).toFixed(2) : '0',
    };
  }

  async getDateRangeStats(
    studentId: number,
    start: Date,
    end: Date,
    academicYear: string,
  ): Promise<any> {
    const records = await this.db.query<Attendance>(
      `SELECT * FROM attendance_records WHERE student_id = $1 AND attendance_date BETWEEN $2 AND $3 AND academic_year = $4`,
      [studentId, start, end, academicYear],
    );

    const present = records.filter((r) => r.status === 'PRESENT').length;
    return { total: records.length, present };
  }

  async getMonthlyReport(
    schoolId: number,
    classId?: number | string,
    sectionId?: number | string,
    nepaliYear?: number | string,
    nepaliMonth?: number | string,
    academicYear?: string,
    start?: Date,
    end?: Date,
  ): Promise<any[]> {
    const year = Number(nepaliYear);
    const month = Number(nepaliMonth);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return this.db.query<any>(
      `SELECT * FROM attendance_records WHERE school_id = $1 AND attendance_date BETWEEN $2 AND $3`,
      [schoolId, startDate, endDate],
    );
  }

  isNepalHoliday(date: Date): boolean {
    const day = date.getDay();
    return day === 0; // Sunday
  }
}

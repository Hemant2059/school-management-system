import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, DataSource } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { GetAttendanceDto } from './dto/get-attendance.dto';
import { NepaliDateUtil } from '../utils/nepali-date.util';
import {
  withBsDates,
  withBsDatesArray,
} from '../utils/response-with-bs-dates.util';

const ATTENDANCE_DATE_KEYS = [
  'attendanceDate',
  'createdAt',
  'updatedAt',
  'deletedAt',
];

@Injectable()
export class AttendanceService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Attendance)
    private attendanceRepository: Repository<Attendance>,
  ) {}

  async create(
    createDto: CreateAttendanceDto,
    userId: number = 1,
  ): Promise<Attendance> {
    // Check if attendance already exists for this student on this date
    // Optimization: Use count instead of findOne for existence check
    const count = await this.attendanceRepository.count({
      where: {
        studentId: createDto.studentId,
        attendanceDate: createDto.attendanceDate,
        classId: createDto.classId,
        schoolId: createDto.schoolId,
        deletedAt: IsNull(),
      },
    });

    if (count > 0) {
      throw new BadRequestException(
        'Attendance already recorded for this student on this date',
      );
    }

    // Convert AD date to BS
    const bsDate = NepaliDateUtil.adToBs(createDto.attendanceDate).bsDate;

    // Use raw SQL insert for performance (optional for single insert, but good practice)
    const result = await this.dataSource.query(
      `INSERT INTO attendance_records (
        school_id, student_id, class_id, section_id, attendance_date, 
        attendance_date_bs, status, academic_year, session, remarks, 
        created_by, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.classId,
        createDto.sectionId,
        createDto.attendanceDate,
        bsDate,
        createDto.status,
        createDto.academicYear,
        createDto.session ?? 'FULL_DAY',
        createDto.remarks,
        userId,
        userId,
      ],
    );

    return withBsDates(result[0], ATTENDANCE_DATE_KEYS);
  }

  async createBulk(
    bulkDto: BulkAttendanceDto,
    userId: number = 1,
  ): Promise<Attendance[]> {
    // Convert AD date to BS (once for all records)
    const bsDate = NepaliDateUtil.adToBs(bulkDto.attendanceDate).bsDate;

    // Prepare bulk insert values
    // Filter duplicates via SQL "ON CONFLICT DO NOTHING" or "NOT EXISTS" check efficiently
    // But for simplicity and speed, we check existence in bulk or trust constraints?
    // Let's use a raw query to insert only non-existing records

    const values: any[] = [];
    const placeholders: string[] = [];
    let paramIndex = 1;

    for (const record of bulkDto.records) {
      placeholders.push(
        `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11})`,
      );
      values.push(
        bulkDto.schoolId,
        record.studentId,
        bulkDto.classId,
        bulkDto.sectionId,
        bulkDto.attendanceDate,
        bsDate,
        record.status,
        bulkDto.academicYear,
        bulkDto.session ?? 'FULL_DAY',
        record.remarks,
        userId,
        userId,
      );
      paramIndex += 12;
    }

    if (values.length === 0) return [];

    // Construct raw bulk insert query
    // Note: TypeORM doesn't support bulk insert with conflict handling easily in standard API
    // Using simple INSERT for now, assuming frontend checks or we catch errors.
    // Ideally we should check existence first or use ON CONFLICT.
    // For now, let's keep it simple: insert all. If uniqueness is enforced by DB, it will fail.
    // If not, we might have duplicates. The previous logic checked one by one which is slow.
    // Optimization: Check for existing records in one query

    const existingRecords = await this.attendanceRepository.find({
      where: {
        schoolId: bulkDto.schoolId,
        classId: bulkDto.classId,
        attendanceDate: bulkDto.attendanceDate,
      },
      select: ['studentId'],
    });

    const existingStudentIds = new Set(existingRecords.map((r) => r.studentId));

    const newRecords = bulkDto.records
      .filter((r) => !existingStudentIds.has(r.studentId))
      .map((record) => ({
        schoolId: bulkDto.schoolId,
        studentId: record.studentId,
        classId: bulkDto.classId,
        sectionId: bulkDto.sectionId,
        attendanceDate: bulkDto.attendanceDate,
        attendanceDateBs: bsDate,
        status: record.status,
        academicYear: bulkDto.academicYear,
        session: bulkDto.session ?? 'FULL_DAY',
        remarks: record.remarks,
        createdBy: userId,
        updatedBy: userId,
      }));

    if (newRecords.length === 0) return [];

    return this.attendanceRepository.save(newRecords);
  }

  async findAll(
    schoolId: number,
    getAttendanceDto: GetAttendanceDto,
  ): Promise<Attendance[]> {
    const query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.schoolId = :schoolId', { schoolId })
      .andWhere('attendance.deletedAt IS NULL');

    if (getAttendanceDto.classId) {
      query.andWhere('attendance.classId = :classId', {
        classId: getAttendanceDto.classId,
      });
    }

    if (getAttendanceDto.sectionId) {
      query.andWhere('attendance.sectionId = :sectionId', {
        sectionId: getAttendanceDto.sectionId,
      });
    }

    if (getAttendanceDto.startDate && getAttendanceDto.endDate) {
      query.andWhere(
        'attendance.attendanceDate BETWEEN :startDate AND :endDate',
        {
          startDate: new Date(getAttendanceDto.startDate),
          endDate: new Date(getAttendanceDto.endDate),
        },
      );
    }

    if (getAttendanceDto.studentId) {
      query.andWhere('attendance.studentId = :studentId', {
        studentId: getAttendanceDto.studentId,
      });
    }

    if (getAttendanceDto.academicYear) {
      query.andWhere('attendance.academicYear = :academicYear', {
        academicYear: getAttendanceDto.academicYear,
      });
    }

    query.orderBy('attendance.attendanceDate', 'DESC');
    const list = await query.getMany();
    return withBsDatesArray(list, ATTENDANCE_DATE_KEYS);
  }

  async findOne(
    id: number,
    schoolId?: number,
  ): Promise<Attendance & Record<string, string>> {
    const where: any = { attendanceId: id, deletedAt: IsNull() };
    if (schoolId) where.schoolId = schoolId;

    const attendance = await this.attendanceRepository.findOne({
      where,
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }

    return withBsDates(attendance, ATTENDANCE_DATE_KEYS);
  }

  async findByStudent(
    studentId: number,
    schoolId: number,
    startDate?: Date,
    endDate?: Date,
  ): Promise<Attendance[]> {
    const query = this.attendanceRepository
      .createQueryBuilder('attendance')
      .where('attendance.studentId = :studentId', { studentId })
      .andWhere('attendance.schoolId = :schoolId', { schoolId })
      .andWhere('attendance.deletedAt IS NULL');

    if (startDate && endDate) {
      query.andWhere(
        'attendance.attendanceDate BETWEEN :startDate AND :endDate',
        {
          startDate,
          endDate,
        },
      );
    }

    query.orderBy('attendance.attendanceDate', 'DESC');
    const list = await query.getMany();
    return withBsDatesArray(list, ATTENDANCE_DATE_KEYS);
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateAttendanceDto,
    userId: number = 1,
  ): Promise<Attendance> {
    const attendance = await this.findOne(id, schoolId);

    if (updateDto.status !== undefined) attendance.status = updateDto.status;
    if (updateDto.remarks !== undefined) attendance.remarks = updateDto.remarks;
    if (updateDto.session !== undefined) attendance.session = updateDto.session;

    attendance.updatedBy = userId;
    const saved = await this.attendanceRepository.save(attendance);
    return withBsDates(saved, ATTENDANCE_DATE_KEYS);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.attendanceRepository.update(id, {
      deletedAt: new Date(),
    });
  }

  // Get attendance statistics for a student
  // Get attendance statistics for a student
  async getStudentStatistics(
    studentId: number,
    schoolId: number,
    academicYear: string,
  ): Promise<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDayDays: number;
    onLeaveDays: number;
    attendancePercentage: number;
  }> {
    const result = await this.dataSource.query(
      `
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'ABSENT' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'HALF_DAY' THEN 1 ELSE 0 END) as half_day,
        SUM(CASE WHEN status = 'ON_LEAVE' THEN 1 ELSE 0 END) as on_leave
      FROM attendance_records
      WHERE student_id = $1 AND school_id = $2 AND academic_year = $3 AND deleted_at IS NULL
    `,
      [studentId, schoolId, academicYear],
    );

    const stats = result[0];
    const totalDays = parseInt(stats.total || 0);
    const presentDays = parseInt(stats.present || 0);
    const absentDays = parseInt(stats.absent || 0);
    const lateDays = parseInt(stats.late || 0);
    const halfDayDays = parseInt(stats.half_day || 0);
    const onLeaveDays = parseInt(stats.on_leave || 0);

    const attendancePercentage =
      totalDays > 0 ? ((presentDays + halfDayDays * 0.5) / totalDays) * 100 : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      halfDayDays,
      onLeaveDays,
      attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
    };
  }

  // Get monthly attendance report (Nepal BS format)
  async getMonthlyReport(
    schoolId: number,
    classId: number,
    sectionId: number,
    nepaliYear: number,
    nepaliMonth: number,
    academicYear: string,
  ): Promise<any> {
    // Convert Nepali month/year range to AD dates
    const startDateBs = `${nepaliYear}-${String(nepaliMonth).padStart(2, '0')}-01`;
    const endDateBs = `${nepaliYear}-${String(nepaliMonth).padStart(2, '0')}-32`; // Let converter handle overflow

    const startDateAd = NepaliDateUtil.bsToAd(startDateBs);
    const endDateAd = NepaliDateUtil.bsToAd(endDateBs);

    // Fetch records sorted by date using raw SQL
    // We can also fetch student names if needed, but the current return structure
    // groups by studentId.
    const records = await this.dataSource.query(
      `
      SELECT * FROM attendance_records
      WHERE school_id = $1
      AND class_id = $2
      AND section_id = $3
      AND academic_year = $4
      AND attendance_date BETWEEN $5 AND $6
      AND deleted_at IS NULL
      ORDER BY attendance_date ASC
    `,
      [schoolId, classId, sectionId, academicYear, startDateAd, endDateAd],
    );

    const studentMap = new Map<number, any[]>();
    records.forEach((record) => {
      // Get or create array for this student
      let studentRecords = studentMap.get(parseInt(record.student_id));
      if (!studentRecords) {
        studentRecords = [];
        studentMap.set(parseInt(record.student_id), studentRecords);
      }
      studentRecords.push(
        withBsDates(record, [
          'attendance_date',
          'created_at',
          'updated_at',
          'deleted_at',
        ]),
      );
    });

    // Format report with Nepali dates
    const report = {
      nepaliMonth: NepaliDateUtil.getMonthName(nepaliMonth, 'en'),
      nepaliMonthNp: NepaliDateUtil.getMonthName(nepaliMonth, 'np'),
      nepaliYear,
      academicYear,
      totalDays: records.length,
      students: Array.from(studentMap.entries()).map(
        ([studentId, attendance]) => ({
          studentId,
          attendance,
          statistics: {
            present: attendance.filter((a) => a.status === 'PRESENT').length,
            absent: attendance.filter((a) => a.status === 'ABSENT').length,
            late: attendance.filter((a) => a.status === 'LATE').length,
            halfDay: attendance.filter((a) => a.status === 'HALF_DAY').length,
          },
        }),
      ),
    };

    return report;
  }

  // Check if a date is a Nepal holiday
  isNepalHoliday(date: Date): boolean {
    const bsDate = NepaliDateUtil.adToBs(date);
    const month = bsDate.bsDateObj.month;
    const day = bsDate.bsDateObj.day;

    // Nepal public holidays (simplified - in production use full calendar)
    const holidays = [
      // Dashain (approx 15 days in Ashoj)
      { month: 6, day: 1, name: 'Dashain Start' },
      { month: 6, day: 15, name: 'Dashain End' },

      // Tihar (5 days in Kartik)
      { month: 7, day: 1, name: 'Tihar Start' },
      { month: 7, day: 5, name: 'Bhai Tika' },

      // Other major holidays
      { month: 0, day: 1, name: 'Nepali New Year (Baisakh 1)' },
      { month: 3, day: 15, name: 'Buddha Jayanti' },
      { month: 8, day: 1, name: 'Maghe Sankranti' },
      { month: 11, day: 1, name: 'Chhat' },
    ];

    return holidays.some(
      (holiday) => holiday.month === month && holiday.day === day,
    );
  }
}

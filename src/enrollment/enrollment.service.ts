import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

export interface Enrollment {
  enrollment_id: number;
  school_id: number;
  student_id: number;
  class_id: number;
  section_id: number | null;
  academic_year: string;
  roll_number: number | null;
  board_exam_registration?: string | null;
  enrollment_date: Date | null;
  enrollment_date_bs: string | null;
  is_current: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// Canonical enrollments row (admission flow): same grain, legacy column
// names (roll_no, enrolled_on_ad). Returned by assignSection below.
export interface CanonicalEnrollment {
  enrollment_id: number;
  school_id: number;
  student_id: number;
  academic_year_id: number;
  class_id: number;
  section_id: number | null;
  roll_no: number;
  status: string;
  enrolled_on_ad: Date | null;
  enrolled_on_bs: string | null;
  created_at: Date;
}

@Injectable()
export class EnrollmentService {
  constructor(private db: DatabaseService) {}

  async create(
    createDto: CreateEnrollmentDto,
    _userId?: number,
  ): Promise<Enrollment> {
    const currentEnrollment = await this.db.queryOne<Enrollment>(
      `SELECT * FROM student_enrollments WHERE student_id = $1 AND school_id = $2 AND is_current = true AND status = 'ACTIVE'`,
      [createDto.studentId, createDto.schoolId],
    );

    if (currentEnrollment) {
      throw new BadRequestException(
        'Student already has an active enrollment. Please update or withdraw first.',
      );
    }

    const requestedRoll =
      createDto.rollNumber !== undefined && /^\d+$/.test(createDto.rollNumber)
        ? parseInt(createDto.rollNumber, 10)
        : null;
    let nextRoll = requestedRoll;
    if (nextRoll === null) {
      const [rollResult] = await this.db.query<{ max_roll: string }>(
        `SELECT MAX(roll_number) as max_roll FROM student_enrollments WHERE school_id = $1 AND class_id = $2 AND academic_year = $3`,
        [createDto.schoolId, createDto.classId, createDto.academicYear],
      );
      nextRoll = parseInt(rollResult?.max_roll || '0', 10) + 1;
    }

    return this.db.insert<Enrollment>(
      `INSERT INTO student_enrollments (school_id, student_id, class_id, section_id, academic_year, roll_number, enrollment_date, is_current, status, board_exam_registration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $9)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.classId,
        createDto.sectionId || null,
        createDto.academicYear,
        nextRoll,
        createDto.enrollmentDate || null,
        createDto.status || 'ACTIVE',
        createDto.boardExamRegistration || null,
      ],
    );
  }

  async findAll(
    schoolId: number,
    studentId?: number,
    academicYear?: string,
  ): Promise<Enrollment[]> {
    if (studentId && academicYear) {
      return this.db.query<Enrollment>(
        `SELECT * FROM student_enrollments WHERE school_id = $1 AND student_id = $2 AND academic_year = $3 ORDER BY roll_number ASC`,
        [schoolId, studentId, academicYear],
      );
    }
    if (academicYear) {
      return this.db.query<Enrollment>(
        `SELECT * FROM student_enrollments WHERE school_id = $1 AND academic_year = $2 ORDER BY roll_number ASC`,
        [schoolId, academicYear],
      );
    }
    return this.db.query<Enrollment>(
      `SELECT * FROM student_enrollments WHERE school_id = $1 AND is_current = true ORDER BY roll_number ASC`,
      [schoolId],
    );
  }

  async findOne(id: number, schoolId?: number): Promise<Enrollment> {
    const enrollment = await this.db.queryOne<Enrollment>(
      schoolId
        ? `SELECT * FROM student_enrollments WHERE enrollment_id = $1 AND school_id = $2`
        : `SELECT * FROM student_enrollments WHERE enrollment_id = $1`,
      schoolId ? [id, schoolId] : [id],
    );

    if (!enrollment) {
      throw new NotFoundException(`Enrollment with ID ${id} not found`);
    }

    return enrollment;
  }

  async findByStudent(
    studentId: number,
    schoolId: number,
  ): Promise<Enrollment[]> {
    return this.db.query<Enrollment>(
      `SELECT * FROM student_enrollments WHERE student_id = $1 AND school_id = $2 ORDER BY academic_year DESC`,
      [studentId, schoolId],
    );
  }

  /**
   * Assigns (or re-assigns) a section on the canonical enrollments row.
   * Sections are created manually by admins; enrollment itself is
   * section-optional. Roll restarts per section (MAX+1 in target).
   */
  async assignSection(
    enrollmentId: number,
    schoolId: number,
    sectionId: number,
  ): Promise<CanonicalEnrollment> {
    const enrollment = await this.db.queryOne<CanonicalEnrollment>(
      `SELECT * FROM enrollments WHERE enrollment_id = $1 AND school_id = $2`,
      [enrollmentId, schoolId],
    );
    if (!enrollment) {
      throw new NotFoundException(
        `Enrollment with ID ${enrollmentId} not found`,
      );
    }
    const section = await this.db.queryOne(
      `SELECT section_id FROM sections WHERE section_id = $1 AND class_id = $2 AND school_id = $3 AND is_active = true`,
      [sectionId, enrollment.class_id, schoolId],
    );
    if (!section) {
      throw new BadRequestException(
        'Section does not belong to this enrollment class/school',
      );
    }
    const rollRow = await this.db.queryOne<{ max_roll: string }>(
      `SELECT COALESCE(MAX(roll_no), 0) as max_roll FROM enrollments
        WHERE academic_year_id = $1 AND class_id = $2 AND section_id = $3`,
      [enrollment.academic_year_id, enrollment.class_id, sectionId],
    );
    const rollNo = parseInt(rollRow?.max_roll || '0', 10) + 1;
    return this.db.insert<CanonicalEnrollment>(
      `UPDATE enrollments SET section_id = $1, roll_no = $2 WHERE enrollment_id = $3 RETURNING *`,
      [sectionId, rollNo, enrollmentId],
    );
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateEnrollmentDto,
    _userId?: number,
  ): Promise<Enrollment> {
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      sectionId: 'section_id',
      status: 'status',
      boardExamRegistration: 'board_exam_registration',
      isCurrent: 'is_current',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateDto[key as keyof UpdateEnrollmentDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateDto[key as keyof UpdateEnrollmentDto]);
      }
    }

    if (updates.length > 0) {
      params.push(id, schoolId);
      await this.db.query(
        `UPDATE student_enrollments SET ${updates.join(', ')}, updated_at = NOW() WHERE enrollment_id = $${paramIndex} AND school_id = $${paramIndex + 1}`,
        params,
      );
    }

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.query(
      `UPDATE student_enrollments SET is_current = false, status = 'WITHDRAWN', deleted_at = NOW() WHERE enrollment_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
  }

  async getCurrentEnrollmentWithDetails(
    id: number,
    schoolId: number,
  ): Promise<any> {
    return this.findOne(id, schoolId);
  }

  async promoteStudent(
    studentId: number,
    schoolId: number,
    newClassId: number,
    academicYear: string | number,
    _newSectionId?: number | string,
    _userId?: number,
  ): Promise<Enrollment> {
    const currentEnrollment = await this.db.queryOne<Enrollment>(
      `SELECT * FROM student_enrollments WHERE student_id = $1 AND school_id = $2 AND is_current = true`,
      [studentId, schoolId],
    );

    if (currentEnrollment) {
      await this.db.query(
        `UPDATE student_enrollments SET is_current = false WHERE enrollment_id = $1`,
        [currentEnrollment.enrollment_id],
      );
    }

    return this.create({
      studentId,
      schoolId,
      classId: newClassId,
      sectionId:
        _newSectionId !== undefined ? Number(_newSectionId) : undefined,
      academicYear: String(academicYear),
      enrollmentDate: new Date(),
    });
  }
}

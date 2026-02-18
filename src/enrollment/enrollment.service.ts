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
  enrollment_date: Date | null;
  enrollment_date_bs: string | null;
  is_current: boolean;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class EnrollmentService {
  constructor(private db: DatabaseService) {}

  async create(
    createDto: CreateEnrollmentDto,
    userId?: number,
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

    const [rollResult] = await this.db.query<{ max_roll: string }>(
      `SELECT MAX(roll_number) as max_roll FROM student_enrollments WHERE class_id = $1 AND academic_year = $2`,
      [createDto.classId, createDto.academicYear],
    );
    const nextRoll = parseInt(rollResult?.max_roll || '0', 10) + 1;

    return this.db.insert<Enrollment>(
      `INSERT INTO student_enrollments (school_id, student_id, class_id, section_id, academic_year, roll_number, enrollment_date, is_current, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, 'ACTIVE')
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.classId,
        createDto.sectionId || null,
        createDto.academicYear,
        nextRoll,
        createDto.enrollmentDate || null,
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

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateEnrollmentDto,
    userId?: number,
  ): Promise<Enrollment> {
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      sectionId: 'section_id',
      rollNumber: 'roll_number',
      status: 'status',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateDto[key as keyof UpdateEnrollmentDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateDto[key as keyof UpdateEnrollmentDto]);
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.query(
        `UPDATE student_enrollments SET ${updates.join(', ')}, updated_at = NOW() WHERE enrollment_id = $${paramIndex}`,
        params,
      );
    }

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.query(
      `UPDATE student_enrollments SET is_current = false, status = 'WITHDRAWN', deleted_at = NOW() WHERE enrollment_id = $1`,
      [id],
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
    newSectionId?: number | string,
    userId?: number,
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
      academicYear: String(academicYear),
      enrollmentDate: new Date(),
    });
  }
}

import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface PromotionRecord {
  promotion_id: number;
  school_id: number;
  student_id: number;
  from_class_id: number;
  to_class_id: number;
  from_academic_year: string;
  to_academic_year: string;
  promotion_status: string;
  previous_roll_number: number;
  new_roll_number: number;
  promoted_by: number;
  promotion_date: Date;
  remarks: string;
  created_at: Date;
}

@Injectable()
export class PromotionService {
  constructor(private db: DatabaseService) {}

  async promoteClass(
    schoolId: number,
    dto: {
      fromAcademicYear: string;
      toAcademicYear: string;
      fromClassId: number;
      toClassId: number;
      toSectionId?: number;
      promotedBy: number;
      promoteAll?: boolean;
      studentIds?: number[];
      promotionStatus?: string;
    },
  ): Promise<{ promoted: number; failed: number; results: any[] }> {
    let students: any[];

    if (dto.promoteAll) {
      students = await this.db.query(
        `SELECT e.*, s.first_name_en, s.last_name_en, s.roll_number as current_roll
         FROM student_enrollments e
         JOIN students s ON e.student_id = s.student_id
         WHERE e.school_id = $1 AND e.class_id = $2 AND e.academic_year = $3 
           AND e.status = 'ACTIVE' AND e.is_current = true`,
        [schoolId, dto.fromClassId, dto.fromAcademicYear],
      );
    } else if (dto.studentIds && dto.studentIds.length > 0) {
      students = await this.db.query(
        `SELECT e.*, s.first_name_en, s.last_name_en, s.roll_number as current_roll
         FROM student_enrollments e
         JOIN students s ON e.student_id = s.student_id
         WHERE e.student_id = ANY($1) AND e.school_id = $2 AND e.class_id = $3 AND e.academic_year = $4
           AND e.status = 'ACTIVE'`,
        [dto.studentIds, schoolId, dto.fromClassId, dto.fromAcademicYear],
      );
    } else {
      throw new BadRequestException(
        'Either promoteAll must be true or studentIds must be provided',
      );
    }

    const results: any[] = [];
    let promoted = 0;
    let failed = 0;

    const nextRollResult = await this.db.queryOne(
      `SELECT COALESCE(MAX(roll_number), 0) as max_roll FROM student_enrollments 
       WHERE school_id = $1 AND class_id = $2 AND academic_year = $3`,
      [schoolId, dto.toClassId, dto.toAcademicYear],
    );
    let nextRoll = parseInt(nextRollResult?.max_roll || '0', 10);

    for (const student of students) {
      try {
        nextRoll++;

        await this.db.query(
          `UPDATE student_enrollments SET is_current = false WHERE student_id = $1 AND school_id = $2`,
          [student.student_id, schoolId],
        );

        await this.db.insert(
          `INSERT INTO student_enrollments (school_id, student_id, class_id, section_id, academic_year, roll_number, enrollment_date, is_current, status)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), true, $7)
           RETURNING *`,
          [
            schoolId,
            student.student_id,
            dto.toClassId,
            dto.toSectionId || null,
            dto.toAcademicYear,
            nextRoll,
            dto.promotionStatus || 'PROMOTED',
          ],
        );

        await this.db.insert(
          `INSERT INTO student_promotions (school_id, student_id, from_class_id, to_class_id, from_academic_year, to_academic_year, promotion_status, previous_roll_number, new_roll_number, promoted_by, promotion_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
          [
            schoolId,
            student.student_id,
            dto.fromClassId,
            dto.toClassId,
            dto.fromAcademicYear,
            dto.toAcademicYear,
            dto.promotionStatus || 'PROMOTED',
            student.current_roll,
            nextRoll,
            dto.promotedBy,
          ],
        );

        results.push({
          studentId: student.student_id,
          name: `${student.first_name_en} ${student.last_name_en}`,
          status: 'SUCCESS',
          newRollNumber: nextRoll,
        });
        promoted++;
      } catch (error) {
        results.push({
          studentId: student.student_id,
          name: `${student.first_name_en} ${student.last_name_en}`,
          status: 'FAILED',
          error: error.message,
        });
        failed++;
      }
    }

    return { promoted, failed, results };
  }

  async demoteClass(
    schoolId: number,
    dto: {
      academicYear: string;
      classId: number;
      studentIds: number[];
      toClassId: number;
      demotedBy: number;
      reason?: string;
    },
  ): Promise<{ demoted: number; results: any[] }> {
    const results: any[] = [];
    let demoted = 0;

    for (const studentId of dto.studentIds) {
      const enrollment = await this.db.queryOne(
        `SELECT * FROM student_enrollments WHERE student_id = $1 AND school_id = $2 AND class_id = $3 AND academic_year = $4 AND status = 'ACTIVE'`,
        [studentId, schoolId, dto.classId, dto.academicYear],
      );

      if (!enrollment) {
        results.push({ studentId, status: 'NOT_FOUND' });
        continue;
      }

      await this.db.query(
        `UPDATE student_enrollments SET is_current = false, status = 'REPEATED' WHERE enrollment_id = $1`,
        [enrollment.enrollment_id],
      );

      const newEnrollment = await this.db.insert(
        `INSERT INTO student_enrollments (school_id, student_id, class_id, section_id, academic_year, roll_number, enrollment_date, is_current, status)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), true, 'REPEATED')
         RETURNING *`,
        [
          schoolId,
          studentId,
          dto.toClassId,
          enrollment.section_id,
          dto.academicYear,
          enrollment.roll_number,
        ],
      );

      await this.db.insert(
        `INSERT INTO student_promotions (school_id, student_id, from_class_id, to_class_id, from_academic_year, to_academic_year, promotion_status, previous_roll_number, new_roll_number, promoted_by, promotion_date, remarks)
         VALUES ($1, $2, $3, $4, $5, $6, 'REPEATED', $7, $8, $9, NOW(), $10)`,
        [
          schoolId,
          studentId,
          dto.classId,
          dto.toClassId,
          dto.academicYear,
          dto.academicYear,
          enrollment.roll_number,
          enrollment.roll_number,
          dto.demotedBy,
          dto.reason,
        ],
      );

      results.push({ studentId, status: 'SUCCESS', newEnrollment });
      demoted++;
    }

    return { demoted, results };
  }

  async getPromotionHistory(
    studentId: number,
    schoolId: number,
  ): Promise<PromotionRecord[]> {
    return this.db.query(
      `SELECT * FROM student_promotions WHERE student_id = $1 AND school_id = $2 ORDER BY promotion_date DESC`,
      [studentId, schoolId],
    );
  }

  async getPromotionReport(
    schoolId: number,
    academicYear: string,
  ): Promise<any> {
    const promoted = await this.db.query(
      `SELECT COUNT(*) as count FROM student_promotions WHERE school_id = $1 AND to_academic_year = $2 AND promotion_status = 'PROMOTED'`,
      [schoolId, academicYear],
    );

    const repeated = await this.db.query(
      `SELECT COUNT(*) as count FROM student_promotions WHERE school_id = $1 AND to_academic_year = $2 AND promotion_status = 'REPEATED'`,
      [schoolId, academicYear],
    );

    const byClass = await this.db.query(
      `SELECT from_class_id, to_class_id, COUNT(*) as count 
       FROM student_promotions WHERE school_id = $1 AND to_academic_year = $2 
       GROUP BY from_class_id, to_class_id`,
      [schoolId, academicYear],
    );

    return {
      academicYear,
      totalPromoted: parseInt(promoted[0]?.count || '0', 10),
      totalRepeated: parseInt(repeated[0]?.count || '0', 10),
      byClass,
    };
  }
}

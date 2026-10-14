import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { GradeService } from '../grade/grade.service';
import { AuditService } from '../audit/audit.service';

export type ResultStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VERIFIED'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'LOCKED';

export interface Mark {
  mark_id: number;
  school_id: number;
  student_id: number;
  exam_id: number;
  subject_id: number;
  class_id?: number;
  section_id?: number;
  academic_year?: string;
  marks_obtained: number;
  full_marks: number;
  theory_marks?: number;
  practical_marks?: number;
  total_marks?: number;
  grade: string | null;
  grade_point: number | null;
  is_submitted: boolean;
  is_verified: boolean;
  is_absent?: boolean;
  status?: ResultStatus;
  submitted_by?: number;
  submitted_at?: Date;
  verified_by?: number;
  verified_at?: Date;
  approved_by?: number;
  approved_at?: Date;
  published_by?: number;
  published_at?: Date;
  locked_at?: Date;
  remarks: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class ResultService {
  constructor(
    private db: DatabaseService,
    private gradeService: GradeService,
    private auditService?: AuditService,
  ) {}

  /**
   * Single total-marks rule used by create/bulk/update: an explicit
   * theory/practical breakdown wins (summed); otherwise the headline
   * marksObtained wins. Absent students score 0. marks_obtained always
   * mirrors the resulting total.
   */
  private computeTotal(input: {
    isAbsent?: boolean;
    marksObtained?: number | null;
    theoryMarks?: number | null;
    practicalMarks?: number | null;
  }): number {
    if (input.isAbsent) return 0;
    if (input.theoryMarks != null || input.practicalMarks != null) {
      return (input.theoryMarks || 0) + (input.practicalMarks || 0);
    }
    return input.marksObtained || 0;
  }

  async create(createDto: {
    schoolId: number;
    studentId: number;
    examId: number;
    subjectId: number;
    classId?: number;
    sectionId?: number;
    academicYear?: string;
    marksObtained: number;
    fullMarks?: number;
    theoryMarks?: number;
    practicalMarks?: number;
    isAbsent?: boolean;
    remarks?: string;
    remarksNp?: string;
  }): Promise<Mark> {
    const fullMarks = createDto.fullMarks || 100;
    const totalMarks = this.computeTotal({
      isAbsent: createDto.isAbsent,
      marksObtained: createDto.marksObtained,
      theoryMarks: createDto.theoryMarks,
      practicalMarks: createDto.practicalMarks,
    });

    const gradeScales = await this.gradeService.findAll(createDto.schoolId);
    const { grade, gradePoint } = this.gradeService.calculateGrade(
      (totalMarks / fullMarks) * 100,
      gradeScales,
    );

    return this.db.insert<Mark>(
      `INSERT INTO marks (school_id, student_id, exam_id, subject_id, class_id, section_id, academic_year, marks_obtained, full_marks, theory_marks, practical_marks, total_marks, grade, grade_point, is_absent, is_submitted, is_verified, is_active, remarks, remarks_np)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, false, false, true, $16, $17)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.examId,
        createDto.subjectId,
        createDto.classId || null,
        createDto.sectionId || null,
        createDto.academicYear || null,
        totalMarks,
        fullMarks,
        createDto.theoryMarks || null,
        createDto.practicalMarks || null,
        totalMarks,
        grade,
        gradePoint,
        createDto.isAbsent || false,
        createDto.remarks || null,
        createDto.remarksNp || null,
      ],
    );
  }

  async createBulk(createDto: {
    schoolId: number;
    examId: number;
    subjectId: number;
    classId?: number;
    marks: {
      studentId: number;
      marksObtained?: number;
      theoryMarks?: number;
      practicalMarks?: number;
      isAbsent?: boolean;
      remarks?: string;
      remarksNp?: string;
    }[];
  }): Promise<Mark[]> {
    const results: Mark[] = [];
    const exam = await this.db.queryOne(
      `SELECT full_marks FROM exams WHERE exam_id = $1`,
      [createDto.examId],
    );
    const fullMarks = exam?.full_marks || 100;
    const gradeScales = await this.gradeService.findAll(createDto.schoolId);

    for (const mark of createDto.marks) {
      const totalMarks = this.computeTotal({
        isAbsent: mark.isAbsent,
        marksObtained: mark.marksObtained,
        theoryMarks: mark.theoryMarks,
        practicalMarks: mark.practicalMarks,
      });
      const percentage = fullMarks > 0 ? (totalMarks / fullMarks) * 100 : 0;
      const { grade, gradePoint } = this.gradeService.calculateGrade(
        percentage,
        gradeScales,
      );

      const result = await this.db.insert<Mark>(
        `INSERT INTO marks (school_id, student_id, exam_id, subject_id, class_id, marks_obtained, full_marks, theory_marks, practical_marks, total_marks, grade, grade_point, is_absent, is_submitted, is_verified, is_active, remarks, remarks_np)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, false, true, $14, $15)
         ON CONFLICT (school_id, student_id, exam_id, subject_id) DO UPDATE SET
           marks_obtained = EXCLUDED.marks_obtained,
           full_marks = EXCLUDED.full_marks,
           theory_marks = EXCLUDED.theory_marks,
           practical_marks = EXCLUDED.practical_marks,
           total_marks = EXCLUDED.total_marks,
           grade = EXCLUDED.grade,
           grade_point = EXCLUDED.grade_point,
           is_absent = EXCLUDED.is_absent,
           remarks = EXCLUDED.remarks,
           remarks_np = EXCLUDED.remarks_np,
           updated_at = NOW()
         RETURNING *`,
        [
          createDto.schoolId,
          mark.studentId,
          createDto.examId,
          createDto.subjectId,
          createDto.classId || null,
          totalMarks,
          fullMarks,
          mark.theoryMarks || null,
          mark.practicalMarks || null,
          totalMarks,
          grade,
          gradePoint,
          mark.isAbsent || false,
          mark.remarks || null,
          mark.remarksNp || null,
        ],
      );
      results.push(result);
    }

    return results;
  }

  async findAll(schoolId: number, examId: number): Promise<Mark[]> {
    return this.db.query<Mark>(
      `SELECT m.*, s.first_name_en, s.last_name_en, s.student_code, sub.subject_name_en
       FROM marks m
       LEFT JOIN students s ON m.student_id = s.student_id
       LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
       WHERE m.school_id = $1 AND m.exam_id = $2 AND m.is_active = true 
       ORDER BY m.student_id, m.subject_id`,
      [schoolId, examId],
    );
  }

  async findByStudent(
    studentId: number,
    schoolId: number,
    academicYear?: string,
  ): Promise<Mark[]> {
    let query = `SELECT m.*, e.exam_name, sub.subject_name_en 
                 FROM marks m
                 LEFT JOIN exams e ON m.exam_id = e.exam_id
                 LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
                 WHERE m.student_id = $1 AND m.school_id = $2 AND m.is_active = true`;
    const params: any[] = [studentId, schoolId];

    if (academicYear) {
      query += ` AND m.academic_year = $3`;
      params.push(academicYear);
    }

    query += ` ORDER BY m.exam_id, m.subject_id`;

    return this.db.query<Mark>(query, params);
  }

  async findOne(id: number): Promise<Mark> {
    const mark = await this.db.queryOne<Mark>(
      `SELECT * FROM marks WHERE mark_id = $1 AND is_active = true`,
      [id],
    );

    if (!mark) {
      throw new NotFoundException(`Mark with ID ${id} not found`);
    }

    return mark;
  }

  async update(
    id: number,
    updateDto: {
      marksObtained?: number;
      theoryMarks?: number;
      practicalMarks?: number;
      fullMarks?: number;
      isAbsent?: boolean;
      remarks?: string;
      remarksNp?: string;
      userId?: number;
    },
  ): Promise<Mark> {
    const mark = await this.findOne(id);

    if (mark.status === 'LOCKED') {
      throw new BadRequestException('Cannot update marks - results are locked');
    }

    const oldValue = {
      marks_obtained: mark.marks_obtained,
      theory_marks: mark.theory_marks,
      practical_marks: mark.practical_marks,
      is_absent: mark.is_absent,
    };

    const fullMarks = updateDto.fullMarks || mark.full_marks;
    // Unified total rule (same as create/bulk): an explicit theory/practical
    // breakdown wins; otherwise the headline marksObtained wins; untouched
    // updates keep the stored total. marks_obtained always mirrors total.
    const touchesMarks =
      updateDto.isAbsent !== undefined ||
      updateDto.marksObtained !== undefined ||
      updateDto.theoryMarks !== undefined ||
      updateDto.practicalMarks !== undefined;
    let totalMarks = mark.total_marks ?? 0;
    let obtainedParam: number | null = null;
    if (touchesMarks) {
      const isAbsent = updateDto.isAbsent ?? mark.is_absent;
      if (isAbsent) {
        totalMarks = 0;
      } else if (
        updateDto.theoryMarks !== undefined ||
        updateDto.practicalMarks !== undefined
      ) {
        totalMarks =
          (updateDto.theoryMarks ?? mark.theory_marks ?? 0) +
          (updateDto.practicalMarks ?? mark.practical_marks ?? 0);
      } else if (updateDto.marksObtained !== undefined) {
        totalMarks = updateDto.marksObtained;
      }
      obtainedParam = totalMarks;
    }

    const gradeScales = await this.gradeService.findAll(mark.school_id);
    const percentage = fullMarks > 0 ? (totalMarks / fullMarks) * 100 : 0;
    const { grade, gradePoint } = this.gradeService.calculateGrade(
      percentage,
      gradeScales,
    );

    await this.db.query(
      `UPDATE marks SET 
        marks_obtained = COALESCE($2, marks_obtained),
        theory_marks = COALESCE($3, theory_marks),
        practical_marks = COALESCE($4, practical_marks),
        total_marks = $5,
        grade = $6,
        grade_point = $7,
        is_absent = COALESCE($8, is_absent),
        remarks = COALESCE($9, remarks),
        remarks_np = COALESCE($10, remarks_np),
        updated_at = NOW()
       WHERE mark_id = $1`,
      [
        id,
        obtainedParam,
        updateDto.theoryMarks ?? null,
        updateDto.practicalMarks ?? null,
        totalMarks,
        grade,
        gradePoint,
        updateDto.isAbsent ?? null,
        updateDto.remarks ?? null,
        updateDto.remarksNp ?? null,
      ],
    );

    if (this.auditService && updateDto.userId) {
      await this.auditService.log({
        schoolId: mark.school_id,
        userId: updateDto.userId,
        action: 'UPDATE',
        entityType: 'marks',
        entityId: id,
        oldValue,
        newValue: {
          marks_obtained: updateDto.marksObtained ?? mark.marks_obtained,
          theory_marks: updateDto.theoryMarks ?? mark.theory_marks,
          practical_marks: updateDto.practicalMarks ?? mark.practical_marks,
          is_absent: updateDto.isAbsent ?? mark.is_absent,
        },
        description: `Marks updated for student ${mark.student_id} in exam ${mark.exam_id}`,
      });
    }

    return this.findOne(id);
  }

  async submit(examId: number): Promise<void> {
    await this.db.query(
      `UPDATE marks SET is_submitted = true, updated_at = NOW() WHERE exam_id = $1`,
      [examId],
    );
  }

  async verify(examId: number): Promise<void> {
    await this.db.query(
      `UPDATE marks SET is_verified = true, updated_at = NOW() WHERE exam_id = $1`,
      [examId],
    );
  }

  async getStudentResult(studentId: number, examId: number): Promise<any> {
    const marks = await this.db.query<Mark>(
      `SELECT m.*, sub.subject_name_en, sub.credit_hours
       FROM marks m
       LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
       WHERE m.student_id = $1 AND m.exam_id = $2 AND m.is_active = true`,
      [studentId, examId],
    );

    if (marks.length === 0) {
      return null;
    }

    const totalMarks = marks.reduce(
      (sum, m) => sum + Number(m.total_marks || 0),
      0,
    );
    const maxMarks = marks.length * 100;
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    const gradeScales = await this.gradeService.findAll(marks[0].school_id);
    const { grade, gradePoint } = this.gradeService.calculateGrade(
      percentage,
      gradeScales,
    );

    return {
      studentId,
      examId,
      marks,
      summary: {
        totalMarks,
        maxMarks,
        percentage: Number(percentage.toFixed(2)),
        grade,
        gradePoint,
        subjectCount: marks.length,
      },
    };
  }

  async getClassResult(
    schoolId: number,
    examId: number,
    classId?: number,
  ): Promise<any[]> {
    let query = `SELECT m.*, s.first_name_en, s.last_name_en, s.student_code, s.roll_number,
                        sub.subject_name_en
                 FROM marks m
                 LEFT JOIN students s ON m.student_id = s.student_id
                 LEFT JOIN subjects sub ON m.subject_id = sub.subject_id
                 WHERE m.school_id = $1 AND m.exam_id = $2 AND m.is_active = true`;
    const params: any[] = [schoolId, examId];

    if (classId) {
      query += ` AND m.class_id = $3`;
      params.push(classId);
    }

    query += ` ORDER BY s.roll_number, m.subject_id`;

    return this.db.query(query, params);
  }

  async calculateGPA(studentId: number, academicYear: string): Promise<number> {
    const owner = await this.db.queryOne<{ school_id: number }>(
      `SELECT school_id FROM students WHERE student_id = $1`,
      [studentId],
    );
    if (!owner) return 0;
    const marks = await this.findByStudent(
      studentId,
      owner.school_id,
      academicYear,
    );

    const subjectGrades = marks
      .filter((m) => m.grade_point !== null)
      .map((m) => ({
        gradePoint: Number(m.grade_point),
        creditHours: 4,
      }));

    return this.gradeService.calculateGPA(subjectGrades);
  }

  async submitMarks(examId: number, userId: number): Promise<void> {
    const exam = await this.db.queryOne<{ result_status: string }>(
      `SELECT result_status FROM exams WHERE exam_id = $1`,
      [examId],
    );

    if (!exam || exam.result_status !== 'DRAFT') {
      throw new BadRequestException('Marks must be in DRAFT status to submit');
    }

    await this.db.query(
      `UPDATE marks SET status = 'SUBMITTED', submitted_by = $2, submitted_at = NOW(), updated_at = NOW() WHERE exam_id = $1`,
      [examId, userId],
    );
  }

  async verifyMarks(examId: number, userId: number): Promise<void> {
    const marks = await this.db.queryOne<{ status: string }>(
      `SELECT status FROM marks WHERE exam_id = $1 LIMIT 1`,
      [examId],
    );

    if (!marks || marks.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Marks must be SUBMITTED before verification',
      );
    }

    await this.db.query(
      `UPDATE marks SET status = 'VERIFIED', verified_by = $2, verified_at = NOW(), updated_at = NOW() WHERE exam_id = $1`,
      [examId, userId],
    );

    await this.db.query(
      `UPDATE exams SET result_status = 'VERIFIED' WHERE exam_id = $1`,
      [examId],
    );
  }

  async approveMarks(examId: number, userId: number): Promise<void> {
    const marks = await this.db.queryOne<{ status: string }>(
      `SELECT status FROM marks WHERE exam_id = $1 LIMIT 1`,
      [examId],
    );

    if (!marks || marks.status !== 'VERIFIED') {
      throw new BadRequestException('Marks must be VERIFIED before approval');
    }

    await this.db.query(
      `UPDATE marks SET status = 'APPROVED', approved_by = $2, approved_at = NOW(), updated_at = NOW() WHERE exam_id = $1`,
      [examId, userId],
    );
  }

  async publishResults(examId: number, userId: number): Promise<void> {
    const marks = await this.db.queryOne<{ status: string }>(
      `SELECT status FROM marks WHERE exam_id = $1 LIMIT 1`,
      [examId],
    );

    if (!marks || marks.status !== 'APPROVED') {
      throw new BadRequestException('Marks must be APPROVED before publishing');
    }

    await this.db.query(
      `UPDATE marks SET status = 'PUBLISHED', published_by = $2, published_at = NOW(), updated_at = NOW() WHERE exam_id = $1`,
      [examId, userId],
    );

    await this.db.query(
      `UPDATE exams SET result_status = 'PUBLISHED', published_at = NOW(), published_by = $2 WHERE exam_id = $1`,
      [examId, userId],
    );
  }

  async lockResults(examId: number): Promise<void> {
    const marks = await this.db.queryOne<{ status: string }>(
      `SELECT status FROM marks WHERE exam_id = $1 LIMIT 1`,
      [examId],
    );

    if (!marks || marks.status !== 'PUBLISHED') {
      throw new BadRequestException('Marks must be PUBLISHED before locking');
    }

    await this.db.query(
      `UPDATE marks SET status = 'LOCKED', locked_at = NOW(), updated_at = NOW() WHERE exam_id = $1`,
      [examId],
    );
  }

  async getExamStatus(
    examId: number,
  ): Promise<{ status: string; counts: Record<string, number> }> {
    const marks = await this.db.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM marks WHERE exam_id = $1 GROUP BY status`,
      [examId],
    );

    const counts: Record<string, number> = {};
    marks.forEach((m) => {
      counts[m.status] = parseInt(m.count, 10);
    });

    const latestStatus = marks.length > 0 ? marks[0].status : 'DRAFT';
    return { status: latestStatus, counts };
  }

  async getMarksHistory(markId: number): Promise<any[]> {
    return this.db.query(`SELECT * FROM marks WHERE mark_id = $1`, [markId]);
  }
}

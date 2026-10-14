import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import {
  Exam as DbExam,
  ExamSchedule,
  Mark,
  ReportCard,
} from '../database/entities/interfaces';
import { GradeService, GradeBand } from '../grade/grade.service';

export interface Exam extends DbExam {
  total_marks?: number;
  passing_marks?: number;
}

@Injectable()
export class ExamService {
  constructor(
    private db: DatabaseService,
    private gradeService: GradeService,
  ) {}

  async create(
    createDto: CreateExamDto & {
      examCode?: string;
      sectionId?: number;
      subjectId: number;
      examDateBs?: string;
      academicYear?: string;
      remarks?: string;
    },
  ): Promise<Exam> {
    return this.db.insert<Exam>(
      `INSERT INTO exams (school_id, exam_name, exam_code, exam_type, class_id, section_id, subject_id, exam_date, exam_date_bs, start_time, end_time, full_marks, pass_marks, is_published, is_active, is_result_published, is_locked, remarks, academic_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, false, true, false, false, $14, $15)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.examName,
        createDto.examCode || null,
        createDto.examType,
        createDto.classId,
        createDto.sectionId || null,
        createDto.subjectId,
        createDto.examDate,
        createDto.examDateBs || null,
        createDto.startTime || null,
        createDto.endTime || null,
        createDto.fullMarks,
        createDto.passMarks,
        createDto.remarks || null,
        createDto.academicYear || null,
      ],
    );
  }

  async findAll(
    schoolId: number,
    classId?: number,
    examType?: string,
  ): Promise<Exam[]> {
    let query = `SELECT * FROM exams WHERE school_id = $1 AND is_active = true`;
    const params: any[] = [schoolId];

    if (classId) {
      params.push(classId);
      query += ` AND class_id = $${params.length}`;
    }
    if (examType) {
      params.push(examType);
      query += ` AND exam_type = $${params.length}`;
    }

    query += ` ORDER BY exam_date DESC`;
    return this.db.query<Exam>(query, params);
  }

  async findOne(id: number, schoolId?: number): Promise<Exam> {
    const exam = await this.db.queryOne<Exam>(
      schoolId
        ? `SELECT * FROM exams WHERE exam_id = $1 AND school_id = $2 AND is_active = true`
        : `SELECT * FROM exams WHERE exam_id = $1 AND is_active = true`,
      schoolId ? [id, schoolId] : [id],
    );

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${id} not found`);
    }

    return exam;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateExamDto,
  ): Promise<Exam> {
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      examName: 'exam_name',
      examCode: 'exam_code',
      examType: 'exam_type',
      examDate: 'exam_date',
      examDateBs: 'exam_date_bs',
      startTime: 'start_time',
      endTime: 'end_time',
      fullMarks: 'full_marks',
      passMarks: 'pass_marks',
      isPublished: 'is_published',
      isResultPublished: 'is_result_published',
      isLocked: 'is_locked',
      remarks: 'remarks',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateDto[key as keyof UpdateExamDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateDto[key as keyof UpdateExamDto]);
      }
    }

    if (updates.length > 0) {
      params.push(id);
      await this.db.query(
        `UPDATE exams SET ${updates.join(', ')}, updated_at = NOW() WHERE exam_id = $${paramIndex}`,
        params,
      );
    }

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.query(
      `UPDATE exams SET is_active = false, deleted_at = NOW() WHERE exam_id = $1`,
      [id],
    );
  }

  async createExamSchedule(createDto: {
    schoolId: number;
    examId: number;
    classId: number;
    subjectId: number;
    examDate: Date;
    examDateBs?: string;
    startTime?: string;
    endTime?: string;
    roomNumber?: string;
    fullMarks: number;
    passMarks?: number;
  }): Promise<ExamSchedule> {
    return this.db.insert<ExamSchedule>(
      `INSERT INTO exam_schedules (exam_id, class_id, subject_id, exam_date_ad, exam_date_bs, start_time, end_time, room_number, full_theory, full_practical, pass_theory, pass_practical, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, 0, true)
       RETURNING *`,
      [
        createDto.examId,
        createDto.classId,
        createDto.subjectId,
        createDto.examDate,
        createDto.examDateBs || null,
        createDto.startTime || null,
        createDto.endTime || null,
        createDto.roomNumber || null,
        createDto.fullMarks,
        createDto.passMarks || null,
      ],
    );
  }

  async getExamSchedules(examId: number): Promise<ExamSchedule[]> {
    return this.db.query<ExamSchedule>(
      `SELECT * FROM exam_schedules WHERE exam_id = $1 AND is_active = true ORDER BY exam_date_ad ASC`,
      [examId],
    );
  }

  async createGradeSystem(createDto: {
    schoolId: number;
    gradeName: string;
    gradeNameNp?: string;
    gradePoints?: number;
    minMark: number;
    maxMark: number;
    remark?: string;
  }): Promise<GradeBand> {
    return this.gradeService.create({
      schoolId: createDto.schoolId,
      gradeName: createDto.gradeName,
      minPercentage: createDto.minMark,
      maxPercentage: createDto.maxMark,
      gradePoint: createDto.gradePoints ?? 0,
      gradeLabel: createDto.remark,
    });
  }

  async getGradeSystems(schoolId: number): Promise<GradeBand[]> {
    return this.gradeService.findAll(schoolId);
  }

  async submitMarks(createDto: {
    schoolId: number;
    examId: number;
    studentId: number;
    theoryMarks?: number;
    practicalMarks?: number;
    totalMarks?: number;
    grade?: string;
    gradePoint?: number;
    gradeNp?: string;
    remarks?: string;
    academicYear?: string;
  }): Promise<Mark> {
    return this.db.insert<Mark>(
      `INSERT INTO marks (school_id, exam_id, student_id, theory_marks, practical_marks, total_marks, grade, academic_year)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (school_id, exam_id, student_id, subject_id) DO UPDATE SET
         theory_marks = EXCLUDED.theory_marks,
         practical_marks = EXCLUDED.practical_marks,
         total_marks = EXCLUDED.total_marks,
         grade = EXCLUDED.grade,
         updated_at = NOW()
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.examId,
        createDto.studentId,
        createDto.theoryMarks || null,
        createDto.practicalMarks || null,
        createDto.totalMarks || null,
        createDto.grade || null,
        createDto.academicYear || null,
      ],
    );
  }

  async getStudentMarks(
    examId: number,
    studentId: number,
  ): Promise<Mark | null> {
    return this.db.queryOne<Mark>(
      `SELECT * FROM marks WHERE exam_id = $1 AND student_id = $2`,
      [examId, studentId],
    );
  }

  async getExamMarks(examId: number): Promise<Mark[]> {
    return this.db.query<Mark>(
      `SELECT * FROM marks WHERE exam_id = $1 ORDER BY student_id`,
      [examId],
    );
  }

  async createReportCard(createDto: {
    schoolId: number;
    studentId: number;
    examId: number;
    academicYear: string;
    totalGpa?: number;
    totalPercentage?: number;
    classPosition?: number;
    sectionPosition?: number;
    principalRemark?: string;
    teacherRemark?: string;
  }): Promise<ReportCard> {
    return this.db.insert<ReportCard>(
      `INSERT INTO report_cards (school_id, student_id, exam_id, academic_year, total_gpa, total_percentage, class_position, section_position, principal_remark, teacher_remark, is_published, generated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, false, NOW())
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.studentId,
        createDto.examId,
        createDto.academicYear,
        createDto.totalGpa || null,
        createDto.totalPercentage || null,
        createDto.classPosition || null,
        createDto.sectionPosition || null,
        createDto.principalRemark || null,
        createDto.teacherRemark || null,
      ],
    );
  }

  async getStudentReportCard(
    studentId: number,
    examId: number,
  ): Promise<ReportCard | null> {
    return this.db.queryOne<ReportCard>(
      `SELECT * FROM report_cards WHERE student_id = $1 AND exam_id = $2`,
      [studentId, examId],
    );
  }
}

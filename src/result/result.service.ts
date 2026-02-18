import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface Mark {
  mark_id: number;
  school_id: number;
  student_id: number;
  exam_id: number;
  subject_id: number;
  marks_obtained: number;
  full_marks: number;
  grade: string | null;
  grade_point: number | null;
  is_submitted: boolean;
  is_verified: boolean;
  remarks: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class ResultService {
  constructor(private db: DatabaseService) {}

  async findAll(schoolId: number, examId: number): Promise<Mark[]> {
    return this.db.query<Mark>(
      `SELECT * FROM marks WHERE school_id = $1 AND exam_id = $2 AND is_active = true ORDER BY student_id ASC`,
      [schoolId, examId],
    );
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
    marksObtained: number,
    grade: string,
    gradePoint: number,
  ): Promise<Mark> {
    await this.findOne(id);

    await this.db.query(
      `UPDATE marks SET marks_obtained = $2, grade = $3, grade_point = $4, updated_at = NOW() WHERE mark_id = $1`,
      [id, marksObtained, grade, gradePoint],
    );

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

  async calculateAndSaveMarks(
    examId: number,
    studentId: number,
    subjectId: number,
    marksObtained: number,
    practicalMarks?: number,
    fullMarksParam?: number,
  ): Promise<Mark> {
    const fullMarks = fullMarksParam || 100;
    const percentage = (marksObtained / fullMarks) * 100;
    let grade = 'NG';
    let gradePoint = 0;

    if (percentage >= 90) {
      grade = 'A+';
      gradePoint = 4.0;
    } else if (percentage >= 80) {
      grade = 'A';
      gradePoint = 3.6;
    } else if (percentage >= 70) {
      grade = 'B+';
      gradePoint = 3.2;
    } else if (percentage >= 60) {
      grade = 'B';
      gradePoint = 2.8;
    } else if (percentage >= 50) {
      grade = 'C+';
      gradePoint = 2.4;
    } else if (percentage >= 40) {
      grade = 'C';
      gradePoint = 2.0;
    } else if (percentage >= 35) {
      grade = 'D';
      gradePoint = 1.6;
    }

    return this.update(studentId, marksObtained, grade, gradePoint);
  }

  async generateReportCard(
    studentId: number,
    examId: number,
    academicYear?: string,
  ): Promise<any> {
    const marks = await this.findAll(0, examId);
    return { studentId, examId, marks, message: 'Report card generated' };
  }

  async getStudentResults(studentId: number, schoolId: number): Promise<any[]> {
    return this.db.query<any>(
      `SELECT * FROM marks WHERE student_id = $1 AND school_id = $2 AND is_active = true`,
      [studentId, schoolId],
    );
  }
}

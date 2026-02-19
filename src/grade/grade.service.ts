import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface GradeScale {
  grade_scale_id: number;
  school_id: number;
  grade_name: string;
  min_percentage: number;
  max_percentage: number;
  grade_point: number;
  grade_label: string;
  is_active: boolean;
  description: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class GradeService {
  constructor(private db: DatabaseService) {}

  async create(createDto: {
    schoolId: number;
    gradeName: string;
    minPercentage: number;
    maxPercentage: number;
    gradePoint: number;
    gradeLabel?: string;
    description?: string;
  }): Promise<GradeScale> {
    const existing = await this.db.queryOne<GradeScale>(
      `SELECT * FROM grade_scales WHERE school_id = $1 AND grade_name = $2 AND is_active = true`,
      [createDto.schoolId, createDto.gradeName],
    );

    if (existing) {
      throw new BadRequestException(
        `Grade ${createDto.gradeName} already exists in this school`,
      );
    }

    return this.db.insert<GradeScale>(
      `INSERT INTO grade_scales (school_id, grade_name, min_percentage, max_percentage, grade_point, grade_label, description, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.gradeName,
        createDto.minPercentage,
        createDto.maxPercentage,
        createDto.gradePoint,
        createDto.gradeLabel || null,
        createDto.description || null,
      ],
    );
  }

  async findAll(schoolId: number): Promise<GradeScale[]> {
    return this.db.query<GradeScale>(
      `SELECT * FROM grade_scales WHERE school_id = $1 AND is_active = true ORDER BY min_percentage DESC`,
      [schoolId],
    );
  }

  async findOne(id: number, schoolId: number): Promise<GradeScale> {
    const gradeScale = await this.db.queryOne<GradeScale>(
      `SELECT * FROM grade_scales WHERE grade_scale_id = $1 AND school_id = $2 AND is_active = true`,
      [id, schoolId],
    );

    if (!gradeScale) {
      throw new NotFoundException(`Grade scale with ID ${id} not found`);
    }

    return gradeScale;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: {
      gradeName?: string;
      minPercentage?: number;
      maxPercentage?: number;
      gradePoint?: number;
      gradeLabel?: string;
      description?: string;
    },
  ): Promise<GradeScale> {
    const gradeScale = await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [id, schoolId];
    let paramIndex = 3;

    if (updateDto.gradeName !== undefined) {
      updates.push(`grade_name = $${paramIndex++}`);
      params.push(updateDto.gradeName);
    }
    if (updateDto.minPercentage !== undefined) {
      updates.push(`min_percentage = $${paramIndex++}`);
      params.push(updateDto.minPercentage);
    }
    if (updateDto.maxPercentage !== undefined) {
      updates.push(`max_percentage = $${paramIndex++}`);
      params.push(updateDto.maxPercentage);
    }
    if (updateDto.gradePoint !== undefined) {
      updates.push(`grade_point = $${paramIndex++}`);
      params.push(updateDto.gradePoint);
    }
    if (updateDto.gradeLabel !== undefined) {
      updates.push(`grade_label = $${paramIndex++}`);
      params.push(updateDto.gradeLabel);
    }

    if (updates.length === 0) {
      return gradeScale;
    }

    await this.db.query(
      `UPDATE grade_scales SET ${updates.join(', ')} WHERE grade_scale_id = $1 AND school_id = $2`,
      params,
    );

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.query(
      `UPDATE grade_scales SET is_active = false, deleted_at = NOW() WHERE grade_scale_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
  }

  calculateGrade(
    marks: number,
    gradeScales: GradeScale[],
  ): { grade: string; gradePoint: number; gradeLabel: string } {
    const sortedScales = [...gradeScales].sort(
      (a, b) => b.min_percentage - a.min_percentage,
    );

    for (const scale of sortedScales) {
      if (marks >= scale.min_percentage && marks <= scale.max_percentage) {
        return {
          grade: scale.grade_name,
          gradePoint: Number(scale.grade_point),
          gradeLabel: scale.grade_label,
        };
      }
    }

    return { grade: 'N/A', gradePoint: 0, gradeLabel: 'Not Graded' };
  }

  calculateGPA(
    subjectGrades: { gradePoint: number; creditHours: number }[],
  ): number {
    if (subjectGrades.length === 0) return 0;

    let totalPoints = 0;
    let totalCredits = 0;

    for (const subject of subjectGrades) {
      totalPoints += subject.gradePoint * subject.creditHours;
      totalCredits += subject.creditHours;
    }

    return totalCredits > 0
      ? Number((totalPoints / totalCredits).toFixed(2))
      : 0;
  }

  async getOrCreateDefaultGradeScales(schoolId: number): Promise<GradeScale[]> {
    const existing = await this.findAll(schoolId);

    if (existing.length > 0) {
      return existing;
    }

    const defaultScales = [
      {
        grade_name: 'A+',
        min_percentage: 90,
        max_percentage: 100,
        grade_point: 4.0,
        grade_label: 'Outstanding',
      },
      {
        grade_name: 'A',
        min_percentage: 80,
        max_percentage: 89,
        grade_point: 3.6,
        grade_label: 'Excellent',
      },
      {
        grade_name: 'B+',
        min_percentage: 70,
        max_percentage: 79,
        grade_point: 3.2,
        grade_label: 'Very Good',
      },
      {
        grade_name: 'B',
        min_percentage: 60,
        max_percentage: 69,
        grade_point: 2.8,
        grade_label: 'Good',
      },
      {
        grade_name: 'C+',
        min_percentage: 50,
        max_percentage: 59,
        grade_point: 2.4,
        grade_label: 'Satisfactory',
      },
      {
        grade_name: 'C',
        min_percentage: 40,
        max_percentage: 49,
        grade_point: 2.0,
        grade_label: 'Acceptable',
      },
      {
        grade_name: 'D',
        min_percentage: 30,
        max_percentage: 39,
        grade_point: 1.6,
        grade_label: 'Partial Achievement',
      },
      {
        grade_name: 'E',
        min_percentage: 0,
        max_percentage: 29,
        grade_point: 0.0,
        grade_label: 'Insufficient',
      },
    ];

    for (const scale of defaultScales) {
      await this.db.insert(
        `INSERT INTO grade_scales (school_id, grade_name, min_percentage, max_percentage, grade_point, grade_label, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true)`,
        [
          schoolId,
          scale.grade_name,
          scale.min_percentage,
          scale.max_percentage,
          scale.grade_point,
          scale.grade_label,
        ],
      );
    }

    return this.findAll(schoolId);
  }
}

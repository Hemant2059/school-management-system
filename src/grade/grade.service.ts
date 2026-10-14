import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/** Canonical scale header (grade_scales). NULL school_id = national template. */
export interface GradeScaleHeader {
  scale_id: number;
  school_id: number | null;
  scale_code: string;
  scale_name: string;
  is_default: boolean;
  is_active: boolean;
}

/** One band (grade_scale_lines). This is what findAll returns. */
export interface GradeBand {
  line_id: number;
  scale_id: number;
  grade: string;
  grade_np: string | null;
  grade_point: number;
  min_percent: number;
  max_percent: number;
  remark: string | null;
}

/** Backwards-compatible alias: consumers treat bands as "scales". */
export type GradeScale = GradeBand;

const NEB_TEMPLATE_CODE = 'NEB-2078';

/** Bands are closed to the NEB set (see chk_grade_name). */
const ALLOWED_GRADES = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'NG'];

function assertBandDto(dto: {
  gradeName?: string;
  minPercentage?: number;
  maxPercentage?: number;
  gradePoint?: number;
}): void {
  if (dto.gradeName !== undefined && !ALLOWED_GRADES.includes(dto.gradeName)) {
    throw new BadRequestException(
      `Grade must be one of ${ALLOWED_GRADES.join(', ')}`,
    );
  }
  const lo = dto.minPercentage;
  const hi = dto.maxPercentage;
  if (lo !== undefined && (lo < 0 || lo > 100)) {
    throw new BadRequestException('minPercentage must be between 0 and 100');
  }
  if (hi !== undefined && (hi < 0 || hi > 100)) {
    throw new BadRequestException('maxPercentage must be between 0 and 100');
  }
  if (lo !== undefined && hi !== undefined && lo > hi) {
    throw new BadRequestException(
      'minPercentage cannot be greater than maxPercentage',
    );
  }
  if (
    dto.gradePoint !== undefined &&
    (dto.gradePoint < 0 || dto.gradePoint > 4)
  ) {
    throw new BadRequestException('gradePoint must be between 0 and 4.0');
  }
}

@Injectable()
export class GradeService {
  constructor(private db: DatabaseService) {}

  /** School default scale id, falling back to the national template. */
  private async resolveScaleId(schoolId: number): Promise<number | null> {
    const own = await this.db.queryOne<{ scale_id: number }>(
      `SELECT scale_id FROM grade_scales
        WHERE school_id = $1 AND is_default AND is_active
        ORDER BY scale_id LIMIT 1`,
      [schoolId],
    );
    if (own) return own.scale_id;
    const template = await this.db.queryOne<{ scale_id: number }>(
      `SELECT scale_id FROM grade_scales
        WHERE school_id IS NULL AND scale_code = $1 AND is_active LIMIT 1`,
      [NEB_TEMPLATE_CODE],
    );
    return template?.scale_id ?? null;
  }

  /** Bands of the school's effective scale, highest band first. */
  async findAll(schoolId: number): Promise<GradeBand[]> {
    const scaleId = await this.resolveScaleId(schoolId);
    if (scaleId === null) return [];
    return this.db.query<GradeBand>(
      `SELECT line_id, scale_id, grade, grade_np, grade_point,
              min_percent, max_percent, remark
         FROM grade_scale_lines WHERE scale_id = $1
         ORDER BY min_percent DESC`,
      [scaleId],
    );
  }

  async findOne(id: number, schoolId: number): Promise<GradeBand> {
    const band = await this.db.queryOne<GradeBand>(
      `SELECT l.line_id, l.scale_id, l.grade, l.grade_np, l.grade_point,
              l.min_percent, l.max_percent, l.remark
         FROM grade_scale_lines l JOIN grade_scales s ON s.scale_id = l.scale_id
        WHERE l.line_id = $1 AND s.school_id = $2 AND s.is_active`,
      [id, schoolId],
    );
    if (!band) {
      throw new NotFoundException(`Grade band with ID ${id} not found`);
    }
    return band;
  }

  /** Owning (writable) school scale; national template rows are read-only. */
  private async requireOwnScaleId(schoolId: number): Promise<number> {
    const own = await this.db.queryOne<{ scale_id: number }>(
      `SELECT scale_id FROM grade_scales
        WHERE school_id = $1 AND is_default AND is_active
        ORDER BY scale_id LIMIT 1`,
      [schoolId],
    );
    if (own) return own.scale_id;
    const created = await this.db.insert<{ scale_id: number }>(
      `INSERT INTO grade_scales (school_id, scale_code, scale_name, is_default, is_active)
       VALUES ($1, 'CUSTOM', 'School custom scale', true, true)
       RETURNING scale_id`,
      [schoolId],
    );
    return created.scale_id;
  }

  async create(createDto: {
    schoolId: number;
    gradeName: string;
    minPercentage: number;
    maxPercentage: number;
    gradePoint: number;
    gradeLabel?: string;
    description?: string;
    remarkNp?: string;
  }): Promise<GradeBand> {
    assertBandDto(createDto);
    const scaleId = await this.requireOwnScaleId(createDto.schoolId);
    const existing = await this.db.queryOne<GradeBand>(
      `SELECT * FROM grade_scale_lines WHERE scale_id = $1 AND grade = $2`,
      [scaleId, createDto.gradeName],
    );
    if (existing) {
      throw new BadRequestException(
        `Grade ${createDto.gradeName} already exists in this school`,
      );
    }
    // Overlaps beyond touching boundaries are rejected by trg_grade_band.
    return this.db.insert<GradeBand>(
      `INSERT INTO grade_scale_lines
         (scale_id, grade, grade_point, min_percent, max_percent, remark, remark_np)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING line_id, scale_id, grade, grade_np, grade_point,
                 min_percent, max_percent, remark`,
      [
        scaleId,
        createDto.gradeName,
        createDto.gradePoint,
        createDto.minPercentage,
        createDto.maxPercentage,
        createDto.gradeLabel ?? createDto.description ?? null,
        createDto.remarkNp || null,
      ],
    );
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
      remarkNp?: string;
    },
  ): Promise<GradeBand> {
    assertBandDto(updateDto);
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [id];
    let paramIndex = 2;
    if (updateDto.gradeName !== undefined) {
      updates.push(`grade = $${paramIndex++}`);
      params.push(updateDto.gradeName);
    }
    if (updateDto.minPercentage !== undefined) {
      updates.push(`min_percent = $${paramIndex++}`);
      params.push(updateDto.minPercentage);
    }
    if (updateDto.maxPercentage !== undefined) {
      updates.push(`max_percent = $${paramIndex++}`);
      params.push(updateDto.maxPercentage);
    }
    if (updateDto.gradePoint !== undefined) {
      updates.push(`grade_point = $${paramIndex++}`);
      params.push(updateDto.gradePoint);
    }
    const remark = updateDto.gradeLabel ?? updateDto.description;
    if (remark !== undefined) {
      updates.push(`remark = $${paramIndex++}`);
      params.push(remark);
    }
    if (updateDto.remarkNp !== undefined) {
      updates.push(`remark_np = $${paramIndex++}`);
      params.push(updateDto.remarkNp || null);
    }
    if (updates.length === 0) {
      return this.findOne(id, schoolId);
    }

    // Scope the write to the school's own scale (template is read-only).
    await this.db.query(
      `UPDATE grade_scale_lines l SET ${updates.join(', ')}
         FROM grade_scales s
        WHERE l.line_id = $1 AND s.scale_id = l.scale_id
          AND s.school_id = $${paramIndex}`,
      [...params, schoolId],
    );
    return this.findOne(id, schoolId);
  }

  /** Hard-deletes a band (config data; no is_active on lines). */
  async remove(id: number, schoolId: number): Promise<void> {
    const band = await this.findOne(id, schoolId);
    await this.db.query(
      `DELETE FROM grade_scale_lines WHERE line_id = $1 AND scale_id = $2`,
      [id, band.scale_id],
    );
  }

  /**
   * Percent -> band. Boundary scores deterministically yield the higher band
   * (bands ordered by min DESC; top band includes 100).
   */
  calculateGrade(
    marks: number,
    gradeScales: GradeBand[],
  ): { grade: string; gradePoint: number; remark: string | null } {
    const sorted = [...gradeScales].sort(
      (a, b) => Number(b.min_percent) - Number(a.min_percent),
    );
    for (const band of sorted) {
      const lo = Number(band.min_percent);
      const hi = Number(band.max_percent);
      if (marks >= lo && (marks < hi || marks === 100)) {
        return {
          grade: band.grade,
          gradePoint: Number(band.grade_point),
          remark: band.remark,
        };
      }
    }
    return { grade: 'NG', gradePoint: 0, remark: 'Not Graded' };
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

  /**
   * Returns the school's effective bands, cloning the national NEB-2078
   * template when the school has no usable scale. Never creates a second
   * default: empty own scales are filled in place, and adoption only happens
   * when no default exists.
   */
  async getOrCreateDefaultGradeScales(schoolId: number): Promise<GradeBand[]> {
    const bandsOf = (scaleId: number) =>
      this.db.query<GradeBand>(
        `SELECT line_id, scale_id, grade, grade_np, grade_point,
                min_percent, max_percent, remark
           FROM grade_scale_lines WHERE scale_id = $1
           ORDER BY min_percent DESC`,
        [scaleId],
      );

    const own = await this.db.queryOne<{ scale_id: number }>(
      `SELECT scale_id FROM grade_scales
        WHERE school_id = $1 AND is_default AND is_active
        ORDER BY scale_id LIMIT 1`,
      [schoolId],
    );
    if (own) {
      const bands = await bandsOf(own.scale_id);
      if (bands.length > 0) return bands;
      // Own default exists but is empty: fill it from the template in place.
      const template = await this.db.queryOne<{ scale_id: number }>(
        `SELECT scale_id FROM grade_scales
          WHERE school_id IS NULL AND scale_code = $1 AND is_active LIMIT 1`,
        [NEB_TEMPLATE_CODE],
      );
      if (template) {
        await this.db.query(
          `INSERT INTO grade_scale_lines
             (scale_id, grade, grade_np, grade_point, min_percent, max_percent, remark)
           SELECT $1, grade, grade_np, grade_point, min_percent, max_percent, remark
             FROM grade_scale_lines WHERE scale_id = $2
           ON CONFLICT (scale_id, grade) DO NOTHING`,
          [own.scale_id, template.scale_id],
        );
        return bandsOf(own.scale_id);
      }
      return [];
    }

    // No own scale at all: create the NEB-2078 default and clone the template.
    return this.db.transaction(async (client) => {
      const header = await client.query(
        `INSERT INTO grade_scales (school_id, scale_code, scale_name, is_default, is_active)
         VALUES ($1, 'NEB-2078', 'NEB Letter Grading Guideline 2078', true, true)
         ON CONFLICT (school_id, scale_code)
         DO UPDATE SET is_default = true, is_active = true
         RETURNING scale_id`,
        [schoolId],
      );
      const newScaleId = header.rows[0].scale_id as number;
      const template = await client.query(
        `SELECT scale_id FROM grade_scales
          WHERE school_id IS NULL AND scale_code = $1 AND is_active LIMIT 1`,
        [NEB_TEMPLATE_CODE],
      );
      if (template.rows[0]) {
        await client.query(
          `INSERT INTO grade_scale_lines
             (scale_id, grade, grade_np, grade_point, min_percent, max_percent, remark)
           SELECT $1, grade, grade_np, grade_point, min_percent, max_percent, remark
             FROM grade_scale_lines WHERE scale_id = $2
           ON CONFLICT (scale_id, grade) DO NOTHING`,
          [newScaleId, template.rows[0].scale_id],
        );
      }
      const rows = await client.query(
        `SELECT line_id, scale_id, grade, grade_np, grade_point,
                min_percent, max_percent, remark
           FROM grade_scale_lines WHERE scale_id = $1
           ORDER BY min_percent DESC`,
        [newScaleId],
      );
      return rows.rows as GradeBand[];
    });
  }
}

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

export interface Subject {
  subject_id: number;
  school_id: number;
  subject_code: string;
  subject_name_en: string;
  subject_name_np: string | null;
  subject_type: string;
  is_optional: boolean;
  credit_hours: number | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

@Injectable()
export class SubjectService {
  constructor(private db: DatabaseService) {}

  async create(createDto: CreateSubjectDto): Promise<Subject> {
    const existing = await this.db.queryOne<Subject>(
      `SELECT * FROM subjects WHERE subject_code = $1 AND school_id = $2 AND is_active = true`,
      [createDto.subjectCode, createDto.schoolId],
    );

    if (existing) {
      throw new BadRequestException('Subject code already exists');
    }

    return this.db.insert<Subject>(
      `INSERT INTO subjects (school_id, subject_code, subject_name_en, subject_name_np, subject_type, subject_group, credit_hours, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING *`,
      [
        createDto.schoolId,
        createDto.subjectCode,
        createDto.subjectName,
        createDto.subjectNameNepali || null,
        createDto.subjectType || 'COMPULSORY',
        createDto.subjectGroup || null,
        createDto.creditHours || 0,
      ],
    );
  }

  async findAll(schoolId: number, query?: any): Promise<Subject[]> {
    let sql = `SELECT * FROM subjects WHERE school_id = $1 AND is_active = true`;
    const params: any[] = [schoolId];

    if (query?.subjectGroup) {
      params.push(query.subjectGroup);
      sql += ` AND subject_group = $${params.length}`;
    }
    if (query?.isActive !== undefined) {
      params.push(query.isActive);
      sql += ` AND is_active = $${params.length}`;
    }
    if (query?.search) {
      params.push(`%${query.search}%`);
      sql += ` AND (subject_name_en ILIKE $${params.length} OR subject_code ILIKE $${params.length})`;
    }

    sql += ` ORDER BY subject_name_en ASC`;
    return this.db.query<Subject>(sql, params);
  }

  async findOne(id: number, schoolId?: number): Promise<Subject> {
    const subject = await this.db.queryOne<Subject>(
      schoolId
        ? `SELECT * FROM subjects WHERE subject_id = $1 AND school_id = $2 AND is_active = true`
        : `SELECT * FROM subjects WHERE subject_id = $1 AND is_active = true`,
      schoolId ? [id, schoolId] : [id],
    );

    if (!subject) {
      throw new NotFoundException(`Subject with ID ${id} not found`);
    }

    return subject;
  }

  async update(
    id: number,
    schoolId: number,
    updateDto: UpdateSubjectDto,
  ): Promise<Subject> {
    await this.findOne(id, schoolId);

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      subjectName: 'subject_name_en',
      subjectNameNepali: 'subject_name_np',
      subjectType: 'subject_type',
      creditHours: 'credit_hours',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updateDto[key as keyof UpdateSubjectDto] !== undefined) {
        updates.push(`${dbField} = $${paramIndex++}`);
        params.push(updateDto[key as keyof UpdateSubjectDto]);
      }
    }

    if (updates.length > 0) {
      params.push(id, schoolId);
      await this.db.query(
        `UPDATE subjects SET ${updates.join(', ')}, updated_at = NOW() WHERE subject_id = $${paramIndex} AND school_id = $${paramIndex + 1}`,
        params,
      );
    }

    return this.findOne(id, schoolId);
  }

  async remove(id: number, schoolId: number): Promise<void> {
    await this.findOne(id, schoolId);
    await this.db.query(
      `UPDATE subjects SET is_active = false, deleted_at = NOW() WHERE subject_id = $1 AND school_id = $2`,
      [id, schoolId],
    );
  }

  async getSubjectsByGroup(
    schoolId: number,
    group: string,
  ): Promise<Subject[]> {
    return this.db.query<Subject>(
      `SELECT * FROM subjects WHERE school_id = $1 AND subject_group = $2 AND is_active = true ORDER BY subject_name_en ASC`,
      [schoolId, group],
    );
  }
}
